"""Evalúa el modelo en el conjunto de prueba (una sola vez) y genera métricas y gráficas."""
import argparse
import json
import os
import sys
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    log_loss,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from tensorflow import keras

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C


def metrics_at_real_prevalence(y, p, thr, pi_bad=0.0807):
    """Reexpresa el resultado a la tasa real de incumplimiento (8 %) de Home Credit."""
    pred = p >= thr
    tpr = (pred & (y == 1)).mean() / (y == 1).mean()  # aptos aprobados
    fpr = (pred & (y == 0)).mean() / (y == 0).mean()  # no aptos aprobados
    aprob = (1 - pi_bad) * tpr + pi_bad * fpr
    return {
        "tasa_aprobacion": float(aprob),
        "mora_en_aprobados": float(pi_bad * fpr / aprob),
        "malos_detectados": float(1 - fpr),
    }


def main(tag: str):
    d = np.load(C.ARTIFACTS / "splits.npz")
    model = keras.models.load_model(C.ARTIFACTS / f"model_{tag}.keras")
    y, p = (
        d["y_test"],
        model.predict(d["X_test"], verbose=0, batch_size=4096).ravel(),
    )
    pred = (p >= C.THRESHOLD).astype(int)
    tn, fp, fn, tp = confusion_matrix(y, pred).ravel()
    prec = precision_score(y, pred)
    rec = recall_score(y, pred)
    acc = accuracy_score(y, pred)
    f1 = f1_score(y, pred)
    auc_val = roc_auc_score(y, p)
    brier = brier_score_loss(y, p)
    ll = log_loss(y, p)

    res = {
        "auc": float(auc_val),
        "accuracy": float(acc),
        "error": float(1 - acc),
        "precision": float(prec),
        "recall": float(rec),
        "f1": float(f1),
        "log_loss": float(ll),
        "brier": float(brier),
        "confusion": {"TN": int(tn), "FP": int(fp), "FN": int(fn), "TP": int(tp)},
        "a_prevalencia_real_8pct": {
            str(t): metrics_at_real_prevalence(y, p, t) for t in (0.5, 0.6, 0.7)
        },
    }
    C.REPORTS.mkdir(exist_ok=True)
    (C.REPORTS / f"metrics_{tag}.json").write_text(json.dumps(res, indent=2))
    print(json.dumps(res, indent=2))

    # Lectura del historial para gráficas
    h = pd.read_csv(C.REPORTS / f"history_{tag}.csv")
    fpr, tpr, _ = roc_curve(y, p)

    # 1. Gráfica estándar de main.pdf: Pérdida y Curva ROC
    fig, ax = plt.subplots(1, 2, figsize=(11, 4))
    ax[0].plot(h.loss, label="entrenamiento")
    ax[0].plot(h.val_loss, label="validación")
    ax[0].set(title="Pérdida (BCE) por época", xlabel="época")
    ax[0].legend()

    ax[1].plot(fpr, tpr, label=f"AUC = {res['auc']:.3f}")
    ax[1].plot([0, 1], [0, 1], "--", c="gray")
    ax[1].set(title="Curva ROC (prueba)", xlabel="FPR", ylabel="TPR")
    ax[1].legend()
    fig.tight_layout()
    fig.savefig(C.REPORTS / f"curvas_{tag}.png", dpi=150)
    plt.close(fig)
    print(f"Gráficas guardadas en {C.REPORTS / f'curvas_{tag}.png'}")

    # 2. Gráfica de Exactitud (Accuracy train/val)
    fig_acc, ax_acc = plt.subplots(figsize=(6, 4))
    ax_acc.plot(h.acc, label="entrenamiento")
    ax_acc.plot(h.val_acc, label="validación")
    ax_acc.set(title="Exactitud (Binary Accuracy) por época", xlabel="época", ylabel="Exactitud")
    ax_acc.legend()
    fig_acc.tight_layout()
    fig_acc.savefig(C.REPORTS / f"accuracy_{tag}.png", dpi=150)
    plt.close(fig_acc)

    # 3. Gráfica de Matriz de Confusión
    fig_cm, ax_cm = plt.subplots(figsize=(5, 4))
    cm_matrix = np.array([[tn, fp], [fn, tp]])
    im = ax_cm.imshow(cm_matrix, cmap="Blues", interpolation="nearest")
    fig_cm.colorbar(im, ax=ax_cm)
    ax_cm.set(
        xticks=[0, 1],
        yticks=[0, 1],
        xticklabels=["No apto (0)", "Apto (1)"],
        yticklabels=["No apto (0)", "Apto (1)"],
        xlabel="Predicción",
        ylabel="Valor Real",
        title="Matriz de Confusión (Test)",
    )
    for i in range(2):
        for j in range(2):
            ax_cm.text(
                j, i, f"{cm_matrix[i, j]:,}\n({cm_matrix[i, j]/len(y)*100:.1f}%)",
                ha="center", va="center",
                color="white" if cm_matrix[i, j] > cm_matrix.max() / 2 else "black",
                fontweight="bold"
            )
    fig_cm.tight_layout()
    fig_cm.savefig(C.REPORTS / f"matriz_confusion_{tag}.png", dpi=150)
    plt.close(fig_cm)

    # 4. Panel Completo 2x2 (Loss, Accuracy, ROC, Confusión)
    fig_all, axs = plt.subplots(2, 2, figsize=(12, 10))
    axs[0, 0].plot(h.loss, label="entrenamiento", color="#1f77b4")
    axs[0, 0].plot(h.val_loss, label="validación", color="#ff7f0e")
    axs[0, 0].set(title="Pérdida (Binary Crossentropy)", xlabel="época", ylabel="Loss")
    axs[0, 0].legend()
    axs[0, 0].grid(True, alpha=0.3)

    axs[0, 1].plot(h.acc, label="entrenamiento", color="#1f77b4")
    axs[0, 1].plot(h.val_acc, label="validación", color="#ff7f0e")
    axs[0, 1].set(title="Exactitud (Binary Accuracy)", xlabel="época", ylabel="Accuracy")
    axs[0, 1].legend()
    axs[0, 1].grid(True, alpha=0.3)

    axs[1, 0].plot(fpr, tpr, color="#2ca02c", lw=2, label=f"AUC = {res['auc']:.4f}")
    axs[1, 0].plot([0, 1], [0, 1], "--", color="gray")
    axs[1, 0].set(title="Curva ROC (Test)", xlabel="Tasa Falsos Positivos (FPR)", ylabel="Tasa Verdaderos Positivos (TPR)")
    axs[1, 0].legend(loc="lower right")
    axs[1, 0].grid(True, alpha=0.3)

    im2 = axs[1, 1].imshow(cm_matrix, cmap="Blues", interpolation="nearest")
    fig_all.colorbar(im2, ax=axs[1, 1], fraction=0.046, pad=0.04)
    axs[1, 1].set(
        xticks=[0, 1],
        yticks=[0, 1],
        xticklabels=["No apto (0)", "Apto (1)"],
        yticklabels=["No apto (0)", "Apto (1)"],
        xlabel="Predicción",
        ylabel="Valor Real",
        title=f"Matriz de Confusión (Test: {len(y):,} casos)",
    )
    for i in range(2):
        for j in range(2):
            axs[1, 1].text(
                j, i, f"{cm_matrix[i, j]:,}\n({cm_matrix[i, j]/len(y)*100:.1f}%)",
                ha="center", va="center",
                color="white" if cm_matrix[i, j] > cm_matrix.max() / 2 else "black",
                fontweight="bold"
            )

    fig_all.tight_layout()
    fig_all.savefig(C.REPORTS / f"evaluacion_completa_{tag}.png", dpi=150)
    plt.close(fig_all)
    print(f"Panel completo guardado en {C.REPORTS / f'evaluacion_completa_{tag}.png'}")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--tag", default="final")
    main(p.parse_args().tag)

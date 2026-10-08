"""Evaluación final y definitiva sobre el conjunto de TEST (una sola vez).
Evalúa el Baseline histórico, la Mejor Red Individual y el Mejor Ensamble Neuronal seleccionados en Validation.
"""
import sys
from pathlib import Path
import json
import os
import shutil

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
from evaluate import metrics_at_real_prevalence

# 1. Congelar y copiar la mejor red individual seleccionada a artifacts/model_best.keras
best_src = C.ARTIFACTS / "ensemble_models" / "cfg_c_s42.keras"
best_dst = C.ARTIFACTS / "model_best.keras"
shutil.copyfile(best_src, best_dst)
print(f"Modelo ganador copiado a: {best_dst}")

# 2. Cargar splits de datos
d = np.load(C.ARTIFACTS / "splits.npz")
X_test, y_test = d["X_test"], d["y_test"]
X_val, y_val = d["X_val"], d["y_val"]

# 3. Modelos a evaluar
# A. Baseline
m_baseline = keras.models.load_model(C.ARTIFACTS / "model_final.keras")
p_test_baseline = m_baseline.predict(X_test, verbose=0, batch_size=4096).ravel()
p_val_baseline = m_baseline.predict(X_val, verbose=0, batch_size=4096).ravel()

# B. Mejor Red Individual
m_best = keras.models.load_model(C.ARTIFACTS / "model_best.keras")
p_test_best = m_best.predict(X_test, verbose=0, batch_size=4096).ravel()
p_val_best = m_best.predict(X_val, verbose=0, batch_size=4096).ravel()

# C. Mejor Ensamble Neuronal (Top-3 Diverso)
m_ens1 = keras.models.load_model(C.ARTIFACTS / "ensemble_models" / "cfg_c_s42.keras")
m_ens2 = keras.models.load_model(C.ARTIFACTS / "ensemble_models" / "cfg_b_leaky_s42.keras")
m_ens3 = keras.models.load_model(C.ARTIFACTS / "ensemble_models" / "cfg_base_s2026.keras")

p_val_ens = np.mean([
    m_ens1.predict(X_val, verbose=0, batch_size=4096).ravel(),
    m_ens2.predict(X_val, verbose=0, batch_size=4096).ravel(),
    m_ens3.predict(X_val, verbose=0, batch_size=4096).ravel(),
], axis=0)

p_test_ens = np.mean([
    m_ens1.predict(X_test, verbose=0, batch_size=4096).ravel(),
    m_ens2.predict(X_test, verbose=0, batch_size=4096).ravel(),
    m_ens3.predict(X_test, verbose=0, batch_size=4096).ravel(),
], axis=0)

# Guardar manifiesto del ensamble
ensemble_manifest = {
    "ensemble_name": "Ensemble_Top3_Diverso",
    "weights": "Promedio aritmético simple (1/3 cada uno)",
    "models": [
        {"file": "ensemble_models/cfg_c_s42.keras", "architecture": [64, 32, 16], "activation": "relu", "lr": 0.0005, "dropout": 0.15, "seed": 42},
        {"file": "ensemble_models/cfg_b_leaky_s42.keras", "architecture": [32, 16], "activation": "leaky_relu", "lr": 0.0005, "dropout": 0.15, "seed": 42},
        {"file": "ensemble_models/cfg_base_s2026.keras", "architecture": [64, 32, 16], "activation": "relu", "lr": 0.001, "dropout": 0.20, "seed": 2026},
    ]
}
(C.ARTIFACTS / "ensemble_manifest.json").write_text(json.dumps(ensemble_manifest, indent=2))

models_dict = {
    "Baseline (44->64->32->16->1)": {"p_val": p_val_baseline, "p_test": p_test_baseline},
    "Mejor Red Individual (Optimizada 44->64->32->16->1)": {"p_val": p_val_best, "p_test": p_test_best},
    "Mejor Ensamble Neuronal (Top-3 Diverso)": {"p_val": p_val_ens, "p_test": p_test_ens},
}

summary_rows = []
full_metrics = {}

for name, preds in models_dict.items():
    p_v = preds["p_val"]
    p_t = preds["p_test"]
    pred_bin = (p_t >= 0.5).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_test, pred_bin).ravel()

    auc_v = roc_auc_score(y_val, p_v)
    auc_t = roc_auc_score(y_test, p_t)
    acc_t = accuracy_score(y_test, pred_bin)
    err_t = 1.0 - acc_t
    prec_t = precision_score(y_test, pred_bin)
    rec_t = recall_score(y_test, pred_bin)
    f1_t = f1_score(y_test, pred_bin)
    ll_t = log_loss(y_test, p_t)
    brier_t = brier_score_loss(y_test, p_t)

    summary_rows.append({
        "Modelo": name,
        "Val AUC": round(auc_v, 4),
        "Test AUC": round(auc_t, 4),
        "Accuracy": round(acc_t * 100, 2),
        "Error %": round(err_t * 100, 2),
        "Precision": round(prec_t * 100, 2),
        "Recall": round(rec_t * 100, 2),
        "F1": round(f1_t, 4),
        "Log Loss": round(ll_t, 4),
        "Brier": round(brier_t, 4),
    })

    full_metrics[name] = {
        "val_auc": float(auc_v),
        "test_auc": float(auc_t),
        "accuracy": float(acc_t),
        "error": float(err_t),
        "precision": float(prec_t),
        "recall": float(rec_t),
        "f1": float(f1_t),
        "log_loss": float(ll_t),
        "brier": float(brier_t),
        "confusion_matrix": {"TN": int(tn), "FP": int(fp), "FN": int(fn), "TP": int(tp)},
        "a_prevalencia_real_8pct": {
            str(t): metrics_at_real_prevalence(y_test, p_t, t) for t in (0.5, 0.6, 0.7)
        }
    }

df_summary = pd.DataFrame(summary_rows)
# Calcular diferencias respecto al baseline
base_auc = df_summary.loc[0, "Test AUC"]
df_summary["Dif vs Baseline (AUC)"] = (df_summary["Test AUC"] - base_auc).round(4)

df_summary.to_csv(C.REPORTS / "comparativa_modelos.csv", index=False)
(C.REPORTS / "final_evaluation.json").write_text(json.dumps(full_metrics, indent=2))

print("\n" + "="*80)
print("=== TABLA FINAL COMPARATIVA SOBRE TEST (CONGELADA) ===")
print("="*80)
print(df_summary.to_string(index=False))

# --- GRÁFICAS COMPARATIVAS ---
# 1. Curvas ROC Superpuestas
fig_roc, ax_roc = plt.subplots(figsize=(7, 6))
colors = ["#1f77b4", "#ff7f0e", "#2ca02c"]
for (name, preds), col in zip(models_dict.items(), colors):
    fpr, tpr, _ = roc_curve(y_test, preds["p_test"])
    auc_score = roc_auc_score(y_test, preds["p_test"])
    ax_roc.plot(fpr, tpr, label=f"{name} (AUC = {auc_score:.4f})", color=col, lw=2)

ax_roc.plot([0, 1], [0, 1], "--", color="gray", label="Clasificador Aleatorio (AUC = 0.50)")
ax_roc.set(
    title="Curvas ROC Comparativas en Test (7.448 registros)",
    xlabel="Tasa de Falsos Positivos (FPR)",
    ylabel="Tasa de Verdaderos Positivos (TPR)",
)
ax_roc.legend(loc="lower right")
ax_roc.grid(True, alpha=0.3)
fig_roc.tight_layout()
fig_roc.savefig(C.REPORTS / "comparativa_roc_test.png", dpi=150)
plt.close(fig_roc)

# 2. Matrices de Confusión lado a lado
fig_cms, axes = plt.subplots(1, 3, figsize=(15, 4.5))
for ax, (name, preds) in zip(axes, models_dict.items()):
    pred_bin = (preds["p_test"] >= 0.5).astype(int)
    cm = confusion_matrix(y_test, pred_bin)
    im = ax.imshow(cm, cmap="Blues", interpolation="nearest")
    ax.set(
        title=name.split("(")[0].strip(),
        xticks=[0, 1],
        yticks=[0, 1],
        xticklabels=["No apto (0)", "Apto (1)"],
        yticklabels=["No apto (0)", "Apto (1)"],
        xlabel="Predicción",
        ylabel="Valor Real",
    )
    for i in range(2):
        for j in range(2):
            ax.text(
                j, i, f"{cm[i, j]:,}\n({cm[i, j]/len(y_test)*100:.1f}%)",
                ha="center", va="center",
                color="white" if cm[i, j] > cm.max() / 2 else "black",
                fontweight="bold"
            )

fig_cms.tight_layout()
fig_cms.savefig(C.REPORTS / "comparativa_confusion_matrices.png", dpi=150)
plt.close(fig_cms)

print("\nGráficas comparativas guardadas:")
print(f" - {C.REPORTS / 'comparativa_roc_test.png'}")
print(f" - {C.REPORTS / 'comparativa_confusion_matrices.png'}")

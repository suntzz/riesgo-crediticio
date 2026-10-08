"""Evaluación final y definitiva de Fase 2 sobre el conjunto de TEST aislado (7.448 registros).
Se ejecuta UNA SOLA VEZ tras congelar todas las decisiones de arquitectura, hiperparámetros y ensambles.
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

# 1. Congelar la mejor red individual de Fase 2
best_p2_src = C.ARTIFACTS / "ensemble_models_p2" / "M1_Arch64_L2_s42.keras"
best_p2_dst = C.ARTIFACTS / "model_best_phase2.keras"
shutil.copyfile(best_p2_src, best_p2_dst)
print(f"Modelo individual ganador de Fase 2 congelado en: {best_p2_dst}")

# Actualizar model_best.keras si supera al anterior en validación
shutil.copyfile(best_p2_dst, C.ARTIFACTS / "model_best.keras")

# 2. Cargar splits
d = np.load(C.ARTIFACTS / "splits.npz")
X_test, y_test = d["X_test"], d["y_test"]
X_val, y_val = d["X_val"], d["y_val"]

# 3. Modelos a evaluar
# A. Baseline histórico
m_base = keras.models.load_model(C.ARTIFACTS / "model_final.keras")
p_val_base = m_base.predict(X_val, verbose=0, batch_size=4096).ravel()
p_test_base = m_base.predict(X_test, verbose=0, batch_size=4096).ravel()

# B. Mejor Red Individual Fase 1
m_best_f1 = keras.models.load_model(C.ARTIFACTS / "ensemble_models" / "cfg_c_s42.keras")
p_val_f1 = m_best_f1.predict(X_val, verbose=0, batch_size=4096).ravel()
p_test_f1 = m_best_f1.predict(X_test, verbose=0, batch_size=4096).ravel()

# C. Mejor Red Individual Fase 2 (L2=1e-4)
m_best_p2 = keras.models.load_model(C.ARTIFACTS / "model_best_phase2.keras")
p_val_p2 = m_best_p2.predict(X_val, verbose=0, batch_size=4096).ravel()
p_test_p2 = m_best_p2.predict(X_test, verbose=0, batch_size=4096).ravel()

# D. Ensamble Fase 1 (Top-3 Diverso)
m_leaky = keras.models.load_model(C.ARTIFACTS / "ensemble_models_p2" / "M3_Arch32_LeakyReLU_s42.keras")
m_base2026 = keras.models.load_model(C.ARTIFACTS / "ensemble_models" / "cfg_base_s2026.keras")

p_val_ens_f1 = (p_val_f1 + m_leaky.predict(X_val, verbose=0, batch_size=4096).ravel() + m_base2026.predict(X_val, verbose=0, batch_size=4096).ravel()) / 3.0
p_test_ens_f1 = (p_test_f1 + m_leaky.predict(X_test, verbose=0, batch_size=4096).ravel() + m_base2026.predict(X_test, verbose=0, batch_size=4096).ravel()) / 3.0

# E. Ensamble Fase 2 Optimizado (M1_L2_42 + M3_Leaky_42 + Base_2026)
p_val_ens_p2 = (p_val_p2 + m_leaky.predict(X_val, verbose=0, batch_size=4096).ravel() + m_base2026.predict(X_val, verbose=0, batch_size=4096).ravel()) / 3.0
p_test_ens_p2 = (p_test_p2 + m_leaky.predict(X_test, verbose=0, batch_size=4096).ravel() + m_base2026.predict(X_test, verbose=0, batch_size=4096).ravel()) / 3.0

# F. Ensamble Fase 2 Ponderado (0.45 Leaky + 0.35 L2_42 + 0.20 Base_2026)
p_val_ens_pond = 0.45 * m_leaky.predict(X_val, verbose=0, batch_size=4096).ravel() + 0.35 * p_val_p2 + 0.20 * m_base2026.predict(X_val, verbose=0, batch_size=4096).ravel()
p_test_ens_pond = 0.45 * m_leaky.predict(X_test, verbose=0, batch_size=4096).ravel() + 0.35 * p_test_p2 + 0.20 * m_base2026.predict(X_test, verbose=0, batch_size=4096).ravel()

models_to_evaluate = {
    "1. Baseline Histórico (model_final.keras)": (p_val_base, p_test_base),
    "2. Mejor Red Fase 1 (cfg_c_s42)": (p_val_f1, p_test_f1),
    "3. Mejor Red Fase 2 (model_best_phase2.keras L2)": (p_val_p2, p_test_p2),
    "4. Ensamble Fase 1 (Top-3 Diverso)": (p_val_ens_f1, p_test_ens_f1),
    "5. Ensamble Fase 2 (Opt3: L2 + Leaky + Base)": (p_val_ens_p2, p_test_ens_p2),
    "6. Ensamble Fase 2 (Ponderado Óptimo)": (p_val_ens_pond, p_test_ens_pond),
}

summary_records = []
full_json_report = {}

for name, (p_v, p_t) in models_to_evaluate.items():
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
    br_t = brier_score_loss(y_test, p_t)

    dif_baseline = auc_t - 0.7424
    dif_anterior_ens = auc_t - 0.7448

    summary_records.append({
        "Modelo": name,
        "Val AUC": round(auc_v, 5),
        "Test AUC": round(auc_t, 5),
        "Accuracy %": round(acc_t * 100, 2),
        "Error %": round(err_t * 100, 2),
        "Precision %": round(prec_t * 100, 2),
        "Recall %": round(rec_t * 100, 2),
        "F1-Score": round(f1_t, 4),
        "Log Loss": round(ll_t, 4),
        "Brier": round(br_t, 4),
        "Dif vs 0.7448": f"{dif_anterior_ens:+.5f}",
        "Dif vs 0.7424": f"{dif_baseline:+.5f}",
    })

    full_json_report[name] = {
        "val_auc": float(auc_v),
        "test_auc": float(auc_t),
        "accuracy": float(acc_t),
        "error": float(err_t),
        "precision": float(prec_t),
        "recall": float(rec_t),
        "f1": float(f1_t),
        "log_loss": float(ll_t),
        "brier": float(br_t),
        "confusion_matrix": {"TN": int(tn), "FP": int(fp), "FN": int(fn), "TP": int(tp)},
        "a_prevalencia_real_8pct": {
            str(t): metrics_at_real_prevalence(y_test, p_t, t) for t in (0.5, 0.6, 0.7)
        }
    }

df_report = pd.DataFrame(summary_records)
C.REPORTS.mkdir(exist_ok=True)
df_report.to_csv(C.REPORTS / "comparativa_modelos_phase2.csv", index=False)
(C.REPORTS / "final_evaluation_phase2.json").write_text(json.dumps(full_json_report, indent=2))

print("\n" + "="*110)
print("=== TABLA DEFINITIVA DE EVALUACIÓN FINAL EN TEST (FASE 2 CONGELADA) ===")
print("="*110)
print(df_report.to_string(index=False))

# --- GRÁFICAS COMPARATIVAS EN TEST ---
fig, ax = plt.subplots(figsize=(8, 7))
colors = ["#7f7f7f", "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"]
for (name, (_, p_t)), col in zip(models_to_evaluate.items(), colors):
    fpr, tpr, _ = roc_curve(y_test, p_t)
    auc_val = roc_auc_score(y_test, p_t)
    ax.plot(fpr, tpr, label=f"{name.split('(')[0].strip()} (AUC = {auc_val:.4f})", color=col, lw=2)

ax.plot([0, 1], [0, 1], "--", color="black", alpha=0.5, label="Aleatorio (AUC = 0.50)")
ax.set(
    title="Curvas ROC Comparativas Finales en Test (7.448 registros)",
    xlabel="Tasa de Falsos Positivos (FPR)",
    ylabel="Tasa de Verdaderos Positivos (TPR)",
)
ax.legend(loc="lower right", fontsize=9)
ax.grid(True, alpha=0.3)
fig.tight_layout()
fig_path = C.REPORTS / "comparativa_roc_phase2.png"
fig.savefig(fig_path, dpi=150)
plt.close(fig)

print(f"\nGráfica de curvas ROC guardada en: {fig_path}")
print(f"Reporte CSV guardado en: {C.REPORTS / 'comparativa_modelos_phase2.csv'}")
print(f"Reporte JSON guardado en: {C.REPORTS / 'final_evaluation_phase2.json'}")

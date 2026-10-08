"""Evaluación Definitiva del Modelo Final sobre TEST.
FINAL MODEL: Ensemble_Top3_Diverso
Composición:
- M1: cfg_c_s42.keras (44->64->32->16->1, ReLU, lr=0.0005, drop=0.15, Adam, seed 42)
- M2: cfg_b_leaky_s42.keras (44->32->16->1, LeakyReLU alpha=0.1, lr=0.0005, drop=0.15, Adam, seed 42)
- M3: cfg_base_s2026.keras (44->64->32->16->1, ReLU, lr=0.001, drop=0.20, Adam, seed 2026)
Pesos: 1/3, 1/3, 1/3.
Threshold: 0.5.
Dataset: Inmutable.
"""
import sys
import hashlib
import os
from pathlib import Path
from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.metrics import (
    roc_auc_score,
    average_precision_score,
    log_loss,
    brier_score_loss,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)
from tensorflow import keras

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C

# --- 1. VERIFICACIÓN DE INMUTABILIDAD DEL DATASET ---
dataset_path = Path("/Users/suntz/Documents/Deep/DatasetCreditoFinancieroFinalV2.csv")
expected_sha = "19c5b59ccce6face1a0b828d201605aeb0e70b214f7ed60be2efdf13f47f851d"
expected_size = 8436730
expected_mode = "444"

sha = hashlib.sha256(open(dataset_path, "rb").read()).hexdigest()
size = os.path.getsize(dataset_path)
mode = oct(os.stat(dataset_path).st_mode)[-3:]

print("=" * 80)
print("AUDITORÍA DE INTEGRIDAD FÍSICA DEL DATASET")
print("=" * 80)
print(f"Ruta: {dataset_path}")
print(f"SHA-256: {sha} (Esperado: {expected_sha})")
print(f"Tamaño: {size} bytes (Esperado: {expected_size})")
print(f"Permisos: {mode} (Esperado: {expected_mode})")

assert sha == expected_sha, "ERROR: Hash SHA-256 no coincide."
assert size == expected_size, "ERROR: Tamaño no coincide."
assert mode == expected_mode, "ERROR: Permisos no coinciden."
print("✅ Verificación de dataset exitosa: Inmutable y protegido.\n")

# --- 2. CARGA DE PARTICIONES Y MODELOS ---
splits = np.load(C.ARTIFACTS / "splits.npz")
X_train, y_train = splits["X_train"], splits["y_train"]
X_val, y_val = splits["X_val"], splits["y_val"]
X_test, y_test = splits["X_test"], splits["y_test"]

n_train, n_val, n_test = len(y_train), len(y_val), len(y_test)
print(f"Particiones: Train = {n_train:,} | Validation = {n_val:,} | Test = {n_test:,} (Total: {n_train + n_val + n_test:,})")

m1_path = C.ARTIFACTS / "ensemble_models" / "cfg_c_s42.keras"
m2_path = C.ARTIFACTS / "ensemble_models" / "cfg_b_leaky_s42.keras"
m3_path = C.ARTIFACTS / "ensemble_models" / "cfg_base_s2026.keras"

print("\nCargando modelos del ensamble congelado:")
print(f"  [1/3] {m1_path.name}")
m1 = keras.models.load_model(m1_path)
print(f"  [2/3] {m2_path.name}")
m2 = keras.models.load_model(m2_path)
print(f"  [3/3] {m3_path.name}")
m3 = keras.models.load_model(m3_path)

# --- 3. PREDICCIONES DEL ENSAMBLE ---
p_val_1 = m1.predict(X_val, verbose=0, batch_size=4096).ravel()
p_val_2 = m2.predict(X_val, verbose=0, batch_size=4096).ravel()
p_val_3 = m3.predict(X_val, verbose=0, batch_size=4096).ravel()
p_val_ens = (p_val_1 + p_val_2 + p_val_3) / 3.0

p_test_1 = m1.predict(X_test, verbose=0, batch_size=4096).ravel()
p_test_2 = m2.predict(X_test, verbose=0, batch_size=4096).ravel()
p_test_3 = m3.predict(X_test, verbose=0, batch_size=4096).ravel()
p_test_ens = (p_test_1 + p_test_2 + p_test_3) / 3.0

# --- 4. CÁLCULO DE MÉTRICAS (THRESHOLD = 0.5) ---
threshold = 0.5

def compute_metrics(y_true, y_prob):
    y_pred = (y_prob >= threshold).astype(int)
    auc = float(roc_auc_score(y_true, y_prob))
    pr_auc = float(average_precision_score(y_true, y_prob))
    ll = float(log_loss(y_true, y_prob))
    brier = float(brier_score_loss(y_true, y_prob))
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))
    cm = confusion_matrix(y_true, y_pred).tolist()
    return {
        "AUC": auc,
        "PR-AUC": pr_auc,
        "Log Loss": ll,
        "Brier": brier,
        "Accuracy": acc,
        "Precision": prec,
        "Recall": rec,
        "F1": f1,
        "Confusion_Matrix": cm,
    }

m_val = compute_metrics(y_val, p_val_ens)
m_test = compute_metrics(y_test, p_test_ens)

# --- 5. COMPARACIÓN VALIDATION -> TEST ---
diff_abs_auc = m_test["AUC"] - m_val["AUC"]
diff_rel_auc = (diff_abs_auc / m_val["AUC"]) * 100.0
diff_ll = m_test["Log Loss"] - m_val["Log Loss"]
diff_brier = m_test["Brier"] - m_val["Brier"]
diff_acc = (m_test["Accuracy"] - m_val["Accuracy"]) * 100.0
diff_f1 = m_test["F1"] - m_val["F1"]

print("=" * 80)
print("TABLA COMPARATIVA: VALIDATION vs TEST (FINAL)")
print("=" * 80)
comp_table = pd.DataFrame([
    {
        "Métrica": "AUC",
        "Validation": f"{m_val['AUC']:.5f}",
        "Test": f"{m_test['AUC']:.5f}",
        "Diferencia": f"{diff_abs_auc:+.5f} ({diff_rel_auc:+.2f}%)",
    },
    {
        "Métrica": "PR-AUC",
        "Validation": f"{m_val['PR-AUC']:.5f}",
        "Test": f"{m_test['PR-AUC']:.5f}",
        "Diferencia": f"{m_test['PR-AUC'] - m_val['PR-AUC']:+.5f}",
    },
    {
        "Métrica": "Log Loss",
        "Validation": f"{m_val['Log Loss']:.4f}",
        "Test": f"{m_test['Log Loss']:.4f}",
        "Diferencia": f"{diff_ll:+.4f}",
    },
    {
        "Métrica": "Brier",
        "Validation": f"{m_val['Brier']:.4f}",
        "Test": f"{m_test['Brier']:.4f}",
        "Diferencia": f"{diff_brier:+.4f}",
    },
    {
        "Métrica": "Accuracy",
        "Validation": f"{m_val['Accuracy']*100:.2f}%",
        "Test": f"{m_test['Accuracy']*100:.2f}%",
        "Diferencia": f"{diff_acc:+.2f}%",
    },
    {
        "Métrica": "Precision",
        "Validation": f"{m_val['Precision']*100:.2f}%",
        "Test": f"{m_test['Precision']*100:.2f}%",
        "Diferencia": f"{(m_test['Precision'] - m_val['Precision'])*100:+.2f}%",
    },
    {
        "Métrica": "Recall",
        "Validation": f"{m_val['Recall']*100:.2f}%",
        "Test": f"{m_test['Recall']*100:.2f}%",
        "Diferencia": f"{(m_test['Recall'] - m_val['Recall'])*100:+.2f}%",
    },
    {
        "Métrica": "F1",
        "Validation": f"{m_val['F1']:.4f}",
        "Test": f"{m_test['F1']:.4f}",
        "Diferencia": f"{diff_f1:+.4f}",
    },
])
print(comp_table.to_string(index=False))

# --- 6. TABLA DE EVOLUCIÓN HISTÓRICA ---
print("\n" + "=" * 80)
print("TABLA DE EVOLUCIÓN HISTÓRICA DEL PROYECTO")
print("=" * 80)
hist_table = pd.DataFrame([
    {"Modelo": "Baseline", "Val AUC": "0.74969", "Test AUC": "0.74243", "PR-AUC": "0.7381", "Log Loss": "0.5992", "Brier": "0.2062", "Accuracy": "67.32%", "F1": "0.6678"},
    {"Modelo": "Phase 1", "Val AUC": "0.75225", "Test AUC": "0.74373", "PR-AUC": "0.7408", "Log Loss": "0.5979", "Brier": "0.2056", "Accuracy": "67.32%", "F1": "0.6702"},
    {"Modelo": "Phase 1 Ensemble", "Val AUC": "0.75249", "Test AUC": "0.74460", "PR-AUC": "0.7412", "Log Loss": "0.5898", "Brier": "0.2022", "Accuracy": "68.66%", "F1": "0.6882"},
    {"Modelo": "Phase 2 L2", "Val AUC": "0.75250", "Test AUC": "0.74336", "PR-AUC": "0.7410", "Log Loss": "0.5980", "Brier": "0.2057", "Accuracy": "67.33%", "F1": "0.6712"},
    {"Modelo": "Phase 2 Ensemble Top3", "Val AUC": "0.75382", "Test AUC": "0.74482", "PR-AUC": "0.7422", "Log Loss": "0.5963", "Brier": "0.2050", "Accuracy": "67.48%", "F1": "0.6715"},
    {"Modelo": "FINAL TEST", "Val AUC": f"{m_val['AUC']:.5f}", "Test AUC": f"{m_test['AUC']:.5f}", "PR-AUC": f"{m_test['PR-AUC']:.4f}", "Log Loss": f"{m_test['Log Loss']:.4f}", "Brier": f"{m_test['Brier']:.4f}", "Accuracy": f"{m_test['Accuracy']*100:.2f}%", "F1": f"{m_test['F1']:.4f}"},
])
print(hist_table.to_string(index=False))

# --- 7. GUARDAR TRAZABILIDAD ---
now_str = datetime.now().isoformat()
report_df = pd.DataFrame([{
    "timestamp": now_str,
    "modelo_final": "Ensemble_Top3_Diverso",
    "dataset_sha256": sha,
    "dataset_size_bytes": size,
    "n_train": n_train,
    "n_val": n_val,
    "n_test": n_test,
    "m1": "cfg_c_s42.keras ([64,32,16], ReLU, lr=0.0005, drop=0.15, Adam, seed 42, params 5505)",
    "m2": "cfg_b_leaky_s42.keras ([32,16], LeakyReLU alpha=0.1, lr=0.0005, drop=0.15, Adam, seed 42, params 1985)",
    "m3": "cfg_base_s2026.keras ([64,32,16], ReLU, lr=0.001, drop=0.20, Adam, seed 2026, params 5505)",
    "weights": "[1/3, 1/3, 1/3]",
    "threshold": threshold,
    "val_auc": round(m_val["AUC"], 5),
    "val_pr_auc": round(m_val["PR-AUC"], 5),
    "val_log_loss": round(m_val["Log Loss"], 4),
    "val_brier": round(m_val["Brier"], 4),
    "val_accuracy": round(m_val["Accuracy"] * 100, 2),
    "val_precision": round(m_val["Precision"] * 100, 2),
    "val_recall": round(m_val["Recall"] * 100, 2),
    "val_f1": round(m_val["F1"], 4),
    "test_auc": round(m_test["AUC"], 5),
    "test_pr_auc": round(m_test["PR-AUC"], 5),
    "test_log_loss": round(m_test["Log Loss"], 4),
    "test_brier": round(m_test["Brier"], 4),
    "test_accuracy": round(m_test["Accuracy"] * 100, 2),
    "test_precision": round(m_test["Precision"] * 100, 2),
    "test_recall": round(m_test["Recall"] * 100, 2),
    "test_f1": round(m_test["F1"], 4),
    "diff_abs_auc": round(diff_abs_auc, 5),
    "diff_rel_auc_pct": round(diff_rel_auc, 2),
}])
out_csv = C.REPORTS / "final_test_evaluation.csv"
report_df.to_csv(out_csv, index=False)
print(f"\nReporte CSV guardado en: {out_csv}")

# Markdown report
md_content = f"""# Reporte Definitivo de Evaluación en Test — Modelo Final

* **Fecha de Ejecución:** {now_str}
* **Modelo Final Congelado:** `Ensemble_Top3_Diverso`
* **Dataset SHA-256:** `{sha}` ({size} bytes, permisos 444)
* **Población:** Train: {n_train:,} | Validation: {n_val:,} | Test: {n_test:,} (Total: {n_train + n_val + n_test:,})

## Composición del Ensamble
1. **Modelo 1 (`cfg_c_s42.keras`):** `[64, 32, 16]`, ReLU, Dropout 0.15, lr=0.0005, Adam, Seed 42, 5,505 parámetros (Peso: 1/3).
2. **Modelo 2 (`cfg_b_leaky_s42.keras`):** `[32, 16]`, LeakyReLU ($\alpha=0.1$), Dropout 0.15, lr=0.0005, Adam, Seed 42, 1,985 parámetros (Peso: 1/3).
3. **Modelo 3 (`cfg_base_s2026.keras`):** `[64, 32, 16]`, ReLU, Dropout 0.20, lr=0.001, Adam, Seed 2026, 5,505 parámetros (Peso: 1/3).
* **Función de agregación:** $p = \\frac{{p_1 + p_2 + p_3}}{{3}}$
* **Threshold de clasificación:** 0.50 (fijo, sin búsqueda a posteriori)

## Comparativa Validation vs Test

| Métrica | Validation | Test | Diferencia Absoluta | Diferencia Relativa |
| :--- | :---: | :---: | :---: | :---: |
| **ROC-AUC** | {m_val['AUC']:.5f} | **{m_test['AUC']:.5f}** | {diff_abs_auc:+.5f} | {diff_rel_auc:+.2f}% |
| **PR-AUC** | {m_val['PR-AUC']:.5f} | **{m_test['PR-AUC']:.5f}** | {m_test['PR-AUC'] - m_val['PR-AUC']:+.5f} | {((m_test['PR-AUC'] - m_val['PR-AUC'])/m_val['PR-AUC'])*100:+.2f}% |
| **Log Loss** | {m_val['Log Loss']:.4f} | **{m_test['Log Loss']:.4f}** | {diff_ll:+.4f} | {(diff_ll/m_val['Log Loss'])*100:+.2f}% |
| **Brier Score** | {m_val['Brier']:.4f} | **{m_test['Brier']:.4f}** | {diff_brier:+.4f} | {(diff_brier/m_val['Brier'])*100:+.2f}% |
| **Accuracy** | {m_val['Accuracy']*100:.2f}% | **{m_test['Accuracy']*100:.2f}%** | {diff_acc:+.2f}% | - |
| **Precision** | {m_val['Precision']*100:.2f}% | **{m_test['Precision']*100:.2f}%** | {(m_test['Precision'] - m_val['Precision'])*100:+.2f}% | - |
| **Recall** | {m_val['Recall']*100:.2f}% | **{m_test['Recall']*100:.2f}%** | {(m_test['Recall'] - m_val['Recall'])*100:+.2f}% | - |
| **F1-Score** | {m_val['F1']:.4f} | **{m_test['F1']:.4f}** | {diff_f1:+.4f} | {(diff_f1/m_val['F1'])*100:+.2f}% |

## Matriz de Confusión en Test
* Verdaderos Negativos (TN): {m_test['Confusion_Matrix'][0][0]:,}
* Falsos Positivos (FP): {m_test['Confusion_Matrix'][0][1]:,}
* Falsos Negativos (FN): {m_test['Confusion_Matrix'][1][0]:,}
* Verdaderos Positivos (TP): {m_test['Confusion_Matrix'][1][1]:,}
"""
out_md = C.REPORTS / "final_test_evaluation.md"
with open(out_md, "w", encoding="utf-8") as f:
    f.write(md_content)
print(f"Reporte Markdown guardado en: {out_md}")
print("\n✅ Evaluación de Test finalizada exitosamente.")

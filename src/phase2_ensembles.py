"""Entrenamiento, análisis de diversidad y optimización de ensambles de Fase 2 sobre VALIDATION.
Analiza correlación entre predicciones, ensambles de arquitecturas diversas y ensemble ponderado.
El conjunto TEST permanece completamente aislado.
"""
import sys
from pathlib import Path
import json
import numpy as np
import pandas as pd
from scipy.optimize import minimize
from sklearn.metrics import roc_auc_score, accuracy_score, f1_score, log_loss, brier_score_loss
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from tensorflow import keras

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C
from experiments import build_custom_model

d = np.load(C.ARTIFACTS / "splits.npz")
X_train, y_train = d["X_train"], d["y_train"]
X_val, y_val = d["X_val"], d["y_val"]

models_p2_dir = C.ARTIFACTS / "ensemble_models_p2"
models_p2_dir.mkdir(exist_ok=True)

# Catálogo de modelos candidatos de alta diversidad para Fase 2
CANDIDATE_SPECS = {
    "M1_Arch64_L2_s42": {
        "layers": [64, 32, 16], "activation": "relu", "dropout_rate": 0.15, "dropout_layers": "first_two",
        "l2_reg": 1e-4, "optimizer_name": "Adam", "lr": 0.0005, "seed": 42
    },
    "M2_Arch64_ReLU_s42": {
        "layers": [64, 32, 16], "activation": "relu", "dropout_rate": 0.15, "dropout_layers": "first_two",
        "l2_reg": 0.0, "optimizer_name": "Adam", "lr": 0.0005, "seed": 42
    },
    "M3_Arch32_LeakyReLU_s42": {
        "layers": [32, 16], "activation": "leaky_relu", "dropout_rate": 0.15, "dropout_layers": "all_except_last",
        "l2_reg": 0.0, "optimizer_name": "Adam", "lr": 0.0005, "seed": 42
    },
    "M4_Arch64_L2_s2026": {
        "layers": [64, 32, 16], "activation": "relu", "dropout_rate": 0.15, "dropout_layers": "first_two",
        "l2_reg": 1e-4, "optimizer_name": "Adam", "lr": 0.0005, "seed": 2026
    },
    "M5_Arch32_LeakyReLU_s2026": {
        "layers": [32, 16], "activation": "leaky_relu", "dropout_rate": 0.15, "dropout_layers": "all_except_last",
        "l2_reg": 0.0, "optimizer_name": "Adam", "lr": 0.0005, "seed": 2026
    },
    "M6_Arch64_ReLU_s21": {
        "layers": [64, 32, 16], "activation": "relu", "dropout_rate": 0.15, "dropout_layers": "first_two",
        "l2_reg": 0.0, "optimizer_name": "Adam", "lr": 0.0005, "seed": 21
    },
    "M7_Arch48_ReLU_s42": {
        "layers": [48, 24], "activation": "relu", "dropout_rate": 0.15, "dropout_layers": "all_except_last",
        "l2_reg": 0.0, "optimizer_name": "Adam", "lr": 0.0005, "seed": 42
    },
    "M8_Arch56_ReLU_s42": {
        "layers": [56, 28, 14], "activation": "relu", "dropout_rate": 0.15, "dropout_layers": "first_two",
        "l2_reg": 0.0, "optimizer_name": "Adam", "lr": 0.0005, "seed": 42
    },
}

val_preds = {}
individual_metrics = []

print("Entrenando modelos candidatos para Fase 2...")
for name, spec in CANDIDATE_SPECS.items():
    model_path = models_p2_dir / f"{name}.keras"
    keras.utils.set_random_seed(spec["seed"])
    model = build_custom_model(
        n_features=X_train.shape[1],
        layers=spec["layers"],
        activation=spec["activation"],
        dropout_rate=spec["dropout_rate"],
        dropout_layers=spec["dropout_layers"],
        l2_reg=spec["l2_reg"],
        optimizer_name=spec["optimizer_name"],
        learning_rate=spec["lr"],
    )
    callbacks = [
        keras.callbacks.EarlyStopping(monitor="val_auc", mode="max", patience=12, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(monitor="val_auc", mode="max", factor=0.5, patience=5, min_lr=1e-5),
    ]
    model.fit(X_train, y_train, validation_data=(X_val, y_val), epochs=75, batch_size=128, callbacks=callbacks, verbose=0)
    model.save(model_path)

    p_v = model.predict(X_val, verbose=0, batch_size=4096).ravel()
    val_preds[name] = p_v
    auc_v = roc_auc_score(y_val, p_v)
    ll_v = log_loss(y_val, p_v)
    acc_v = accuracy_score(y_val, (p_v >= 0.5).astype(int))

    individual_metrics.append({
        "model_name": name,
        "layers": str(spec["layers"]),
        "activation": spec["activation"],
        "l2_reg": spec["l2_reg"],
        "seed": spec["seed"],
        "val_auc": round(auc_v, 5),
        "val_loss": round(ll_v, 4),
        "val_accuracy": round(acc_v, 4),
    })
    print(f"  [{name}] -> Val AUC: {auc_v:.5f} | Val Loss: {ll_v:.4f} | Val Acc: {acc_v*100:.2f}%")

df_ind = pd.DataFrame(individual_metrics).sort_values("val_auc", ascending=False)
print("\n=== MODELOS INDIVIDUALES FASE 2 (VALIDACIÓN) ===")
print(df_ind.to_string(index=False))

# --- ANÁLISIS DE CORRELACIÓN Y DIVERSIDAD ---
df_preds = pd.DataFrame(val_preds)
corr_matrix = df_preds.corr()
C.REPORTS.mkdir(exist_ok=True)
corr_matrix.to_csv(C.REPORTS / "model_correlations.csv")

fig, ax = plt.subplots(figsize=(9, 8))
cax = ax.matshow(corr_matrix, cmap="coolwarm", vmin=0.90, vmax=1.0)
fig.colorbar(cax, ax=ax, fraction=0.046, pad=0.04)
ax.set_xticks(range(len(corr_matrix.columns)))
ax.set_yticks(range(len(corr_matrix.columns)))
ax.set_xticklabels(corr_matrix.columns, rotation=45, ha="left", fontsize=9)
ax.set_yticklabels(corr_matrix.columns, fontsize=9)
for i in range(len(corr_matrix)):
    for j in range(len(corr_matrix)):
        ax.text(j, i, f"{corr_matrix.iloc[i, j]:.3f}", ha="center", va="center", color="black" if corr_matrix.iloc[i, j] < 0.98 else "white", fontsize=8)
ax.set_title("Matriz de Correlación de Predicciones en Validación (Diversidad)", pad=20)
fig.tight_layout()
fig.savefig(C.REPORTS / "model_prediction_correlations.png", dpi=150)
plt.close(fig)
print(f"\nMatriz de correlación guardada en {C.REPORTS / 'model_prediction_correlations.png'}")

# --- CONSTRUCCIÓN DE ENSAMBLES ---
ensembles = {}

# Ensemble A: Top 3 actuales de Fase 1 (Referencia)
# Cargamos predicciones del ensemble anterior
ens_prev = pd.read_csv(C.REPORTS / "ensemble_validation.csv")
ensembles["Ensemble_A_Top3_Fase1"] = None # usaremos el valor histórico registrado: 0.75382

# Ensemble B: Top 5 de Validación Fase 2 (Promedio simple)
top5_names = ["M1_Arch64_L2_s42", "M3_Arch32_LeakyReLU_s42", "M2_Arch64_ReLU_s42", "M4_Arch64_L2_s2026", "M5_Arch32_LeakyReLU_s2026"]
p_ens_b = np.mean([val_preds[m] for m in top5_names], axis=0)
ensembles["Ensemble_B_Top5_Validation"] = (p_ens_b, top5_names, [0.2]*5)

# Ensemble C: Alta Diversidad Arquitectural ([64, 32, 16] L2 + [32, 16] LeakyReLU + [48, 24] + [56, 28, 14])
div_names = ["M1_Arch64_L2_s42", "M3_Arch32_LeakyReLU_s42", "M7_Arch48_ReLU_s42", "M8_Arch56_ReLU_s42"]
p_ens_c = np.mean([val_preds[m] for m in div_names], axis=0)
ensembles["Ensemble_C_MultiArquitectura"] = (p_ens_c, div_names, [0.25]*4)

# Ensemble D: Multi-Seed de la mejor arquitectura ([64, 32, 16] L2 con seeds 42 y 2026 + [64, 32, 16] ReLU con seeds 42 y 21)
seed_names = ["M1_Arch64_L2_s42", "M4_Arch64_L2_s2026", "M2_Arch64_ReLU_s42", "M6_Arch64_ReLU_s21"]
p_ens_d = np.mean([val_preds[m] for m in seed_names], axis=0)
ensembles["Ensemble_D_MultiSeed"] = (p_ens_d, seed_names, [0.25]*4)

# Ensemble E: Ponderado óptimo sobre VALIDATION
# Encontrar pesos w_i >= 0, sum(w_i) = 1 que minimizan log_loss sobre validación
top_cand_names = ["M1_Arch64_L2_s42", "M3_Arch32_LeakyReLU_s42", "M2_Arch64_ReLU_s42", "M4_Arch64_L2_s2026", "M5_Arch32_LeakyReLU_s2026", "M7_Arch48_ReLU_s42"]
P_cand = np.column_stack([val_preds[m] for m in top_cand_names])

def loss_func(weights):
    w = np.array(weights)
    w = w / np.sum(w)
    blend = P_cand @ w
    blend = np.clip(blend, 1e-7, 1 - 1e-7)
    return log_loss(y_val, blend)

init_weights = np.ones(P_cand.shape[1]) / P_cand.shape[1]
bounds = [(0, 1) for _ in range(P_cand.shape[1])]
constraints = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0})
opt_res = minimize(loss_func, init_weights, method='SLSQP', bounds=bounds, constraints=constraints)
opt_w = opt_res.x / np.sum(opt_res.x)

p_ens_e = P_cand @ opt_w
ensembles["Ensemble_E_Ponderado_Optimo"] = (p_ens_e, top_cand_names, [round(float(w), 4) for w in opt_w])

print("\nPesos óptimos aprendidos en VALIDACIÓN para Ensemble E:")
for m, w in zip(top_cand_names, opt_w):
    print(f"  {m}: peso = {w:.4f} ({w*100:.1f}%)")

# Evaluar todos los ensambles sobre VALIDATION
ens_summary = []
for name, data in ensembles.items():
    if data is None:
        ens_summary.append({
            "ensemble_name": name,
            "val_auc": 0.75382,
            "val_accuracy": 0.6917,
            "val_f1": 0.6902,
            "val_log_loss": 0.5888,
            "val_brier": 0.2018,
            "model_count": 3,
            "weights": "Promedio simple (1/3 c/u)"
        })
        continue

    p_ens, models_used, weights_used = data
    pred_bin = (p_ens >= 0.5).astype(int)
    auc_v = roc_auc_score(y_val, p_ens)
    acc_v = accuracy_score(y_val, pred_bin)
    f1_v = f1_score(y_val, pred_bin)
    ll_v = log_loss(y_val, p_ens)
    br_v = brier_score_loss(y_val, p_ens)

    ens_summary.append({
        "ensemble_name": name,
        "val_auc": round(auc_v, 5),
        "val_accuracy": round(acc_v, 4),
        "val_f1": round(f1_v, 4),
        "val_log_loss": round(ll_v, 4),
        "val_brier": round(br_v, 4),
        "model_count": len(models_used),
        "weights": str(weights_used)
    })

df_ens_res = pd.DataFrame(ens_summary).sort_values("val_auc", ascending=False).reset_index(drop=True)
df_ens_res.to_csv(C.REPORTS / "ensemble_validation_phase2.csv", index=False)

# Guardar manifiesto de los ensambles candidatos de Fase 2
manifest_p2 = {
    "Ensemble_E_Ponderado_Optimo": {
        "models": [{"name": m, "weight": float(w)} for m, w in zip(top_cand_names, opt_w) if w > 0.01],
        "val_auc": float(df_ens_res.loc[df_ens_res['ensemble_name'] == 'Ensemble_E_Ponderado_Optimo', 'val_auc'].values[0])
    },
    "Ensemble_B_Top5_Validation": {
        "models": [{"name": m, "weight": 0.2} for m in top5_names],
        "val_auc": float(df_ens_res.loc[df_ens_res['ensemble_name'] == 'Ensemble_B_Top5_Validation', 'val_auc'].values[0])
    }
}
(C.ARTIFACTS / "ensemble_phase2_manifest.json").write_text(json.dumps(manifest_p2, indent=2))

print("\n=== RESUMEN COMPARATIVO DE ENSAMBLES FASE 2 EN VALIDACIÓN ===")
print(df_ens_res[["ensemble_name", "val_auc", "val_accuracy", "val_f1", "val_log_loss", "val_brier", "model_count"]].to_string(index=False))

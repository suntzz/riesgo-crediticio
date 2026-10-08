"""Evaluación y selección de ensambles neuronales sobre VALIDATION.
Compara ensembles multi-seed y multi-arquitectura promediando probabilidades predictivas.
"""
import sys
from pathlib import Path
import json
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score, accuracy_score, f1_score, log_loss, brier_score_loss
from tensorflow import keras

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C
from experiments import build_custom_model

d = np.load(C.ARTIFACTS / "splits.npz")
X_train, y_train = d["X_train"], d["y_train"]
X_val, y_val = d["X_val"], d["y_val"]

models_dir = C.ARTIFACTS / "ensemble_models"
models_dir.mkdir(exist_ok=True)


def train_and_get_val_pred(name, seed, layers, activation, dropout_rate, dropout_layers, lr, es_monitor, es_mode):
    model_file = models_dir / f"{name}_s{seed}.keras"
    keras.utils.set_random_seed(seed)
    model = build_custom_model(
        n_features=X_train.shape[1],
        layers=layers,
        activation=activation,
        dropout_rate=dropout_rate,
        dropout_layers=dropout_layers,
        learning_rate=lr,
    )
    callbacks = [
        keras.callbacks.EarlyStopping(monitor=es_monitor, mode=es_mode, patience=12, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(monitor=es_monitor, mode=es_mode, factor=0.5, patience=5, min_lr=1e-5),
    ]
    model.fit(X_train, y_train, validation_data=(X_val, y_val), epochs=80, batch_size=128, callbacks=callbacks, verbose=0)
    model.save(model_file)
    p_val = model.predict(X_val, verbose=0, batch_size=4096).ravel()
    auc = roc_auc_score(y_val, p_val)
    return model_file, p_val, auc


print("Entrenando modelos para ensambles y evaluando sobre VALIDATION...")

# 1. Las 5 semillas de Config_C (64->32->16, ReLU, lr=0.0005, drop=0.15)
preds_config_c = {}
for s in [42, 1, 7, 21, 2026]:
    f, p, auc = train_and_get_val_pred("cfg_c", s, [64, 32, 16], "relu", 0.15, "first_two", 0.0005, "val_auc", "max")
    preds_config_c[s] = p
    print(f"  cfg_c seed {s}: Val AUC = {auc:.5f}")

# 2. Modelos diversos adicionales
f_b42, p_b42, auc_b42 = train_and_get_val_pred("cfg_b_leaky", 42, [32, 16], "leaky_relu", 0.15, "all_except_last", 0.0005, "val_auc", "max")
print(f"  cfg_b_leaky seed 42: Val AUC = {auc_b42:.5f}")

f_base2026, p_base2026, auc_base2026 = train_and_get_val_pred("cfg_base", 2026, [64, 32, 16], "relu", 0.20, "first_two", 0.001, "val_loss", "min")
print(f"  cfg_base seed 2026: Val AUC = {auc_base2026:.5f}")

f_a42, p_a42, auc_a42 = train_and_get_val_pred("cfg_a_relu", 42, [32, 16], "relu", 0.15, "all_except_last", 0.0005, "val_auc", "max")
print(f"  cfg_a_relu seed 42: Val AUC = {auc_a42:.5f}")

# Evaluar diferentes combinaciones de ensamble en VALIDATION
ensembles = {}

# Ensamble 1: 5 semillas de Config_C
p_ens1 = np.mean(list(preds_config_c.values()), axis=0)
ensembles["Ensemble_1_ConfigC_5seeds"] = p_ens1

# Ensamble 2: Top 3 semillas de Config_C (42, 21, 2026)
p_ens2 = np.mean([preds_config_c[42], preds_config_c[21], preds_config_c[2026]], axis=0)
ensembles["Ensemble_2_ConfigC_Top3seeds"] = p_ens2

# Ensamble 3: Diversidad arquitectural (Config_C_s42 + Config_B_LeakyReLU_s42 + Config_Base_s2026)
p_ens3 = np.mean([preds_config_c[42], p_b42, p_base2026], axis=0)
ensembles["Ensemble_3_Arquitecturas_Diversas_Top3"] = p_ens3

# Ensamble 4: Top 5 modelos globales diversos (Config_C_s42, Config_B_s42, Config_A_s42, Config_Base_s2026, Config_C_s2026)
p_ens4 = np.mean([preds_config_c[42], p_b42, p_a42, p_base2026, preds_config_c[2026]], axis=0)
ensembles["Ensemble_4_Top5_Modelos_Diversos"] = p_ens4

res_ens = []
for name, p_ens in ensembles.items():
    pred_bin = (p_ens >= 0.5).astype(int)
    auc_v = roc_auc_score(y_val, p_ens)
    acc_v = accuracy_score(y_val, pred_bin)
    f1_v = f1_score(y_val, pred_bin)
    ll_v = log_loss(y_val, p_ens)
    brier_v = brier_score_loss(y_val, p_ens)
    res_ens.append({
        "ensemble_name": name,
        "val_auc": round(auc_v, 5),
        "val_accuracy": round(acc_v, 4),
        "val_f1": round(f1_v, 4),
        "val_log_loss": round(ll_v, 4),
        "val_brier": round(brier_v, 4),
    })

df_ens = pd.DataFrame(res_ens).sort_values("val_auc", ascending=False).reset_index(drop=True)
df_ens.to_csv(C.REPORTS / "ensemble_validation.csv", index=False)

print("\n=== COMPARACIÓN DE ENSAMBLES EN VALIDATION ===")
print(df_ens.to_string(index=False))

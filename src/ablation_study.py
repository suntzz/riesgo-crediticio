"""Estudio de Ablation y Feature Engineering sobre VALIDATION.
Compara los conjuntos de características A, B, C, D, E usando la misma arquitectura y semilla fija (42).
El conjunto TEST permanece completamente aislado.
"""
import sys
from pathlib import Path
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, accuracy_score, f1_score, log_loss
from tensorflow import keras

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C
from experiments import build_custom_model
from preprocess import Preprocessor

# Cargar dataset crudo
df_raw = pd.read_csv(C.DATA_CSV, encoding="utf-8-sig")
y = df_raw[C.TARGET].to_numpy("float32")
idx = np.arange(len(df_raw))

# División reproducible 70/15/15
tr, tmp = train_test_split(idx, test_size=C.VAL_FRAC + C.TEST_FRAC, stratify=y, random_state=C.SPLIT_SEED)
va, te = train_test_split(tmp, test_size=C.TEST_FRAC / (C.VAL_FRAC + C.TEST_FRAC), stratify=y[tmp], random_state=C.SPLIT_SEED)

results = []

def eval_feature_set(name, X_tr, X_va, description):
    keras.utils.set_random_seed(42)
    model = build_custom_model(
        n_features=X_tr.shape[1],
        layers=[64, 32, 16],
        activation="relu",
        dropout_rate=0.15,
        dropout_layers="first_two",
        learning_rate=0.0005,
    )
    callbacks = [
        keras.callbacks.EarlyStopping(monitor="val_auc", mode="max", patience=12, restore_best_weights=True),
        keras.callbacks.ReduceLROnPlateau(monitor="val_auc", mode="max", factor=0.5, patience=5, min_lr=1e-5),
    ]
    model.fit(X_tr, y[tr], validation_data=(X_va, y[va]), epochs=70, batch_size=128, callbacks=callbacks, verbose=0)
    p_va = model.predict(X_va, verbose=0, batch_size=4096).ravel()
    auc_val = roc_auc_score(y[va], p_va)
    acc_val = accuracy_score(y[va], (p_va >= 0.5).astype(int))
    f1_val = f1_score(y[va], (p_va >= 0.5).astype(int))
    ll_val = log_loss(y[va], p_va)

    res = {
        "set_name": name,
        "description": description,
        "n_features": X_tr.shape[1],
        "val_auc": round(auc_val, 5),
        "val_accuracy": round(acc_val, 4),
        "val_f1": round(f1_val, 4),
        "val_log_loss": round(ll_val, 4),
    }
    print(f"[{name}] {description} -> Features: {X_tr.shape[1]} | Val AUC: {auc_val:.5f} | Val Loss: {ll_val:.4f} | Val Acc: {acc_val*100:.2f}%")
    return res


print("Iniciando Prueba de Ablation y Feature Engineering en VALIDACIÓN...\n")

# --- CONJUNTO A: 44 Características Estándar ---
splits = np.load(C.ARTIFACTS / "splits.npz")
X_tr_A, X_va_A = splits["X_train"], splits["X_val"]
results.append(eval_feature_set("Set_A_44_Features", X_tr_A, X_va_A, "Todas las 44 caracteristicas canonicas"))

# --- CONJUNTO B: Eliminación de Redundantes y Ruido Comprobado ---
# En importance.py: ingreso_disponible, cuota_estimada, tipo_vivienda (6 dummies), personas_a_cargo
feat_names = json.loads((C.ARTIFACTS / "feature_names.json").read_text())
cols_drop_B = ["ingreso_disponible", "cuota_estimada", "personas_a_cargo"] + [c for c in feat_names if c.startswith("tipo_vivienda_")]
keep_indices_B = [i for i, c in enumerate(feat_names) if c not in cols_drop_B]
X_tr_B, X_va_B = X_tr_A[:, keep_indices_B], X_va_A[:, keep_indices_B]
results.append(eval_feature_set("Set_B_Sin_Redundantes", X_tr_B, X_va_B, "Excluyendo ingreso_disponible, cuota_estimada, personas_a_cargo, tipo_vivienda"))

# --- CONJUNTO C: Únicamente Variables Financieras Principales ---
fin_keywords = ["ingreso_mensual", "obligaciones_mensuales", "monto_solicitado", "cuota_estimada", "tasa_interes_ea", "nivel_endeudamiento_pct", "saldo_total_creditos"]
keep_indices_C = [i for i, c in enumerate(feat_names) if any(c.startswith(k) for k in fin_keywords)]
X_tr_C, X_va_C = X_tr_A[:, keep_indices_C], X_va_A[:, keep_indices_C]
results.append(eval_feature_set("Set_C_Solo_Financieras", X_tr_C, X_va_C, "Solo variables financieras principales"))

# --- CONJUNTO D: Variables Financieras + Comportamiento Crediticio ---
credit_keywords = fin_keywords + ["score_crediticio", "numero_creditos_activos", "numero_cuotas_mora", "dias_maximo_mora", "porcentaje_pagos_oportunos", "antiguedad_laboral_anios", "antiguedad_cliente_anios"]
keep_indices_D = [i for i, c in enumerate(feat_names) if any(c.startswith(k) for k in credit_keywords)]
X_tr_D, X_va_D = X_tr_A[:, keep_indices_D], X_va_A[:, keep_indices_D]
results.append(eval_feature_set("Set_D_Financieras_Comportamiento", X_tr_D, X_va_D, "Variables financieras + comportamiento crediticio completo"))

# --- CONJUNTO E: 44 Características + 6 Ratios Financieros Legítimos ---
df_fe = df_raw.copy()
df_fe["ratio_credito_ingreso"] = df_fe["monto_solicitado"] / (df_fe["ingreso_mensual"] + 1.0)
df_fe["ratio_cuota_ingreso"] = df_fe["cuota_estimada"] / (df_fe["ingreso_mensual"] + 1.0)
df_fe["ratio_obligaciones_ingreso"] = df_fe["obligaciones_mensuales"].fillna(0) / (df_fe["ingreso_mensual"] + 1.0)
df_fe["ratio_saldo_ingreso"] = df_fe["saldo_total_creditos"].fillna(0) / (df_fe["ingreso_mensual"] + 1.0)
df_fe["ratio_saldo_monto"] = df_fe["saldo_total_creditos"].fillna(0) / (df_fe["monto_solicitado"] + 1.0)
df_fe["ratio_obligaciones_cuota"] = df_fe["obligaciones_mensuales"].fillna(0) / (df_fe["cuota_estimada"].fillna(1) + 1.0)

class PreprocessorFE(Preprocessor):
    def fit(self, df):
        df = self._clean(df)
        self.num_cols = [c for c in df.columns if c not in C.CAT_COLS]
        base = [c for c in self.num_cols if not c.endswith("_nan")]
        self.lo = df[base].quantile(0.01)
        self.hi = df[base].quantile(0.99)
        self.median = df[base].median()
        dummies = pd.get_dummies(df[C.CAT_COLS], dtype=float)
        self.dummy_cols = list(dummies.columns)
        self.scaler = StandardScaler().fit(self._matrix(df))
        self.feature_names = self.num_cols + self.dummy_cols
        return self

    def _matrix(self, df):
        base = [c for c in self.num_cols if not c.endswith("_nan")]
        df = df.copy()
        df[base] = df[base].clip(self.lo, self.hi, axis=1)
        # Aplicar log1p a las numéricas de skew más los 6 nuevos ratios
        skew_all = C.SKEW_COLS + ["ratio_credito_ingreso", "ratio_cuota_ingreso", "ratio_obligaciones_ingreso", "ratio_saldo_ingreso", "ratio_saldo_monto", "ratio_obligaciones_cuota"]
        for c in skew_all:
            if c in df.columns:
                df[c] = np.log1p(df[c].clip(lower=0))
        for c in C.SIGNED_LOG_COLS:
            if c in df.columns:
                df[c] = np.sign(df[c]) * np.log1p(df[c].abs())
        df[base] = df[base].fillna(self.median)
        dummies = pd.get_dummies(df[C.CAT_COLS], dtype=float).reindex(columns=self.dummy_cols, fill_value=0.0)
        return np.hstack([df[self.num_cols].to_numpy(float), dummies.to_numpy(float)])

pre_e = PreprocessorFE().fit(df_fe.iloc[tr])
X_tr_E = pre_e.transform(df_fe.iloc[tr])
X_va_E = pre_e.transform(df_fe.iloc[va])
results.append(eval_feature_set("Set_E_44_Mas_6_Ratios", X_tr_E, X_va_E, "44 caracteristicas + 6 ratios financieros derivados"))

df_ablation = pd.DataFrame(results).sort_values("val_auc", ascending=False).reset_index(drop=True)
C.REPORTS.mkdir(exist_ok=True)
df_ablation.to_csv(C.REPORTS / "ablation_study.csv", index=False)

print("\n=== RESUMEN COMPARATIVO DEL ESTUDIO DE ABLATION (VALIDACIÓN) ===")
print(df_ablation.to_string(index=False))

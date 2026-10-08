"""Fase 3: Búsqueda controlada de 12 experimentos focalizados sobre VALIDATION.
El conjunto TEST permanece completamente aislado.
"""
import sys
from pathlib import Path
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C
from experiments import run_single_experiment


def get_phase3_experiments():
    exps = [
        # --- BLOQUE 1: ARQUITECTURAS EN EL PUNTO DULCE (3.500 a 7.500 parámetros) ---
        {
            "exp_id": "P3_01_ARCH_56_32_16",
            "family": "Bloque_1_Arquitecturas_Punto_Dulce",
            "description": "Compresión gradual 44->56->32->16->1 (L2=1e-4, lr=0.0005, drop=0.15)",
            "layers": [56, 32, 16],
            "activation": "relu",
            "dropout_rate": 0.15,
            "dropout_layers": "first_two",
            "l2_reg": 1e-4,
            "optimizer_name": "Adam",
            "learning_rate": 0.0005,
            "batch_size": 128,
            "es_patience": 12,
        },
        {
            "exp_id": "P3_02_ARCH_48_32_16",
            "family": "Bloque_1_Arquitecturas_Punto_Dulce",
            "description": "Ligera 3 niveles 44->48->32->16->1 (L2=1e-4, lr=0.0005, drop=0.15)",
            "layers": [48, 32, 16],
            "activation": "relu",
            "dropout_rate": 0.15,
            "dropout_layers": "first_two",
            "l2_reg": 1e-4,
            "optimizer_name": "Adam",
            "learning_rate": 0.0005,
            "batch_size": 128,
            "es_patience": 12,
        },
        {
            "exp_id": "P3_03_ARCH_64_40_20",
            "family": "Bloque_1_Arquitecturas_Punto_Dulce",
            "description": "Capas intermedias densas 44->64->40->20->1 (L2=1e-4, lr=0.0005, drop=0.15)",
            "layers": [64, 40, 20],
            "activation": "relu",
            "dropout_rate": 0.15,
            "dropout_layers": "first_two",
            "l2_reg": 1e-4,
            "optimizer_name": "Adam",
            "learning_rate": 0.0005,
            "batch_size": 128,
            "es_patience": 12,
        },
        {
            "exp_id": "P3_04_ARCH_56_28",
            "family": "Bloque_1_Arquitecturas_Punto_Dulce",
            "description": "Compacta 2 capas 44->56->28->1 (L2=1e-4, lr=0.0005, drop=0.15)",
            "layers": [56, 28],
            "activation": "relu",
            "dropout_rate": 0.15,
            "dropout_layers": "all_except_last",
            "l2_reg": 1e-4,
            "optimizer_name": "Adam",
            "learning_rate": 0.0005,
            "batch_size": 128,
            "es_patience": 12,
        },
        # --- BLOQUE 2: NUEVAS ACTIVACIONES SUAVES Y CALIBRACIÓN (GELU y ELU) ---
        {
            "exp_id": "P3_05_ACT_GELU_64",
            "family": "Bloque_2_Nuevas_Activaciones_Suaves",
            "description": "Red [64, 32, 16] con GELU (Gaussian Error Linear Unit, L2=1e-4, lr=0.0005)",
            "layers": [64, 32, 16],
            "activation": "gelu",
            "dropout_rate": 0.15,
            "dropout_layers": "first_two",
            "l2_reg": 1e-4,
            "optimizer_name": "Adam",
            "learning_rate": 0.0005,
            "batch_size": 128,
            "es_patience": 12,
        },
        {
            "exp_id": "P3_06_ACT_ELU_64",
            "family": "Bloque_2_Nuevas_Activaciones_Suaves",
            "description": "Red [64, 32, 16] con ELU (Exponential Linear Unit, L2=1e-4, lr=0.0005)",
            "layers": [64, 32, 16],
            "activation": "elu",
            "dropout_rate": 0.15,
            "dropout_layers": "first_two",
            "l2_reg": 1e-4,
            "optimizer_name": "Adam",
            "learning_rate": 0.0005,
            "batch_size": 128,
            "es_patience": 12,
        },
        {
            "exp_id": "P3_07_ACT_GELU_32",
            "family": "Bloque_2_Nuevas_Activaciones_Suaves",
            "description": "Red compacta [32, 16] con GELU (lr=0.0005, drop=0.15)",
            "layers": [32, 16],
            "activation": "gelu",
            "dropout_rate": 0.15,
            "dropout_layers": "all_except_last",
            "l2_reg": 0.0,
            "optimizer_name": "Adam",
            "learning_rate": 0.0005,
            "batch_size": 128,
            "es_patience": 12,
        },
        # --- BLOQUE 3: SINTONIZACIÓN FINA EN EL PUNTO ÓPTIMO ---
        {
            "exp_id": "P3_08_OPT_LR4_D15",
            "family": "Bloque_3_Sintonizacion_Fina",
            "description": "Red [64, 32, 16] con lr=0.00040, drop=0.150, L2=1e-4",
            "layers": [64, 32, 16],
            "activation": "relu",
            "dropout_rate": 0.150,
            "dropout_layers": "first_two",
            "l2_reg": 1e-4,
            "optimizer_name": "Adam",
            "learning_rate": 0.0004,
            "batch_size": 128,
            "es_patience": 12,
        },
        {
            "exp_id": "P3_09_OPT_LR5_D175",
            "family": "Bloque_3_Sintonizacion_Fina",
            "description": "Red [64, 32, 16] con lr=0.00050, drop=0.175, L2=1e-4",
            "layers": [64, 32, 16],
            "activation": "relu",
            "dropout_rate": 0.175,
            "dropout_layers": "first_two",
            "l2_reg": 1e-4,
            "optimizer_name": "Adam",
            "learning_rate": 0.0005,
            "batch_size": 128,
            "es_patience": 12,
        },
        {
            "exp_id": "P3_10_OPT_LR5_L2_3e5",
            "family": "Bloque_3_Sintonizacion_Fina",
            "description": "Red [64, 32, 16] con lr=0.00050, drop=0.150, L2=3e-5",
            "layers": [64, 32, 16],
            "activation": "relu",
            "dropout_rate": 0.150,
            "dropout_layers": "first_two",
            "l2_reg": 3e-5,
            "optimizer_name": "Adam",
            "learning_rate": 0.0005,
            "batch_size": 128,
            "es_patience": 12,
        },
        {
            "exp_id": "P3_11_OPT_ADAMW_WD3e5",
            "family": "Bloque_3_Sintonizacion_Fina",
            "description": "Red [64, 32, 16] con AdamW (weight_decay=3e-5, lr=0.0005, drop=0.15)",
            "layers": [64, 32, 16],
            "activation": "relu",
            "dropout_rate": 0.150,
            "dropout_layers": "first_two",
            "l2_reg": 0.0,
            "optimizer_name": "AdamW",
            "learning_rate": 0.0005,
            "weight_decay": 3e-5,
            "batch_size": 128,
            "es_patience": 12,
        },
        {
            "exp_id": "P3_12_OPT_PAT16",
            "family": "Bloque_3_Sintonizacion_Fina",
            "description": "Red [64, 32, 16] con paciencia ampliada=16 épocas en val_auc",
            "layers": [64, 32, 16],
            "activation": "relu",
            "dropout_rate": 0.150,
            "dropout_layers": "first_two",
            "l2_reg": 1e-4,
            "optimizer_name": "Adam",
            "learning_rate": 0.0005,
            "batch_size": 128,
            "es_patience": 16,
        },
    ]
    return exps


def main():
    exps = get_phase3_experiments()
    print(f"Iniciando Fase 3: {len(exps)} experimentos focalizados sobre VALIDATION...")
    results = []

    for i, exp in enumerate(exps, 1):
        print(f"[{i:02d}/{len(exps)}] {exp['exp_id']} ({exp['family']}): {exp['description']}...")
        r = run_single_experiment(seed=42, **exp)
        results.append(r)
        print(f"     -> Val AUC: {r['Val_AUC']:.5f} | PR AUC: {r['PR_AUC']:.5f} | Val Loss: {r['Val_Loss']:.4f} | Val Acc: {r['Accuracy']}% | F1: {r['F1']:.4f} | Época: {r['mejor_época']}/{r['epochs_trained']} ({r['tiempo_entrenamiento']}s)")

    df = pd.DataFrame(results).sort_values("Val_AUC", ascending=False).reset_index(drop=True)
    C.REPORTS.mkdir(exist_ok=True)
    out_csv = C.REPORTS / "experiments_phase3.csv"
    df.to_csv(out_csv, index=False)
    print(f"\n✅ Fase 3: Los 12 experimentos finalizaron exitosamente. Guardado en: {out_csv}\n")

    print("=== TABLA COMPARATIVA COMPLETA FASE 3 (VALIDACIÓN) ===")
    cols_show = ["experiment_id", "arquitectura", "número_de_parámetros", "activación", "learning_rate", "dropout", "L2", "Val_AUC", "Val_Loss", "F1", "Brier", "PR_AUC", "mejor_época"]
    print(df[cols_show].to_string(index=False))


if __name__ == "__main__":
    main()

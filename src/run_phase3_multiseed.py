"""Fase 3: Evaluación Multi-Seed sobre VALIDATION para los 4 mejores candidatos.
Semillas evaluadas: [42, 1, 7, 21, 2026].
TEST permanece estrictamente congelado y sin consultar.
Dataset original inmutable.
"""
import sys
import time
from pathlib import Path
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C
from experiments import run_single_experiment

SEEDS = [42, 1, 7, 21, 2026]

CANDIDATES = {
    "P3_12_OPT_PAT16": {
        "description": "[64, 32, 16] ReLU, L2=1e-4, drop=0.15, Adam lr=0.0005, pat=16",
        "layers": [64, 32, 16],
        "activation": "relu",
        "dropout_rate": 0.15,
        "dropout_layers": "first_two",
        "l2_reg": 1e-4,
        "optimizer_name": "Adam",
        "learning_rate": 0.0005,
        "batch_size": 128,
        "es_patience": 16,
    },
    "P3_10_OPT_LR5_L2_3e5": {
        "description": "[64, 32, 16] ReLU, L2=3e-5, drop=0.15, Adam lr=0.0005, pat=12",
        "layers": [64, 32, 16],
        "activation": "relu",
        "dropout_rate": 0.15,
        "dropout_layers": "first_two",
        "l2_reg": 3e-5,
        "optimizer_name": "Adam",
        "learning_rate": 0.0005,
        "batch_size": 128,
        "es_patience": 12,
    },
    "P3_06_ACT_ELU_64": {
        "description": "[64, 32, 16] ELU, L2=1e-4, drop=0.15, Adam lr=0.0005, pat=12",
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
    "P3_11_OPT_ADAMW_WD3e5": {
        "description": "[64, 32, 16] ReLU, AdamW wd=3e-5, drop=0.15, lr=0.0005, pat=12",
        "layers": [64, 32, 16],
        "activation": "relu",
        "dropout_rate": 0.15,
        "dropout_layers": "first_two",
        "l2_reg": 0.0,
        "optimizer_name": "AdamW",
        "weight_decay": 3e-5,
        "learning_rate": 0.0005,
        "batch_size": 128,
        "es_patience": 12,
    },
}


def main():
    print("=" * 80)
    print("FASE 3: EVALUACIÓN MULTI-SEED SOBRE VALIDACIÓN (5 SEMILLAS)")
    print("Semillas:", SEEDS)
    print("=" * 80)

    # Cargar y_val para verificación de errores
    splits = np.load(C.ARTIFACTS / "splits.npz")
    y_val = splits["y_val"]

    detailed_records = []
    # Diccionario para almacenar predicciones: {cand_name: {seed: p_val_array}}
    cand_predictions = {cand: {} for cand in CANDIDATES}

    t0_total = time.time()

    for cand_name, cfg in CANDIDATES.items():
        print(f"\n>>> Evaluando Candidato: {cand_name}")
        print(f"    Configuración: {cfg['description']}")

        for s in SEEDS:
            r = run_single_experiment(
                exp_id=f"{cand_name}_S{s}",
                family="Fase3_MultiSeed",
                description=f"{cand_name} (seed {s})",
                seed=s,
                **{k: v for k, v in cfg.items() if k != "description"},
            )

            p_val = r["p_val"]
            cand_predictions[cand_name][s] = p_val

            row = {
                "Modelo": cand_name,
                "seed": s,
                "Val_AUC": r["Val_AUC"],
                "Val_Loss": r["Val_Loss"],
                "Accuracy": r["Accuracy"],
                "Precision": r["Precision"],
                "Recall": r["Recall"],
                "F1": r["F1"],
                "PR_AUC": r["PR_AUC"],
                "Brier": r["Brier"],
                "mejor_época": r["mejor_época"],
                "epochs_trained": r["epochs_trained"],
                "tiempo_s": r["tiempo_entrenamiento"],
            }
            detailed_records.append(row)
            print(
                f"    [Seed {s:4d}] AUC: {r['Val_AUC']:.5f} | PR-AUC: {r['PR_AUC']:.5f} | "
                f"Loss: {r['Val_Loss']:.4f} | Acc: {r['Accuracy']:.2f}% | F1: {r['F1']:.4f} | "
                f"Brier: {r['Brier']:.4f} | Época: {r['mejor_época']}/{r['epochs_trained']} ({r['tiempo_entrenamiento']}s)"
            )

    df_detailed = pd.DataFrame(detailed_records)
    C.REPORTS.mkdir(exist_ok=True)
    df_detailed.to_csv(C.REPORTS / "multiseed_phase3_detailed.csv", index=False)

    # --- CÁLCULO DE MÉTRICAS AGREGADAS (Mean, Std, Min, Max) ---
    summary_rows = []
    for cand_name in CANDIDATES:
        sub = df_detailed[df_detailed["Modelo"] == cand_name]
        summary_rows.append({
            "Modelo": cand_name,
            "Mean_AUC": round(sub["Val_AUC"].mean(), 5),
            "Std_AUC": round(sub["Val_AUC"].std(), 5),
            "Min_AUC": round(sub["Val_AUC"].min(), 5),
            "Max_AUC": round(sub["Val_AUC"].max(), 5),
            "Mean_Loss": round(sub["Val_Loss"].mean(), 4),
            "Std_Loss": round(sub["Val_Loss"].std(), 4),
            "Mean_F1": round(sub["F1"].mean(), 4),
            "Std_F1": round(sub["F1"].std(), 4),
            "Mean_Brier": round(sub["Brier"].mean(), 4),
            "Std_Brier": round(sub["Brier"].std(), 4),
            "Mean_PR_AUC": round(sub["PR_AUC"].mean(), 5),
            "Mean_Acc": round(sub["Accuracy"].mean(), 2),
            "Mean_Epoch": round(sub["mejor_época"].mean(), 1),
        })

    df_summary = pd.DataFrame(summary_rows).sort_values("Mean_AUC", ascending=False).reset_index(drop=True)
    df_summary.to_csv(C.REPORTS / "multiseed_phase3_summary.csv", index=False)

    print("\n" + "=" * 80)
    print("TABLA RESUMEN MULTI-SEED (ORDENADA POR MEAN AUC)")
    print("=" * 80)
    cols_show = ["Modelo", "Mean_AUC", "Std_AUC", "Min_AUC", "Max_AUC", "Mean_Loss", "Mean_F1", "Mean_Brier"]
    print(df_summary[cols_show].to_string(index=False))

    # --- MATRICES DE CORRELACIÓN ---
    # 1. Predicciones promedio en Validación por candidato a través de las 5 semillas
    cand_names = list(CANDIDATES.keys())
    cand_mean_preds = {cand: np.mean([cand_predictions[cand][s] for s in SEEDS], axis=0) for cand in cand_names}
    df_preds_multi = pd.DataFrame(cand_mean_preds)

    corr_preds_matrix = df_preds_multi.corr()

    # 2. Correlación de predicciones bajo seed 42 de referencia
    cand_seed42_preds = {cand: cand_predictions[cand][42] for cand in cand_names}
    df_preds_s42 = pd.DataFrame(cand_seed42_preds)
    corr_preds_s42 = df_preds_s42.corr()

    # 3. Correlación de errores residuales: error = y_val - pred_prob
    cand_errors = {cand: (y_val - df_preds_multi[cand].values) for cand in cand_names}
    df_errors = pd.DataFrame(cand_errors)
    corr_errors_matrix = df_errors.corr()

    print("\n" + "=" * 80)
    print("MATRIZ DE CORRELACIÓN DE PREDICCIONES (PROMEDIO MULTI-SEED EN VALIDACIÓN)")
    print("=" * 80)
    print(corr_preds_matrix.round(4).to_string())

    print("\n" + "=" * 80)
    print("MATRIZ DE CORRELACIÓN DE PREDICCIONES (SEED 42 EN VALIDACIÓN)")
    print("=" * 80)
    print(corr_preds_s42.round(4).to_string())

    print("\n" + "=" * 80)
    print("MATRIZ DE CORRELACIÓN DE ERRORES RESIDUALES (y_val - pred)")
    print("=" * 80)
    print(corr_errors_matrix.round(4).to_string())

    # Guardar correlaciones
    corr_preds_matrix.round(4).to_csv(C.REPORTS / "correlacion_predicciones_phase3.csv")
    corr_errors_matrix.round(4).to_csv(C.REPORTS / "correlacion_errores_phase3.csv")

    elapsed_total = time.time() - t0_total
    print(f"\n✅ Evaluación multi-seed y correlaciones completadas en {elapsed_total:.1f} segundos.")


if __name__ == "__main__":
    main()

"""Evaluación de robustez multi-seed para los mejores candidatos sobre VALIDATION.
Semillas probadas: 42, 1, 7, 21, 2026.
"""
import sys
from pathlib import Path
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C
from experiments import run_single_experiment

SEEDS = [42, 1, 7, 21, 2026]

CANDIDATES = {
    "Config_A_32_16_ReLU": {
        "layers": [32, 16],
        "activation": "relu",
        "dropout_rate": 0.15,
        "dropout_layers": "all_except_last",
        "use_batch_norm": False,
        "l2_reg": 0.0,
        "optimizer_name": "Adam",
        "learning_rate": 0.0005,
        "batch_size": 128,
        "es_monitor": "val_auc",
        "es_mode": "max",
    },
    "Config_B_32_16_LeakyReLU": {
        "layers": [32, 16],
        "activation": "leaky_relu",
        "dropout_rate": 0.15,
        "dropout_layers": "all_except_last",
        "use_batch_norm": False,
        "l2_reg": 0.0,
        "optimizer_name": "Adam",
        "learning_rate": 0.0005,
        "batch_size": 128,
        "es_monitor": "val_auc",
        "es_mode": "max",
    },
    "Config_C_64_32_16_ReLU_Opt": {
        "layers": [64, 32, 16],
        "activation": "relu",
        "dropout_rate": 0.15,
        "dropout_layers": "first_two",
        "use_batch_norm": False,
        "l2_reg": 0.0,
        "optimizer_name": "Adam",
        "learning_rate": 0.0005,
        "batch_size": 128,
        "es_monitor": "val_auc",
        "es_mode": "max",
    },
    "Config_Baseline_64_32_16": {
        "layers": [64, 32, 16],
        "activation": "relu",
        "dropout_rate": 0.20,
        "dropout_layers": "first_two",
        "use_batch_norm": False,
        "l2_reg": 0.0,
        "optimizer_name": "Adam",
        "learning_rate": 0.001,
        "batch_size": 128,
        "es_monitor": "val_loss",
        "es_mode": "min",
    },
}


def main():
    print(f"Iniciando evaluación multi-seed sobre VALIDATION (5 semillas x {len(CANDIDATES)} configuraciones = 20 entrenamientos)...")
    records = []

    for name, cfg in CANDIDATES.items():
        print(f"\nEvaluando candidato: {name}...")
        aucs, losses, accs = [], [], []
        for seed in SEEDS:
            r = run_single_experiment(
                exp_id=f"SEED_{seed}_{name}",
                family="MultiSeed_Robustness",
                description=f"{name} con seed {seed}",
                seed=seed,
                **cfg,
            )
            aucs.append(r["val_auc"])
            losses.append(r["val_loss"])
            accs.append(r["val_accuracy"])
            records.append({
                "config_name": name,
                "seed": seed,
                "val_auc": r["val_auc"],
                "val_loss": r["val_loss"],
                "val_accuracy": r["val_accuracy"],
                "best_epoch": r["best_epoch"],
                "train_time_sec": r["train_time_sec"],
            })
            print(f"  -> Seed {seed:4d}: Val AUC = {r['val_auc']:.5f} | Val Loss = {r['val_loss']:.4f} | Val Acc = {r['val_accuracy']*100:.2f}%")

        print(f"  Resumen {name}:")
        print(f"    Val AUC:  media={np.mean(aucs):.5f} (±{np.std(aucs):.5f}), min={np.min(aucs):.5f}, max={np.max(aucs):.5f}")
        print(f"    Val Loss: media={np.mean(losses):.4f} (±{np.std(losses):.4f})")
        print(f"    Val Acc:  media={np.mean(accs)*100:.2f}% (±{np.std(accs)*100:.2f}%)")

    df_seeds = pd.DataFrame(records)
    out_path = C.REPORTS / "multiseed_evaluation.csv"
    df_seeds.to_csv(out_path, index=False)
    print(f"\nEvaluación multi-seed completada y guardada en {out_path}.")

    summary = df_seeds.groupby("config_name")["val_auc"].agg(["count", "mean", "std", "min", "max"]).sort_values("mean", ascending=False)
    print("\n=== RESUMEN COMPARATIVO MULTI-SEED (ORDENADO POR VAL_AUC MEDIO) ===")
    print(summary.to_string())


if __name__ == "__main__":
    main()

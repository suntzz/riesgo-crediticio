"""Evaluación Multi-Seed de la Fase 2 sobre VALIDATION.
Evalúa las mejores configuraciones en 5 semillas: [42, 1, 7, 21, 2026].
"""
import sys
from pathlib import Path
import numpy as np
import pandas as pd

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C
from experiments import run_single_experiment

SEEDS = [42, 1, 7, 21, 2026]

P2_CANDIDATES = {
    "P2_64_L2_1e4": {
        "layers": [64, 32, 16],
        "activation": "relu",
        "dropout_rate": 0.15,
        "dropout_layers": "first_two",
        "l2_reg": 1e-4,
        "optimizer_name": "Adam",
        "learning_rate": 0.0005,
        "batch_size": 128,
        "es_monitor": "val_auc",
        "es_mode": "max",
        "es_patience": 12,
    },
    "P2_64_L2_3e5": {
        "layers": [64, 32, 16],
        "activation": "relu",
        "dropout_rate": 0.15,
        "dropout_layers": "first_two",
        "l2_reg": 3e-5,
        "optimizer_name": "Adam",
        "learning_rate": 0.0005,
        "batch_size": 128,
        "es_monitor": "val_auc",
        "es_mode": "max",
        "es_patience": 12,
    },
    "P2_32_LeakyReLU": {
        "layers": [32, 16],
        "activation": "leaky_relu",
        "dropout_rate": 0.15,
        "dropout_layers": "all_except_last",
        "l2_reg": 0.0,
        "optimizer_name": "Adam",
        "learning_rate": 0.0005,
        "batch_size": 128,
        "es_monitor": "val_auc",
        "es_mode": "max",
        "es_patience": 12,
    },
    "P2_64_Opt_Fase1": {
        "layers": [64, 32, 16],
        "activation": "relu",
        "dropout_rate": 0.15,
        "dropout_layers": "first_two",
        "l2_reg": 0.0,
        "optimizer_name": "Adam",
        "learning_rate": 0.0005,
        "batch_size": 128,
        "es_monitor": "val_auc",
        "es_mode": "max",
        "es_patience": 12,
    },
}


def main():
    print("Iniciando Evaluación Multi-Seed de Fase 2 en VALIDACIÓN...")
    rows = []

    for name, cfg in P2_CANDIDATES.items():
        print(f"\nEvaluando candidato: {name}...")
        aucs, losses, accs = [], [], []
        for s in SEEDS:
            r = run_single_experiment(
                exp_id=f"P2_SEED_{s}_{name}",
                family="P2_MultiSeed",
                description=f"{name} seed {s}",
                seed=s,
                **cfg,
            )
            aucs.append(r["val_auc"])
            losses.append(r["val_loss"])
            accs.append(r["val_accuracy"])
            rows.append({
                "config_name": name,
                "seed": s,
                "val_auc": r["val_auc"],
                "val_loss": r["val_loss"],
                "val_accuracy": r["val_accuracy"],
                "best_epoch": r["best_epoch"],
                "train_time_sec": r["train_time_sec"],
            })
            print(f"  -> Seed {s:4d}: Val AUC = {r['val_auc']:.5f} | Val Loss = {r['val_loss']:.4f} | Val Acc = {r['val_accuracy']*100:.2f}%")

        print(f"  Resumen {name}:")
        print(f"    Val AUC:  media={np.mean(aucs):.5f} (±{np.std(aucs):.5f}), min={np.min(aucs):.5f}, max={np.max(aucs):.5f}")

    df_ms = pd.DataFrame(rows)
    out_csv = C.REPORTS / "multiseed_evaluation_phase2.csv"
    df_ms.to_csv(out_csv, index=False)

    summary = df_ms.groupby("config_name")["val_auc"].agg(["count", "mean", "std", "min", "max"]).sort_values("mean", ascending=False)
    print("\n=== RESUMEN COMPARATIVO MULTI-SEED FASE 2 (VALIDACIÓN) ===")
    print(summary.to_string())


if __name__ == "__main__":
    main()

"""Fase 2 de optimización fina y enfocada de redes neuronales sobre VALIDATION.
Búsqueda de alta resolución en:
- Arquitecturas prometedoras ([32, 16], [48, 24], [56, 28, 14], [64, 32, 16], [80, 40, 20])
- Búsqueda fina de Dropout (0.10, 0.125, 0.15, 0.175, 0.20, 0.225, 0.25)
- Búsqueda fina de Learning Rate (0.0003, 0.0004, 0.0005, 0.0006, 0.00075, 0.0010)
- Regularización L2 fina (0, 1e-5, 3e-5, 1e-4, 3e-4)
- Activaciones (ReLU vs LeakyReLU)
- Optimizadores (Adam vs AdamW con weight decay 3e-5 y 1e-4)
- Paciencia de EarlyStopping (8, 12, 16, 20)
Guarda los resultados en reports/experiments_phase2.csv.
"""
import sys
from pathlib import Path
import json
import pandas as pd
import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C
from experiments import run_single_experiment


def get_phase2_experiments():
    exps = []

    # --- 1. EXPLORACIÓN DE ARQUITECTURAS INTERMEDIAS CON CONFIGURACIÓN PROMETEDORA (lr=0.0005, drop=0.15) ---
    archs = [
        ("P2_ARCH_32_16", "Compacta 44->32->16->1", [32, 16], "all_except_last"),
        ("P2_ARCH_48_24", "Intermedia 44->48->24->1", [48, 24], "all_except_last"),
        ("P2_ARCH_56_28_14", "Intermedia 44->56->28->14->1", [56, 28, 14], "first_two"),
        ("P2_ARCH_64_32_16", "Principal 44->64->32->16->1", [64, 32, 16], "first_two"),
        ("P2_ARCH_80_40_20", "Intermedia 44->80->40->20->1", [80, 40, 20], "first_two"),
        ("P2_ARCH_96_48_24", "Intermedia 44->96->48->24->1", [96, 48, 24], "first_two"),
    ]
    for exp_id, desc, layers, d_mode in archs:
        exps.append({
            "exp_id": exp_id,
            "family": "P2_Arquitecturas_Intermedias",
            "description": desc,
            "layers": layers,
            "activation": "relu",
            "dropout_rate": 0.15,
            "dropout_layers": d_mode,
            "use_batch_norm": False,
            "l2_reg": 0.0,
            "optimizer_name": "Adam",
            "learning_rate": 0.0005,
            "batch_size": 128,
            "es_monitor": "val_auc",
            "es_mode": "max",
            "es_patience": 12,
        })

    # --- 2. BÚSQUEDA FINA DE DROPOUT (sobre [64, 32, 16] y [32, 16]) ---
    drop_values = [0.10, 0.125, 0.15, 0.175, 0.20, 0.225, 0.25]
    for dv in drop_values:
        exps.append({
            "exp_id": f"P2_DROP_64_{int(dv*1000)}",
            "family": "P2_Busqueda_Fina_Dropout",
            "description": f"Red [64, 32, 16] con Dropout={dv:.3f}",
            "layers": [64, 32, 16],
            "activation": "relu",
            "dropout_rate": dv,
            "dropout_layers": "first_two",
            "use_batch_norm": False,
            "l2_reg": 0.0,
            "optimizer_name": "Adam",
            "learning_rate": 0.0005,
            "batch_size": 128,
            "es_monitor": "val_auc",
            "es_mode": "max",
            "es_patience": 12,
        })

    # --- 3. BÚSQUEDA FINA DE LEARNING RATE ALREDEDOR DE 0.0005 ---
    lrs = [0.0003, 0.0004, 0.0005, 0.0006, 0.00075, 0.0010]
    for lr in lrs:
        exps.append({
            "exp_id": f"P2_LR_64_{int(lr*10000)}",
            "family": "P2_Busqueda_Fina_LR",
            "description": f"Red [64, 32, 16] con lr={lr:.5f}",
            "layers": [64, 32, 16],
            "activation": "relu",
            "dropout_rate": 0.15,
            "dropout_layers": "first_two",
            "use_batch_norm": False,
            "l2_reg": 0.0,
            "optimizer_name": "Adam",
            "learning_rate": lr,
            "batch_size": 128,
            "es_monitor": "val_auc",
            "es_mode": "max",
            "es_patience": 12,
        })

    # --- 4. REGULARIZACIÓN L2 FINA ---
    l2_vals = [1e-5, 3e-5, 1e-4, 3e-4]
    for l2 in l2_vals:
        exps.append({
            "exp_id": f"P2_L2_64_{str(l2).replace('.', '_')}",
            "family": "P2_Regularizacion_L2_Fina",
            "description": f"Red [64, 32, 16] con regularización L2={l2}",
            "layers": [64, 32, 16],
            "activation": "relu",
            "dropout_rate": 0.15,
            "dropout_layers": "first_two",
            "use_batch_norm": False,
            "l2_reg": l2,
            "optimizer_name": "Adam",
            "learning_rate": 0.0005,
            "batch_size": 128,
            "es_monitor": "val_auc",
            "es_mode": "max",
            "es_patience": 12,
        })

    # --- 5. ACTIVACIONES: LEAKYRELU VS RELU EN RED COMPACTA Y PRINCIPAL ---
    for arch_name, lay, d_m in [("32_16", [32, 16], "all_except_last"), ("64_32_16", [64, 32, 16], "first_two")]:
        exps.append({
            "exp_id": f"P2_ACT_LEAKY_{arch_name}",
            "family": "P2_Activaciones",
            "description": f"Red [{arch_name}] con LeakyReLU (alpha=0.1)",
            "layers": lay,
            "activation": "leaky_relu",
            "dropout_rate": 0.15,
            "dropout_layers": d_m,
            "use_batch_norm": False,
            "l2_reg": 0.0,
            "optimizer_name": "Adam",
            "learning_rate": 0.0005,
            "batch_size": 128,
            "es_monitor": "val_auc",
            "es_mode": "max",
            "es_patience": 12,
        })

    # --- 6. OPTIMIZADOR ADAMW VS ADAM ---
    exps.append({
        "exp_id": "P2_OPT_ADAMW_64",
        "family": "P2_Optimizadores",
        "description": "Red [64, 32, 16] con AdamW (weight_decay=1e-4, lr=0.0005)",
        "layers": [64, 32, 16],
        "activation": "relu",
        "dropout_rate": 0.15,
        "dropout_layers": "first_two",
        "use_batch_norm": False,
        "l2_reg": 0.0,
        "optimizer_name": "AdamW",
        "learning_rate": 0.0005,
        "batch_size": 128,
        "es_monitor": "val_auc",
        "es_mode": "max",
        "es_patience": 12,
    })

    # --- 7. PACIENCIA DE EARLY STOPPING (8, 12, 16, 20) ---
    for pat in [8, 16, 20]:
        exps.append({
            "exp_id": f"P2_ES_PAT_{pat}",
            "family": "P2_Early_Stopping_Patience",
            "description": f"Red [64, 32, 16] con paciencia={pat} en val_auc",
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
            "es_patience": pat,
        })

    return exps


def main():
    exps = get_phase2_experiments()
    print(f"Iniciando Fase 2: {len(exps)} experimentos de optimización fina...")
    results = []

    for i, exp in enumerate(exps, 1):
        print(f"[{i:02d}/{len(exps)}] {exp['exp_id']} ({exp['family']}): {exp['description']}...")
        r = run_single_experiment(seed=42, **exp)
        results.append(r)
        print(f"     -> Val AUC: {r['val_auc']:.5f} | Val Loss: {r['val_loss']:.4f} | Val Acc: {r['val_accuracy']*100:.2f}% | Época: {r['best_epoch']}/{r['epochs_trained']} ({r['train_time_sec']}s)")

    df = pd.DataFrame(results).sort_values("val_auc", ascending=False).reset_index(drop=True)
    C.REPORTS.mkdir(exist_ok=True)
    out_csv = C.REPORTS / "experiments_phase2.csv"
    df.to_csv(out_csv, index=False)
    print(f"\nFase 2 de experimentos finalizada exitosamente. Guardado en: {out_csv}\n")

    print("=== TOP 10 EXPERIMENTOS FASE 2 POR VAL_AUC ===")
    cols_show = ["exp_id", "family", "layers", "params", "learning_rate", "dropout", "l2_reg", "optimizer", "activation", "val_auc", "val_loss", "val_accuracy"]
    print(df[cols_show].head(10).to_string(index=False))


if __name__ == "__main__":
    main()

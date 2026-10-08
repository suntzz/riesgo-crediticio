"""Inspección pedagógica y matemática de pesos y sesgos del modelo final.
Permite explicar cómo funciona la red capa por capa, guardando estadísticas y visualizaciones.
"""
import sys
from pathlib import Path
import json
import os

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from tensorflow import keras

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C


def inspect_model_weights():
    model_path = C.ARTIFACTS / "model_best.keras"
    if not model_path.exists():
        model_path = C.ARTIFACTS / "model_final.keras"

    model = keras.models.load_model(model_path)
    print(f"Cargando modelo para inspección: {model_path}\n")

    summary = {
        "model_name": model.name,
        "total_parameters": int(model.count_params()),
        "layers": []
    }

    fig, axes = plt.subplots(2, 4, figsize=(16, 7))
    layer_idx = 0

    print(f"{'Capa':<15} {'Tipo':<12} {'Pesos W (Shape)':<18} {'Sesgo b (Shape)':<16} {'Params':<8} {'W (Media ± Std)':<20} {'b (Media ± Std)'}")
    print("-" * 105)

    for layer in model.layers:
        weights = layer.get_weights()
        if len(weights) == 0:
            continue

        w, b = weights[0], weights[1]
        w_stats = {"mean": float(np.mean(w)), "std": float(np.std(w)), "min": float(np.min(w)), "max": float(np.max(w)), "shape": list(w.shape)}
        b_stats = {"mean": float(np.mean(b)), "std": float(np.std(b)), "min": float(np.min(b)), "max": float(np.max(b)), "shape": list(b.shape)}

        summary["layers"].append({
            "name": layer.name,
            "type": layer.__class__.__name__,
            "weights": w_stats,
            "biases": b_stats,
            "num_params": int(w.size + b.size)
        })

        print(f"{layer.name:<15} {layer.__class__.__name__:<12} {str(w.shape):<18} {str(b.shape):<16} {w.size + b.size:<8} {w_stats['mean']:+.4f} ± {w_stats['std']:.4f}     {b_stats['mean']:+.4f} ± {b_stats['std']:.4f}")

        # Gráfica de distribución de pesos y sesgos
        ax_w = axes[0, layer_idx]
        ax_w.hist(w.flatten(), bins=30, color="#1f77b4", alpha=0.7, edgecolor="black")
        ax_w.set_title(f"Pesos W: {layer.name}\n({w.shape})", fontsize=10)
        ax_w.grid(True, alpha=0.3)

        ax_b = axes[1, layer_idx]
        ax_b.hist(b.flatten(), bins=15, color="#ff7f0e", alpha=0.7, edgecolor="black")
        ax_b.set_title(f"Sesgos b: {layer.name}\n({b.shape})", fontsize=10)
        ax_b.grid(True, alpha=0.3)

        layer_idx += 1

    C.REPORTS.mkdir(exist_ok=True)
    json_path = C.REPORTS / "weights_inspection.json"
    json_path.write_text(json.dumps(summary, indent=2))

    fig_path = C.REPORTS / "weights_distribution.png"
    fig.tight_layout()
    fig.savefig(fig_path, dpi=150)
    plt.close(fig)

    print("-" * 105)
    print(f"Resumen JSON guardado en: {json_path}")
    print(f"Distribución visual de pesos guardada en: {fig_path}")


if __name__ == "__main__":
    inspect_model_weights()

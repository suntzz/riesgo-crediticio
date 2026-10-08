"""Entrena el modelo con parada temprana y guarda el mejor checkpoint."""
import argparse
import os
import sys
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow import keras

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C

# CPU es óptimo para esta arquitectura liviana en Apple Silicon
gpus = tf.config.list_physical_devices("GPU")
if gpus:
    tf.config.set_visible_devices([], "GPU")

from model import build_model


def main(seed: int, tag: str):
    keras.utils.set_random_seed(seed)
    d = np.load(C.ARTIFACTS / "splits.npz")
    model = build_model(d["X_train"].shape[1])
    C.REPORTS.mkdir(exist_ok=True)
    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor="val_loss",
            patience=C.ES_PATIENCE,
            restore_best_weights=True,
            verbose=1,
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=C.RLR_FACTOR,
            patience=C.RLR_PATIENCE,
            min_lr=C.RLR_MIN_LR,
            verbose=1,
        ),
        keras.callbacks.ModelCheckpoint(
            C.ARTIFACTS / f"model_{tag}.keras",
            monitor="val_loss",
            save_best_only=True,
        ),
        keras.callbacks.CSVLogger(C.REPORTS / f"history_{tag}.csv"),
    ]
    model.fit(
        d["X_train"],
        d["y_train"],
        validation_data=(d["X_val"], d["y_val"]),
        epochs=C.MAX_EPOCHS,
        batch_size=C.BATCH_SIZE,
        callbacks=callbacks,
        verbose=2,
    )
    model.save(C.ARTIFACTS / f"model_{tag}.keras")  # pesos restaurados = mejor época
    h = pd.read_csv(C.REPORTS / f"history_{tag}.csv")
    best = h.loc[h.val_loss.idxmin()]
    print(
        f"\nMejor época {int(best.epoch) + 1}: val_loss={best.val_loss:.4f} "
        f"val_auc={best.val_auc:.4f} val_acc={best.val_acc:.4f}"
    )


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--seed", type=int, default=1)
    p.add_argument("--tag", default="final")
    a = p.parse_args()
    main(a.seed, a.tag)

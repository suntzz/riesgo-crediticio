"""Entrena N redes con semillas distintas y promedia sus probabilidades."""
import os
import sys
from pathlib import Path
import numpy as np
from sklearn.metrics import accuracy_score, roc_auc_score
from tensorflow import keras

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C
from train import main as train_one

SEEDS = (1, 2, 3, 4, 5)


def main():
    d = np.load(C.ARTIFACTS / "splits.npz")
    probs = []
    for s in SEEDS:
        train_one(seed=s, tag=f"seed{s}")
        m = keras.models.load_model(C.ARTIFACTS / f"model_seed{s}.keras")
        probs.append(m.predict(d["X_test"], verbose=0, batch_size=4096).ravel())
    p = np.mean(probs, axis=0)
    print(
        f"\nENSAMBLE {len(SEEDS)} redes -> AUC prueba ={roc_auc_score(d['y_test'], p):.4f} "
        f"error={1 - accuracy_score(d['y_test'], p >= C.THRESHOLD):.4f}"
    )


if __name__ == "__main__":
    main()

"""Importancia por permutación: cuánto cae el AUC al barajar cada variable."""
import json
import os
import sys
from pathlib import Path

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score
from tensorflow import keras

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C


def main():
    d = np.load(C.ARTIFACTS / "splits.npz")
    names = json.loads((C.ARTIFACTS / "feature_names.json").read_text())
    model = keras.models.load_model(C.ARTIFACTS / "model_final.keras")
    X, y = d["X_val"], d["y_val"]
    auc = lambda M: roc_auc_score(
        y, model.predict(M, verbose=0, batch_size=8192).ravel()
    )
    base = auc(X)

    # Agrupa cada variable original con su indicador _nan y sus columnas one-hot
    groups = {}
    for i, n in enumerate(names):
        key = (
            n.split("=")[0].replace("_nan", "")
            if "=" in n or n.endswith("_nan")
            else n
        )
        for c in C.CAT_COLS:
            if n.startswith(c + "_"):
                key = c
        groups.setdefault(key, []).append(i)

    rng = np.random.default_rng(0)
    rows = []
    for g, cols in groups.items():
        drops = []
        for _ in range(3):
            Xp = X.copy()
            perm = rng.permutation(len(X))
            Xp[:, cols] = Xp[perm][:, cols]
            drops.append(base - auc(Xp))
        rows.append((g, float(np.mean(drops))))
    imp = pd.DataFrame(rows, columns=["variable", "caida_auc"]).sort_values(
        "caida_auc", ascending=False
    )
    imp["peso_relativo_pct"] = (
        100 * imp.caida_auc.clip(lower=0) / imp.caida_auc.clip(lower=0).sum()
    )
    C.REPORTS.mkdir(exist_ok=True)
    imp.to_csv(C.REPORTS / "importancia_variables.csv", index=False)
    print(f"AUC base (validación) = {base:.4f}\n")
    print(imp.round(4).to_string(index=False))


if __name__ == "__main__":
    main()

"""Puntúa solicitantes nuevos: un JSON con un caso o un CSV con muchos.
Calcula probabilidad de APTO, probabilidad de NO APTO y decisión final basada en el modelo entrenado.
"""
import argparse
import json
import os
import sys
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from tensorflow import keras

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C
from preprocess import Preprocessor  # noqa: F401 (necesario para deserializar joblib)


def load_model_and_preprocessor(model_path=None, use_ensemble=False):
    pre = joblib.load(C.ARTIFACTS / "preprocessor.joblib")

    if use_ensemble:
        manifest_path = C.ARTIFACTS / "ensemble_manifest.json"
        manifest = json.loads(manifest_path.read_text())
        models = [keras.models.load_model(C.ARTIFACTS / m["file"]) for m in manifest["models"]]
        return pre, models

    if model_path is None:
        if (C.ARTIFACTS / "model_best.keras").exists():
            model_path = C.ARTIFACTS / "model_best.keras"
        else:
            model_path = C.ARTIFACTS / "model_final.keras"

    model = keras.models.load_model(model_path)
    return pre, model


def score(df: pd.DataFrame, pre, model_or_models, use_ensemble=False) -> pd.DataFrame:
    X = pre.transform(df)
    if use_ensemble:
        probs = np.mean([m.predict(X, verbose=0).ravel() for m in model_or_models], axis=0)
    else:
        probs = model_or_models.predict(X, verbose=0).ravel()

    out = (
        df[["id_solicitud"]].copy()
        if "id_solicitud" in df
        else pd.DataFrame({"id_solicitud": np.arange(1, len(df) + 1)}, index=df.index)
    )
    out["probabilidad_apto"] = probs.round(4)
    out["probabilidad_no_apto"] = (1.0 - probs).round(4)
    out["resultado"] = [
        "APTO" if v >= C.THRESHOLD else "NO APTO" for v in probs
    ]
    return out


if __name__ == "__main__":
    a = argparse.ArgumentParser(description="Inferencia de riesgo crediticio para solicitantes")
    a.add_argument("--json", help="Archivo JSON con un solicitante")
    a.add_argument("--csv", help="CSV con varios solicitantes")
    a.add_argument("--model", default=None, help="Ruta al modelo .keras a utilizar")
    a.add_argument("--ensemble", action="store_true", help="Utilizar el mejor ensamble neuronal en lugar de un modelo único")
    args = a.parse_args()

    pre, model_obj = load_model_and_preprocessor(args.model, args.ensemble)

    if args.json:
        df = pd.DataFrame([json.loads(open(args.json).read())])
    elif args.csv:
        df = pd.read_csv(args.csv, encoding="utf-8-sig")
    else:
        sys.exit("Uso: python predict.py [--json solicitante.json | --csv lote.csv] [--ensemble]")

    scored_df = score(df, pre, model_obj, args.ensemble)
    print(scored_df.to_string(index=False))

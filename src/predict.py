"""Puntúa solicitantes nuevos: un JSON con un caso o un CSV con muchos."""
import argparse
import json
import os
import sys
from pathlib import Path
import joblib
import pandas as pd
from tensorflow import keras

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C
from preprocess import Preprocessor  # noqa: F401 (necesario para cargar el joblib)


def load():
    pre = joblib.load(C.ARTIFACTS / "preprocessor.joblib")
    model = keras.models.load_model(C.ARTIFACTS / "model_final.keras")
    return pre, model


def score(df: pd.DataFrame, pre, model) -> pd.DataFrame:
    p = model.predict(pre.transform(df), verbose=0).ravel()
    out = (
        df[["id_solicitud"]].copy()
        if "id_solicitud" in df
        else pd.DataFrame(index=df.index)
    )
    out["prob_apto"] = p.round(4)
    out["decision"] = ["APROBAR" if v >= C.THRESHOLD else "NEGAR" for v in p]
    return out


if __name__ == "__main__":
    a = argparse.ArgumentParser()
    a.add_argument("--json", help="archivo JSON con un solicitante")
    a.add_argument(
        "--csv", help="CSV con varios solicitantes (mismas columnas del dataset)"
    )
    args = a.parse_args()
    pre, model = load()
    if args.json:
        df = pd.DataFrame([json.loads(open(args.json).read())])
    elif args.csv:
        df = pd.read_csv(args.csv, encoding="utf-8-sig")
    else:
        sys.exit("Use --json archivo.json o --csv archivo.csv")
    print(score(df, pre, model).to_string(index=False))

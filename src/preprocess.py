"""Divide el CSV en train/val/test y ajusta el preprocesador SOLO con train."""
import json
import sys
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# Asegurar que el directorio de src esté en sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C


class Preprocessor:
    """Transformación reproducible: mismo comportamiento en entrenamiento y en producción."""

    def _clean(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.drop(columns=[c for c in C.DROP_COLS + [C.TARGET] if c in df]).copy()
        for col, rare in C.RARE_TO_OTRO.items():
            df[col] = df[col].replace({r: "Otro" for r in rare})
        for c in C.FLAG_COLS:
            df[c + "_nan"] = df[c].isna().astype(float)
        return df

    def fit(self, df: pd.DataFrame):
        df = self._clean(df)
        self.num_cols = [c for c in df.columns if c not in C.CAT_COLS]
        base = [c for c in self.num_cols if not c.endswith("_nan")]
        self.lo = df[base].quantile(0.01)
        self.hi = df[base].quantile(0.99)
        self.median = df[base].median()
        dummies = pd.get_dummies(df[C.CAT_COLS], dtype=float)
        self.dummy_cols = list(dummies.columns)
        self.scaler = StandardScaler().fit(self._matrix(df))
        self.feature_names = self.num_cols + self.dummy_cols
        return self

    def _matrix(self, df: pd.DataFrame) -> np.ndarray:
        base = [c for c in self.num_cols if not c.endswith("_nan")]
        df = df.copy()
        df[base] = df[base].clip(self.lo, self.hi, axis=1)
        for c in C.SKEW_COLS:
            df[c] = np.log1p(df[c].clip(lower=0))
        for c in C.SIGNED_LOG_COLS:
            df[c] = np.sign(df[c]) * np.log1p(df[c].abs())
        df[base] = df[base].fillna(self.median)
        dummies = pd.get_dummies(df[C.CAT_COLS], dtype=float).reindex(
            columns=self.dummy_cols, fill_value=0.0
        )
        return np.hstack([df[self.num_cols].to_numpy(float), dummies.to_numpy(float)])

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        return self.scaler.transform(self._matrix(self._clean(df))).astype("float32")


def main():
    C.ARTIFACTS.mkdir(exist_ok=True)
    df = pd.read_csv(C.DATA_CSV, encoding="utf-8-sig")
    y = df[C.TARGET].to_numpy("float32")
    idx = np.arange(len(df))
    tr, tmp = train_test_split(
        idx, test_size=C.VAL_FRAC + C.TEST_FRAC, stratify=y, random_state=C.SPLIT_SEED
    )
    va, te = train_test_split(
        tmp,
        test_size=C.TEST_FRAC / (C.VAL_FRAC + C.TEST_FRAC),
        stratify=y[tmp],
        random_state=C.SPLIT_SEED,
    )
    import preprocess  # el pickle guarda la clase como preprocess.Preprocessor

    pre = preprocess.Preprocessor().fit(df.iloc[tr])
    X = pre.transform(df)
    np.savez_compressed(
        C.ARTIFACTS / "splits.npz",
        X_train=X[tr],
        y_train=y[tr],
        X_val=X[va],
        y_val=y[va],
        X_test=X[te],
        y_test=y[te],
        idx_test=idx[te],
    )
    joblib.dump(pre, C.ARTIFACTS / "preprocessor.joblib")
    (C.ARTIFACTS / "feature_names.json").write_text(
        json.dumps(pre.feature_names, indent=2, ensure_ascii=False)
    )
    print(
        f"train={len(tr)} val={len(va)} test={len(te)} "
        f"features={X.shape[1]} aptos_train={y[tr].mean():.3f}"
    )


if __name__ == "__main__":
    main()

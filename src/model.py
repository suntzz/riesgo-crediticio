"""Definición de la red: MLP 44 -> 64 -> 32 -> 16 -> 1."""
import sys
from pathlib import Path
from tensorflow import keras

# Asegurar que el directorio de src esté en sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C


def build_model(n_features: int) -> keras.Model:
    inputs = keras.Input(shape=(n_features,), name="entrada")
    x = inputs
    for i, (units, drop) in enumerate(zip(C.HIDDEN, C.DROPOUT), start=1):
        x = keras.layers.Dense(
            units,
            activation="relu",
            kernel_initializer="he_normal",  # pesos: He (ReLU)
            bias_initializer="zeros",  # sesgos: 0
            name=f"oculta_{i}",
        )(x)
        if drop > 0:
            x = keras.layers.Dropout(drop, name=f"dropout_{i}")(x)
    outputs = keras.layers.Dense(
        1,
        activation="sigmoid",
        kernel_initializer="glorot_uniform",  # pesos: Glorot (sigmoide)
        bias_initializer="zeros",
        name="salida",
    )(x)
    model = keras.Model(inputs, outputs, name="mlp_riesgo_crediticio")
    model.compile(
        optimizer=keras.optimizers.Adam(
            learning_rate=C.LEARNING_RATE,
            beta_1=0.9,
            beta_2=0.999,
            epsilon=1e-8,
        ),
        loss="binary_crossentropy",
        metrics=[
            keras.metrics.AUC(name="auc"),
            keras.metrics.BinaryAccuracy(name="acc"),
        ],
    )
    return model


if __name__ == "__main__":
    build_model(44).summary()

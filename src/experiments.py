"""Sistema de experimentación sistemática para búsqueda de la mejor red neuronal.
Todas las comparaciones y selecciones se realizan EXCLUSIVAMENTE sobre VALIDATION (splits['X_val']).
El conjunto de TEST jamás se consulta en este módulo.
"""
import os
import sys
from pathlib import Path
import json
import time

os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    f1_score,
    log_loss,
    precision_score,
    recall_score,
    roc_auc_score,
)
import tensorflow as tf
from tensorflow import keras

sys.path.insert(0, str(Path(__file__).resolve().parent))
import config as C

# Limitar visibilidad a CPU para velocidad óptima en Apple Silicon
gpus = tf.config.list_physical_devices("GPU")
if gpus:
    tf.config.set_visible_devices([], "GPU")


def build_custom_model(
    n_features: int,
    layers: list[int] = [64, 32, 16],
    activation: str = "relu",
    dropout_rate: float = 0.2,
    dropout_layers: str = "all_except_last",  # 'all', 'all_except_last', 'first_two'
    use_batch_norm: bool = False,
    l2_reg: float = 0.0,
    optimizer_name: str = "Adam",
    learning_rate: float = 0.001,
    weight_decay: float = 1e-4,
) -> keras.Model:
    regularizer = keras.regularizers.l2(l2_reg) if l2_reg > 0 else None
    inputs = keras.Input(shape=(n_features,), name="entrada")
    x = inputs

    num_layers = len(layers)
    for idx, units in enumerate(layers):
        is_last = (idx == num_layers - 1)
        use_bias = not use_batch_norm

        if use_batch_norm:
            x = keras.layers.Dense(
                units,
                use_bias=False,
                kernel_initializer="he_normal",
                kernel_regularizer=regularizer,
                name=f"dense_{idx+1}",
            )(x)
            x = keras.layers.BatchNormalization(name=f"bn_{idx+1}")(x)
            if activation == "relu":
                x = keras.layers.Activation("relu", name=f"act_{idx+1}")(x)
            elif activation == "leaky_relu":
                x = keras.layers.LeakyReLU(negative_slope=0.1, name=f"act_{idx+1}")(x)
            elif activation == "elu":
                x = keras.layers.Activation("elu", name=f"act_{idx+1}")(x)
            elif activation == "gelu":
                x = keras.layers.Activation("gelu", name=f"act_{idx+1}")(x)
        else:
            if activation in ["relu", "elu", "gelu"]:
                x = keras.layers.Dense(
                    units,
                    activation=activation,
                    use_bias=True,
                    kernel_initializer="he_normal",
                    bias_initializer="zeros",
                    kernel_regularizer=regularizer,
                    name=f"dense_{idx+1}",
                )(x)
            elif activation == "leaky_relu":
                x = keras.layers.Dense(
                    units,
                    activation=None,
                    use_bias=True,
                    kernel_initializer="he_normal",
                    bias_initializer="zeros",
                    kernel_regularizer=regularizer,
                    name=f"dense_{idx+1}",
                )(x)
                x = keras.layers.LeakyReLU(negative_slope=0.1, name=f"act_{idx+1}")(x)

        # Regla de Dropout
        apply_drop = False
        if dropout_rate > 0:
            if dropout_layers == "all":
                apply_drop = True
            elif dropout_layers == "all_except_last" and not is_last:
                apply_drop = True
            elif dropout_layers == "first_two" and idx < 2:
                apply_drop = True

        if apply_drop:
            x = keras.layers.Dropout(dropout_rate, name=f"dropout_{idx+1}")(x)

    outputs = keras.layers.Dense(
        1,
        activation="sigmoid",
        kernel_initializer="glorot_uniform",
        bias_initializer="zeros",
        name="salida",
    )(x)

    model = keras.Model(inputs, outputs, name="mlp_experimento")

    if optimizer_name == "Adam":
        opt = keras.optimizers.Adam(
            learning_rate=learning_rate, beta_1=0.9, beta_2=0.999, epsilon=1e-8
        )
    elif optimizer_name == "AdamW":
        opt = keras.optimizers.AdamW(
            learning_rate=learning_rate, weight_decay=weight_decay, beta_1=0.9, beta_2=0.999, epsilon=1e-8
        )
    else:
        raise ValueError(f"Optimizador desconocido: {optimizer_name}")

    model.compile(
        optimizer=opt,
        loss="binary_crossentropy",
        metrics=[
            keras.metrics.AUC(name="auc"),
            keras.metrics.BinaryAccuracy(name="acc"),
        ],
    )
    return model


def run_single_experiment(
    exp_id: str,
    family: str,
    description: str,
    layers: list[int] = [64, 32, 16],
    activation: str = "relu",
    dropout_rate: float = 0.2,
    dropout_layers: str = "all_except_last",
    use_batch_norm: bool = False,
    l2_reg: float = 0.0,
    optimizer_name: str = "Adam",
    learning_rate: float = 0.001,
    weight_decay: float = 1e-4,
    batch_size: int = 128,
    seed: int = 42,
    es_monitor: str = "val_auc",
    es_mode: str = "max",
    es_patience: int = 12,
    max_epochs: int = 100,
    save_model: bool = False,
    save_dir: Path = None,
) -> dict:
    keras.utils.set_random_seed(seed)
    d = np.load(C.ARTIFACTS / "splits.npz")
    X_train, y_train = d["X_train"], d["y_train"]
    X_val, y_val = d["X_val"], d["y_val"]

    model = build_custom_model(
        n_features=X_train.shape[1],
        layers=layers,
        activation=activation,
        dropout_rate=dropout_rate,
        dropout_layers=dropout_layers,
        use_batch_norm=use_batch_norm,
        l2_reg=l2_reg,
        optimizer_name=optimizer_name,
        learning_rate=learning_rate,
        weight_decay=weight_decay,
    )

    if save_dir is None:
        save_dir = C.ARTIFACTS
    checkpoint_path = save_dir / f"candidate_{exp_id}.keras"

    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor=es_monitor,
            mode=es_mode,
            patience=es_patience,
            restore_best_weights=True,
            verbose=0,
        ),
        keras.callbacks.ReduceLROnPlateau(
            monitor=es_monitor,
            mode=es_mode,
            factor=0.5,
            patience=5,
            min_lr=1e-5,
            verbose=0,
        ),
    ]

    t0 = time.time()
    hist = model.fit(
        X_train,
        y_train,
        validation_data=(X_val, y_val),
        epochs=max_epochs,
        batch_size=batch_size,
        callbacks=callbacks,
        verbose=0,
    )
    elapsed = time.time() - t0

    # Evaluación estricta sobre VALIDATION
    p_val = model.predict(X_val, verbose=0, batch_size=4096).ravel()
    pred_val = (p_val >= 0.5).astype(int)

    val_auc = float(roc_auc_score(y_val, p_val))
    val_pr_auc = float(average_precision_score(y_val, p_val))
    val_acc = float(accuracy_score(y_val, pred_val))
    val_prec = float(precision_score(y_val, pred_val, zero_division=0))
    val_rec = float(recall_score(y_val, pred_val, zero_division=0))
    val_f1 = float(f1_score(y_val, pred_val, zero_division=0))
    val_ll = float(log_loss(y_val, p_val))
    val_brier = float(brier_score_loss(y_val, p_val))

    epochs_trained = len(hist.history["loss"])
    if es_mode == "max":
        best_epoch = int(np.argmax(hist.history[es_monitor])) + 1
    else:
        best_epoch = int(np.argmin(hist.history[es_monitor])) + 1

    train_loss = float(hist.history["loss"][best_epoch - 1])
    val_loss = float(hist.history["val_loss"][best_epoch - 1])

    if save_model:
        model.save(checkpoint_path)

    res = {
        "experiment_id": exp_id,
        "fase": "Fase_3",
        "family": family,
        "description": description,
        "arquitectura": str(layers),
        "número_de_parámetros": model.count_params(),
        "activación": activation,
        "learning_rate": learning_rate,
        "dropout": dropout_rate,
        "dropout_layers": dropout_layers,
        "L2": l2_reg,
        "optimizer": optimizer_name,
        "batch_size": batch_size,
        "patience": es_patience,
        "seed": seed,
        "Val_AUC": round(val_auc, 5),
        "Val_Loss": round(val_loss, 4),
        "Accuracy": round(val_acc * 100, 2),
        "Precision": round(val_prec * 100, 2),
        "Recall": round(val_rec * 100, 2),
        "F1": round(val_f1, 4),
        "PR_AUC": round(val_pr_auc, 5),
        "Brier": round(val_brier, 4),
        "mejor_época": best_epoch,
        "epochs_trained": epochs_trained,
        "tiempo_entrenamiento": round(elapsed, 1),
        "p_val": p_val,
    }
    return res

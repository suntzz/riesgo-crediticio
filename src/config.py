"""Configuración central: todos los hiperparámetros viven aquí."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_CSV = ROOT / "data" / "DatasetCreditoFinancieroFinalV2.csv"
if not DATA_CSV.exists():
    DATA_CSV = ROOT / "DatasetCreditoFinancieroFinalV2.csv"
if not DATA_CSV.exists():
    DATA_CSV = Path("/Users/suntz/Documents/Deep/DatasetCreditoFinancieroFinalV2.csv")

ARTIFACTS = ROOT / "artifacts"
REPORTS = ROOT / "reports"

TARGET = "APTO_PARA_CREDITO"  # 1 = apto, 0 = no apto
DROP_COLS = ["id_solicitud", "INCUMPLIO_PAGO"]  # id y complemento exacto del target

# Variables con >1 % de vacíos: reciben indicador 0/1 "estaba vacío"
FLAG_COLS = [
    "saldo_total_creditos",
    "numero_creditos_activos",
    "antiguedad_laboral_anios",
    "antiguedad_cliente_anios",
    "porcentaje_pagos_oportunos",
    "obligaciones_mensuales",
    "numero_cuotas_mora",
]
# Variables muy asimétricas: recorte p1-p99 + log1p
SKEW_COLS = [
    "ingreso_mensual",
    "obligaciones_mensuales",
    "monto_solicitado",
    "cuota_estimada",
    "saldo_total_creditos",
    "numero_cuotas_mora",
    "dias_maximo_mora",
    "nivel_endeudamiento_pct",
    "numero_creditos_activos",
    "personas_a_cargo",
]
SIGNED_LOG_COLS = ["ingreso_disponible"]  # puede ser negativa
CAT_COLS = ["estado_civil", "linea_negocio", "tipo_contrato", "tipo_vivienda"]
RARE_TO_OTRO = {
    "tipo_contrato": [
        "Businessman",
        "Student",
        "Maternity leave",
        "Unemployed",
    ]
}

# División de datos
SPLIT_SEED = 42
VAL_FRAC = 0.15
TEST_FRAC = 0.15

# Arquitectura
HIDDEN = (64, 32, 16)
DROPOUT = (0.2, 0.2, 0.0)

# Entrenamiento
LEARNING_RATE = 1e-3
BATCH_SIZE = 128
MAX_EPOCHS = 100
ES_PATIENCE = 10
RLR_FACTOR, RLR_PATIENCE, RLR_MIN_LR = 0.5, 5, 1e-5
THRESHOLD = 0.5

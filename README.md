# Red Neuronal para Predicción de Riesgo Crediticio

Modelo de aprendizaje profundo (Perceptrón Multicapa) desarrollado para la determinación y predicción del riesgo de incumplimiento crediticio bancario sobre solicitantes de crédito de consumo.

Proyecto desarrollado y ejecutado en **Mac mini M4 (Apple Silicon)**, Universidad Católica de Colombia.

---

## 📌 Arquitectura del Modelo

El modelo es un **Perceptrón Multicapa (MLP)** de clasificación binaria implementado en **TensorFlow / Keras 3**:

```
Entrada (44 features estandarizadas)
   │
   ▼
Capa Oculta 1: Dense 64 neuronas (ReLU, He Normal) + Dropout (0.2)
   │
   ▼
Capa Oculta 2: Dense 32 neuronas (ReLU, He Normal) + Dropout (0.2)
   │
   ▼
Capa Oculta 3: Dense 16 neuronas (ReLU, He Normal)
   │
   ▼
Capa de Salida: Dense 1 neurona (Sigmoide, Glorot Uniform) ──► P(apto para crédito)
```

* **Parámetros totales entrenables:** **5.505**.
* **Optimizador:** Adam ($\eta = 0.001$, $\beta_1 = 0.9$, $\beta_2 = 0.999$, $\epsilon = 10^{-8}$).
* **Función de pérdida:** Binary Crossentropy.
* **Regularización y Callbacks:**
  * `EarlyStopping` (patience = 10, restore_best_weights = True)
  * `ReduceLROnPlateau` (factor = 0.5, patience = 5, min_lr = 1e-5)
  * `ModelCheckpoint` guardando los mejores pesos en `artifacts/model_final.keras`

---

## 📊 Resultados Obtenidos en Mac mini M4

Entrenamiento ejecutado con semilla 1 sobre partición 70/15/15 estratificada:

| Métrica | Referencia en Guía | **Resultado Real Obtenido** |
| :--- | :--- | :--- |
| **Tiempo de entrenamiento** | 10 – 25 s | **~6 segundos (CPU M4)** |
| **Mejor época (validación)** | Épocas 15 – 45 | **Época 14** |
| **val_loss (mejor época)** | 0,592 – 0,596 | **0,5933** |
| **val_auc (mejor época)** | 0,748 – 0,752 | **0,7498** |
| **AUC (Conjunto de Prueba)** | 0,7420 (±0.003) | **0,7424** |
| **Exactitud (Accuracy Test)** | 67,29 % | **67,32 %** |
| **Tasa de Error (umbral 0.5)** | 32,71 % | **32,68 %** |
| **Precision (Test)** | — | **67,91 %** |
| **Recall (Test)** | — | **65,68 %** |
| **F1-Score (Test)** | 0,6702 | **0,6678** |
| **Log Loss (Test)** | 0,5992 | **0,5992** |
| **Brier Score (Test)** | 0,2063 | **0,2062** |
| **AUC Ensamble (5 semillas)** | 0,7448 | **0,7446** |
| **Error Ensamble (5 semillas)** | 32,29 % | **32,38 %** |

### Desempeño a Prevalencia Real (8.07% de mora)
* **Umbral 0.5:** Tasa de aprobación = 62.9%, Mora en aprobados = 3.98% (reduce la mora inicial a la mitad), Malos detectados = 69.0%.
* **Umbral 0.6:** Tasa de aprobación = 48.4%, Mora en aprobados = 3.08%, Malos detectados = 81.5%.
* **Umbral 0.7:** Tasa de aprobación = 25.8%, Mora en aprobados = 1.93%, Malos detectados = 93.8%.

---

## 📁 Estructura del Repositorio

```
.
├── DatasetCreditoFinancieroFinalV2.csv  # Dataset balanceado (49.650 filas, 26 columnas)
├── requirements.txt                    # Dependencias
├── data/
│   ├── DatasetCreditoFinancieroFinalV2.csv
│   ├── ejemplo_solicitante.json        # Caso individual de prueba
│   └── ejemplo_lote.csv               # Lote de prueba (5 casos)
├── src/
│   ├── config.py                       # Configuración e hiperparámetros
│   ├── preprocess.py                   # Preprocesamiento y división 70/15/15
│   ├── model.py                        # Definición de la arquitectura Keras
│   ├── train.py                        # Entrenamiento con EarlyStopping
│   ├── evaluate.py                     # Evaluación en test y generación de gráficas
│   ├── predict.py                      # Inferencia para JSON o CSV
│   ├── importance.py                   # Importancia por permutación
│   └── ensemble.py                     # Ensamble de 5 redes neuronales
├── artifacts/
│   ├── feature_names.json              # Las 44 características en orden
│   ├── splits.npz                      # Conjuntos transformados train/val/test
│   ├── preprocessor.joblib             # Objeto Preprocessor ajustado
│   └── model_final.keras               # Red neuronal entrenada (mejores pesos)
└── reports/
    ├── metrics_final.json              # Métricas cuantitativas en test
    ├── history_final.csv               # Historial de entrenamiento por época
    ├── curvas_final.png                # Gráfica de Pérdida y Curva ROC
    ├── accuracy_final.png              # Gráfica de Exactitud train/val
    ├── matriz_confusion_final.png      # Matriz de confusión visual anotada
    ├── evaluacion_completa_final.png   # Panel 2x2 completo
    └── importancia_variables.csv       # Tabla de pesos de importancia
```

---

## 🚀 Instalación y Reproducción

### 1. Requisitos y Entorno Virtual

Se recomienda Python 3.11:

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### 2. Preprocesamiento de Datos

Genera los splits y ajusta el preprocesador exclusivamente sobre el 70% de entrenamiento:

```bash
python src/preprocess.py
```

### 3. Entrenamiento

Entrena la red neuronal y guarda el mejor checkpoint:

```bash
python src/train.py --seed 1 --tag final
```

### 4. Evaluación

Calcula las métricas sobre el conjunto de test (7.448 registros) y genera los gráficos:

```bash
python src/evaluate.py --tag final
```

### 5. Predicción (Inferencia)

* **Predicción individual desde archivo JSON:**
  ```bash
  python src/predict.py --json data/ejemplo_solicitante.json
  ```
  *Salida:*
  ```
   id_solicitud  prob_apto decision
         172745     0.6276  APROBAR
  ```

* **Predicción por lote desde archivo CSV:**
  ```bash
  python src/predict.py --csv data/ejemplo_lote.csv
  ```
  *Salida:*
  ```
   id_solicitud  prob_apto decision
         172745     0.6276  APROBAR
         413676     0.1593    NEGAR
         270588     0.1439    NEGAR
         183124     0.4418    NEGAR
         165787     0.1468    NEGAR
  ```

### 6. Extras (Opcionales)

* **Importancia de variables por permutación:**
  ```bash
  python src/importance.py
  ```
* **Ensamble de 5 semillas (1 a 5):**
  ```bash
  python src/ensemble.py
  ```

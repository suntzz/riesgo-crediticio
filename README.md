# Red Neuronal para Predicción de Riesgo Crediticio

Modelo de aprendizaje profundo (Perceptrón Multicapa) desarrollado para la determinación y predicción del riesgo de incumplimiento crediticio bancario sobre solicitantes de crédito de consumo.

Proyecto desarrollado y ejecutado en **Mac mini M4 (Apple Silicon)**, Universidad Católica de Colombia.

---

## 📌 1. Arquitectura de las Redes Neuronales

### Red Ganadora Seleccionada (`model_best.keras`):
* **Topología:** $44 \to 64 \to 32 \to 16 \to 1$.
* **Parámetros entrenables:** **5.505** (pesos y sesgos).
* **Hiperparámetros óptimos:**
  * Optimizador: `Adam` con $\eta = 0.0005$ (tasa reducida respecto al baseline para convergencia más suave).
  * Funciones de activación: `ReLU` en capas ocultas, `Sigmoide` en capa de salida.
  * Inicialización: He Normal en capas ocultas, Glorot Uniform en salida, sesgos en 0.
  * Regularización: `Dropout(0.15)` en las dos primeras capas ocultas.
  * Callbacks: `EarlyStopping` (monitoreando `val_auc`, paciencia 12, mode='max', `restore_best_weights=True`) y `ReduceLROnPlateau` (factor 0.5, paciencia 5, min_lr 1e-5).

### Mejor Ensamble Neuronal (`Ensemble_Top3_Diverso`):
Promedio simple de probabilidades de 3 redes con diversidad arquitectural y de semillas:
1. `cfg_c_s42`: $44 \to 64 \to 32 \to 16 \to 1$ (ReLU, $\eta = 0.0005$, Dropout 0.15, semilla 42).
2. `cfg_b_leaky_s42`: $44 \to 32 \to 16 \to 1$ (LeakyReLU $\alpha=0.1$, $\eta = 0.0005$, Dropout 0.15, semilla 42).
3. `cfg_base_s2026`: $44 \to 64 \to 32 \to 16 \to 1$ (ReLU, $\eta = 0.001$, Dropout 0.20, semilla 2026).

---

## 📊 2. Resultados Comparativos Finales sobre Test (Congelados)

Evaluación realizada sobre el conjunto de prueba aislado (**7.448 registros**) tras completar la búsqueda exclusivamente en **Validation**:

| Modelo | Val AUC | Test AUC | Accuracy | Error % | Precision | Recall | F1 | Log Loss | Brier Score | $\Delta$ AUC vs Baseline |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline Histórico (`model_final.keras`)** | 0.7497 | 0.7424 | 67.32% | 32.68% | 67.91% | 65.68% | 0.6678 | 0.5992 | 0.2062 | 0.0000 |
| **Mejor Red Individual (`model_best.keras`)** | **0.7523** | **0.7437** | 67.32% | 32.68% | 67.64% | 66.41% | **0.6702** | **0.5979** | **0.2056** | **+0.0013** |
| **Mejor Ensamble Neuronal (Top-3 Diverso)** | **0.7538** | **0.7448** | **67.48%** | **32.52%** | **67.84%** | **66.49%** | **0.6715** | **0.5963** | **0.2050** | **+0.0024** |

### Desempeño a Prevalencia Real de Cartera (8.07% de incumplimiento)
* **Umbral 0.5:** Tasa de aprobación = **62.9%**, Mora esperada en cartera aprobada = **3.98%** (reducción del 50.7% del riesgo frente al 8.07% del universo original), Detección de morosos = **69.0%**.
* **Umbral 0.6:** Aprobación = **48.4%**, Mora = **3.08%**, Detección de morosos = **81.5%**.
* **Umbral 0.7:** Aprobación = **25.8%**, Mora = **1.93%**, Detección de morosos = **93.8%**.

---

## 🔬 3. Resumen de la Búsqueda Experimental (37 Experimentos)

Se evaluaron sistemáticamente más de 37 configuraciones sobre el conjunto de validación (`reports/experiments.csv`):
1. **Familias de arquitecturas:**
   * *Pequeñas ($44 \to 32 \to 16 \to 1$):* Val AUC alcanzando **0.75225** con solo 1.985 parámetros. Menor sobreajuste debido a la regularidad de los datos tabulares.
   * *Medias ($44 \to 64 \to 32 \to 16 \to 1$):* Val AUC **0.75225** optimizando la tasa de aprendizaje y el criterio de Early Stopping.
   * *Profundas ($44 \to 128 \to 96 \to 48 \to 24 \to 1$):* Val AUC cayó a **0.74897**, confirmando que una mayor profundidad en datos tabulares ruidosos genera sobreajuste prematuro.
2. **Batch Normalization:** Probada en redes medianas y profundas (`EXP_23_BN_MED`, `EXP_24_BN_DEEP`). No aportó ventaja frente a la estandarización Z-score + He Normal + Dropout y degradó ligeramente el AUC a 0.7493.
3. **Dropout:** Variado de 0.0 a 0.40. Sin Dropout (`drop=0.0`) el AUC cayó a **0.7447** (overfitting severo). El rango óptimo se ubicó entre 0.15 y 0.20.
4. **Learning Rate:** La tasa $\eta = 0.0005$ superó a $\eta = 0.0010$ permitiendo descensos de gradiente más estables antes de aplicar reducción por meseta.
5. **Robustez Multi-seed:** Evaluadas 4 configuraciones finalistas sobre las semillas `[42, 1, 7, 21, 2026]` (`reports/multiseed_evaluation.csv`), ratificando a `Config_C` con la mayor media global de Val AUC (0.75025).

---

## 🧠 4. Fundamentos Teóricos de la Red Neuronal

### Concepto de Neurona Artificial
Cada neurona $j$ en una capa $l$ realiza una combinación lineal ponderada de sus entradas $a^{(l-1)}$ más un término independiente (sesgo o bias $b_j$):
$$z_j^{(l)} = \sum_{i=1}^{n} w_{ji}^{(l)} a_i^{(l-1)} + b_j^{(l)}$$

* **Pesos ($W$):** Representan la intensidad e inclinación de la relación entre cada característica y la neurona. Si un peso es positivo y grande, estimula la probabilidad de aptitud; si es negativo, la inhibe.
* **Sesgo ($b$):** Permite desplazar la función de activación horizontalmente, independientemente del valor de las entradas. Es el umbral de activación intrínseco.
* **Activación ReLU:** $a = \max(0, z)$. Introduce no linealidad y previene el desvanecimiento del gradiente (*vanishing gradient*), permitiendo que la red aprenda interacciones complejas.
* **Activación Sigmoide (Salida):** $\sigma(z) = \frac{1}{1 + e^{-z}}$. Aplica un mapeo estricto al intervalo $(0, 1)$, interpretando el resultado directamente como $P(\text{Apto} \mid x)$.
* **Función de Pérdida (Binary Crossentropy):**
  $$\mathcal{L} = -\frac{1}{N} \sum_{i=1}^{N} \left[ y_i \log(\hat{y}_i) + (1 - y_i) \log(1 - \hat{y}_i) \right]$$
  Penaliza de forma asintótica las predicciones seguras pero incorrectas.
* **Backpropagation y Optimizador Adam:**
  Mediante la regla de la cadena se calcula el gradiente $\frac{\partial \mathcal{L}}{\partial W}$ y $\frac{\partial \mathcal{L}}{\partial b}$. Adam ajusta las tasas individuales para cada parámetro manteniendo promedios móviles exponenciales del gradiente (momento de primer orden $\beta_1=0.9$) y de los gradientes al cuadrado (momento de segundo orden $\beta_2=0.999$).

---

## ⚠️ 5. Advertencias y Limitaciones Metodológicas

1. **Sesgo de Selección Obligatorio (`diccionario.pdf`):** La variable objetivo `APTO_PARA_CREDITO` se construyó como $1 - \text{TARGET}$ de la base histórica de Home Credit. Dado que dicha fuente contiene únicamente créditos aprobados y desembolsados, la clase 0 representa **"solicitante aprobado que posteriormente incumplió"** y **no** solicitantes rechazados en ventanilla.
2. **Balanceo Artificial 50/50:** El dataset fue submuestreado con semilla 42 igualando 24.825 casos de cada clase. Por ello, métricas como exactitud o precisión crudas sobre este CSV están calculadas sobre una prevalencia del 50%, mientras que en producción la prevalencia real es del 8.07%. Para la sustentación debe utilizarse la tabla reexpresada a prevalencia real.
3. **Exclusión de Fuga de Información:** `id_solicitud` e `INCUMPLIO_PAGO` están rigurosamente excluidos en `DROP_COLS`. Todas las estadísticas de escalamiento, recorte P1-P99 e imputación se calcularon estrictamente sobre el 70% de entrenamiento.

---

## 💻 6. Guía de Uso e Inferencia

### Requisitos e Instalación
```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Reproducción Completa
```bash
python src/preprocess.py        # Preprocesamiento y splits sin leakage
python src/run_experiments.py   # Suite de 29 experimentos sistemáticos
python src/multiseed_eval.py    # Evaluación multi-seed de robustez
python src/train_ensembles.py   # Entrenamiento de ensambles neuronales
python src/final_evaluation.py  # Evaluación final y congelada sobre TEST
python src/inspect_weights.py   # Inspección estadística y gráfica de pesos
```

### Predicción para Solicitantes Nuevos (`predict.py`)
* **Predicción individual desde JSON:**
  ```bash
  python src/predict.py --json data/ejemplo_solicitante.json
  ```
  *Salida:*
  ```
   id_solicitud  probabilidad_apto  probabilidad_no_apto resultado
         172745             0.6215                0.3785      APTO
  ```

* **Predicción individual con Ensamble Neuronal:**
  ```bash
  python src/predict.py --json data/ejemplo_solicitante.json --ensemble
  ```

* **Predicción por lote desde CSV:**
  ```bash
  python src/predict.py --csv data/ejemplo_lote.csv
  ```
  *Salida:*
  ```
   id_solicitud  probabilidad_apto  probabilidad_no_apto resultado
         172745             0.6215                0.3785      APTO
         413676             0.1751                0.8249   NO APTO
         270588             0.1874                0.8126   NO APTO
         183124             0.4362                0.5638   NO APTO
         165787             0.1568                0.8432   NO APTO
  ```

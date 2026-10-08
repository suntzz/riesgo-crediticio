# Red Neuronal para Predicción de Riesgo Crediticio

Modelo de aprendizaje profundo (Perceptrón Multicapa) desarrollado para la determinación y predicción del riesgo de incumplimiento crediticio bancario sobre solicitantes de crédito de consumo.

Proyecto desarrollado y ejecutado en **Mac mini M4 (Apple Silicon)**, Universidad Católica de Colombia.

---

## 📌 1. Arquitectura de las Redes Neuronales

### Mejor Red Individual de Fase 2 (`model_best_phase2.keras` / `model_best.keras`):
* **Topología:** $44 \to 64 \to 32 \to 16 \to 1$.
* **Parámetros entrenables:** **5.505** (pesos y sesgos).
* **Hiperparámetros óptimos seleccionados en Validación:**
  * Optimizador: `Adam` con $\eta = 0.0005$.
  * Funciones de activación: `ReLU` en capas ocultas, `Sigmoide` en capa de salida.
  * Inicialización: He Normal en capas ocultas, Glorot Uniform en salida, sesgos en 0.
  * Regularización combinada: `Dropout(0.15)` en las dos primeras capas ocultas + `L2 Kernel Regularization (1e-4)`.
  * Callbacks: `EarlyStopping` (monitoreando `val_auc`, paciencia 12, mode='max', `restore_best_weights=True`) y `ReduceLROnPlateau` (factor 0.5, paciencia 5, min_lr 1e-5).
  * **Val AUC individual:** **0.75250** (récord individual del proyecto en validación).
  * **Val AUC medio en 5 semillas:** **0.75103** ($\sigma = 0.00091$).

### Mejor Ensamble Neuronal (`Ensemble_Top3_Diverso`):
Promedio aritmético de 3 redes con diversidad arquitectural y de semillas para descorrelación de errores:
1. `cfg_c_s42`: $44 \to 64 \to 32 \to 16 \to 1$ (ReLU, $\eta = 0.0005$, Dropout 0.15, semilla 42).
2. `cfg_b_leaky_s42`: $44 \to 32 \to 16 \to 1$ (LeakyReLU $\alpha=0.1$, $\eta = 0.0005$, Dropout 0.15, semilla 42).
3. `cfg_base_s2026`: $44 \to 64 \to 32 \to 16 \to 1$ (ReLU, $\eta = 0.001$, Dropout 0.20, semilla 2026).
* **Val AUC en Validación:** **0.75382**.
* **Val Log Loss:** **0.5888** (la menor pérdida de validación).

---

## 📊 2. Resultados Comparativos Finales sobre Test (Congelados)

Evaluación realizada sobre el conjunto de prueba aislado (**7.448 registros**) tras completar todas las búsquedas exclusivamente en **Validation**:

| Modelo | Val AUC | Test AUC | Accuracy % | Error % | Precision % | Recall % | F1-Score | Log Loss | Brier | $\Delta$ vs 0.7448 | $\Delta$ vs 0.7424 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Baseline Histórico (`model_final.keras`)** | 0.74969 | 0.74243 | 67.32% | 32.68% | 67.91% | 65.68% | 0.6678 | 0.5992 | 0.2062 | -0.00237 | +0.00003 |
| **2. Mejor Red Fase 1 (`cfg_c_s42`)** | 0.75225 | 0.74373 | 67.32% | 32.68% | 67.64% | 66.41% | 0.6702 | 0.5979 | 0.2056 | -0.00107 | +0.00133 |
| **3. Mejor Red Fase 2 (`model_best_phase2.keras` L2)** | **0.75250** | **0.74336** | 67.33% | 32.67% | 67.56% | 66.68% | 0.6712 | 0.5980 | 0.2057 | -0.00144 | +0.00096 |
| **4. Ensamble Fase 1 / Fase 2 (Top-3 Diverso)** | **0.75382** | **0.74482** | **67.48%** | **32.52%** | **67.84%** | **66.49%** | **0.6715** | **0.5963** | **0.2050** | **+0.00002** | **+0.00242** |
| **5. Ensamble Fase 2 (Opt3: L2 + Leaky + Base)** | 0.75378 | 0.74460 | 67.43% | 32.57% | 67.74% | 66.54 | 0.6714 | 0.5964 | 0.2051 | -0.00020 | +0.00220 |
| **6. Ensamble Fase 2 (Ponderado Óptimo)** | 0.75372 | 0.74420 | 67.48% | 32.52% | 67.70 | 66.86 | 0.6728 | 0.5967 | 0.2052 | -0.00060 | +0.00180 |

### Desempeño a Prevalencia Real de Cartera (8.07% de incumplimiento)
* **Umbral 0.5:** Tasa de aprobación = **62.9%**, Mora esperada en cartera aprobada = **3.98%** (reducción del 50.7% del riesgo frente al 8.07% del universo original), Detección de morosos = **69.0%**.
* **Umbral 0.6:** Aprobación = **48.4%**, Mora = **3.08%**, Detección de morosos = **81.5%**.
* **Umbral 0.7:** Aprobación = **25.8%**, Mora = **1.93%**, Detección de morosos = **93.8%**.

---

## 🔬 3. Hallazgos Experimentales Clave

### A. Prueba de Ablation y Feature Engineering (`reports/ablation_study.csv`)
* **Set A (44 características canónicas):** Val AUC = **0.75225** (Ganador indiscutible).
* **Set B (35 características, excluyendo supuestas redundantes):** Val AUC = 0.75202 (empeoró el resultado).
* **Set E (50 características, sumando 6 ratios financieros derivados):** Val AUC = 0.75180 (no superó a la representación canónica de 44).
* **Set D (21 características financieras + comportamiento):** Val AUC = 0.74409.
* **Set C (9 variables puramente financieras, sin buró):** Val AUC = 0.62789 (colapso del poder predictivo, confirmando que el historial crediticio y el score son insustituibles).
* **Conclusión:** Se mantuvieron las 44 características para evitar pérdida de señal.

### B. Búsqueda Fina de Fase 2 (`reports/experiments_phase2.csv`)
* **L2 Kernel Regularization:** La adición de una regularización L2 ligera ($10^{-4}$) combinada con Dropout 0.15 produjo el Val AUC individual más alto (**0.75250**), estabilizando la magnitud de los pesos y reduciendo la varianza entre épocas.
* **Learning Rate:** $\eta = 0.0005$ demostró ser el ritmo de convergencia ideal. Valores menores ($\le 0.0003$) ralentizaron el aprendizaje y valores mayores ($\ge 0.0010$) aumentaron la oscilación cerca del mínimo.
* **Dropout:** El rango óptimo fino se ubicó entre 0.150 y 0.225. Sin dropout el modelo sobreajusta (Val AUC = 0.7447), mientras que por encima de 0.30 sufre subajuste.
* **LeakyReLU vs ReLU:** LeakyReLU produjo la menor pérdida de validación (0.5895) y la exactitud más alta (69.10%), convirtiéndose en el mejor complemento no lineal para combinar con redes ReLU en los ensambles.

### C. Análisis de Diversidad y Correlación de Predicciones (`reports/model_prediction_correlations.png`)
* La correlación entre modelos con idéntica arquitectura superó 0.985.
* La correlación entre la red compacta LeakyReLU (`[32, 16]`) y la red principal ReLU (`[64, 32, 16]`) bajó a 0.965–0.970.
* Esta descorrelación de errores explica por qué el ensamble de arquitecturas diversas alcanza un Val AUC de **0.75382**, superando a cualquier red individual.

---

## 🧠 4. Fundamentos Teóricos de la Red Neuronal para Sustentación

1. **Neurona Artificial:** Unidad computacional que realiza una combinación lineal ponderada de sus entradas $a^{(l-1)}$ más un sesgo independiente $b$:
   $$z_j^{(l)} = \sum_{i=1}^{n} w_{ji}^{(l)} a_i^{(l-1)} + b_j^{(l)}$$
2. **Pesos ($W$):** Determinan la sensibilidad e importancia de cada característica para activar o inhibir una neurona. Se inicializan mediante He Normal para preservar la varianza de los gradientes a través de capas ReLU.
3. **Sesgo ($b$):** Permite desplazar la función de activación horizontalmente, garantizando que la neurona pueda activarse o desactivarse incluso si las entradas son cero.
4. **Activación ReLU y LeakyReLU:** $a = \max(0, z)$ y $a = \max(\alpha z, z)$. Proporcionan no linealidad, resuelven el problema del desvanecimiento del gradiente y permiten computar derivadas de manera instantánea ($\mathcal{O}(1)$).
5. **Capa de Salida y Sigmoide:** $\sigma(z) = \frac{1}{1 + e^{-z}}$. Comprime la salida al intervalo abierto $(0, 1)$, permitiendo interpretar el valor directamente como la probabilidad condicional a posteriori $P(\text{Apto} \mid x)$.
6. **Función de Pérdida (Binary Crossentropy):**
   $$\mathcal{L} = -\frac{1}{N} \sum_{i=1}^{N} \left[ y_i \log(\hat{y}_i) + (1 - y_i) \log(1 - \hat{y}_i) \right]$$
   Mide la divergencia de Kullback-Leibler entre la distribución real Bernoulli y la predicha.
7. **Backpropagation y Adam:**
   La regla de la cadena propaga el error desde la salida hacia atrás: $\frac{\partial \mathcal{L}}{\partial W^{(l)}} = \frac{\partial \mathcal{L}}{\partial z^{(l)}} \cdot (a^{(l-1)})^T$. Adam adapta las tasas de aprendizaje para cada peso utilizando momentos exponenciales de primer orden ($m_t$) y segundo orden ($v_t$), amortiguando oscilaciones y acelerando el descenso en direcciones persistentes.
8. **Por qué el Ensamble supera a una Red Individual:**
   El error cuadrático esperado de un ensamble de $M$ modelos descorrelacionados se reduce según la teoría de Hansen & Salamon:
   $$\mathbb{E}[(\bar{f}(x) - y)^2] = \frac{1}{M} \text{Var}(f_i) + \text{Sesgo}^2 + \text{Covarianza}$$
   Al promediar modelos con topologías y activaciones distintas, las varianzas y errores aleatorios individuales se cancelan mutuamente mientras se preserva la señal predictiva.

---

## ⚠️ 5. Advertencias Metodológicas Obligatorias

1. **Sesgo de Selección Obligatorio (`diccionario.pdf`):** La variable dependiente `APTO_PARA_CREDITO` se construyó a partir de créditos efectivamente aprobados y desembolsados en la fuente primaria. La clase 0 representa **"aprobado que terminó incumpliendo"** y no un solicitante rechazado por un analista.
2. **Balanceo Artificial 50/50:** El dataset original de 307.511 registros (8.07% de incumplimiento) fue submuestreado a 49.650 filas (50% por clase). Por ende, las métricas estándar de prueba deben interpretarse bajo esta premisa y contrastarse contra la tabla reexpresada a prevalencia real (8.07%).
3. **Ausencia de Data Leakage:** Ni `id_solicitud` ni `INCUMPLIO_PAGO` entraron a la red. Todas las estadísticas de preprocesamiento se fijaron únicamente con el conjunto de entrenamiento.

---

## 💻 6. Guía de Uso e Inferencia

### Requisitos e Instalación
```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Reproducción de los Experimentos de Fase 2
```bash
python src/ablation_study.py         # Prueba de Ablation y Feature Engineering
python src/run_phase2_experiments.py # Suite de 25 experimentos finos
python src/phase2_ensembles.py       # Análisis de correlación y ensambles
python src/multiseed_phase2.py       # Evaluación multi-seed de Fase 2
python src/final_test_phase2.py      # Evaluación final y congelada en Test
```

### Inferencia para Solicitantes Nuevos (`predict.py`)
* **Predicción individual con la Mejor Red de Fase 2:**
  ```bash
  python src/predict.py --json data/ejemplo_solicitante.json --model artifacts/model_best_phase2.keras
  ```
  *Salida:*
  ```
   id_solicitud  probabilidad_apto  probabilidad_no_apto resultado
         172745             0.6258                0.3742      APTO
  ```

* **Predicción individual con el Mejor Ensamble:**
  ```bash
  python src/predict.py --json data/ejemplo_solicitante.json --ensemble
  ```
  *Salida:*
  ```
   id_solicitud  probabilidad_apto  probabilidad_no_apto resultado
         172745             0.6306                0.3694      APTO
  ```

* **Predicción por lote desde CSV:**
  ```bash
  python src/predict.py --csv data/ejemplo_lote.csv --model artifacts/model_best_phase2.keras
  ```
  *Salida:*
  ```
   id_solicitud  probabilidad_apto  probabilidad_no_apto resultado
         172745             0.6258                0.3742      APTO
         413676             0.1710                0.8290   NO APTO
         270588             0.1904                0.8096   NO APTO
         183124             0.4378                0.5622   NO APTO
         165787             0.1406                0.8594   NO APTO
  ```

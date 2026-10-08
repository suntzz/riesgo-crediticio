# Reporte Definitivo de Evaluación en Test — Modelo Final

## 1. Identificación y Parámetros del Experimento

* **Fecha y hora de ejecución:** 2026-10-08T16:52:28
* **Modelo Final Evaluado:** `Ensemble_Top3_Diverso`
* **Dataset fuente:** `/Users/suntz/Documents/Deep/DatasetCreditoFinancieroFinalV2.csv`
* **Hash SHA-256 verificado:** `19c5b59ccce6face1a0b828d201605aeb0e70b214f7ed60be2efdf13f47f851d`
* **Tamaño del dataset:** 8,436,730 bytes (permisos POSIX 444, solo lectura)
* **Distribución de observaciones:**
  * Entrenamiento (Train): 34,755 (70.0%)
  * Validación (Validation): 7,447 (15.0%)
  * Prueba (Test): 7,448 (15.0%)
  * Total de registros: 49,650
* **Pipeline de preprocesamiento:** `artifacts/preprocessor.joblib` (ajustado exclusivamente sobre Train; 44 variables predictoras resultantes).
* **Particiones congeladas:** `artifacts/splits.npz` (semilla de partición 42, estratificada).

---

## 2. Composición y Arquitectura del Ensamble Final

El modelo final seleccionado corresponde a una combinación lineal equiponderada de tres redes neuronales con arquitecturas y funciones de activación heterogéneas:

$$\hat{p}_{\text{final}} = \frac{p_{1} + p_{2} + p_{3}}{3}$$

1. **Modelo 1 (`cfg_c_s42.keras`):**
   * Arquitectura: 44 $\to$ Dense(64, ReLU) $\to$ Dropout(0.15) $\to$ Dense(32, ReLU) $\to$ Dropout(0.15) $\to$ Dense(16, ReLU) $\to$ Dense(1, Sigmoid).
   * Optimizador: Adam ($\eta = 0.0005$, $\beta_1 = 0.9$, $\beta_2 = 0.999$, $\epsilon = 10^{-8}$).
   * Regularización: Dropout = 0.15 en las dos primeras capas densas; regularización $L_2 = 0.0$.
   * Criterio de parada temprana: Paciencia de 12 épocas monitoreando `val_auc` (modo max).
   * Semilla aleatoria: 42.
   * Parámetros entrenables: 5,505.
   * Peso en el ensamble: $w_1 = 1/3 \approx 0.3333$.

2. **Modelo 2 (`cfg_b_leaky_s42.keras`):**
   * Arquitectura: 44 $\to$ Dense(32, LeakyReLU $\alpha = 0.1$) $\to$ Dropout(0.15) $\to$ Dense(16, LeakyReLU $\alpha = 0.1$) $\to$ Dense(1, Sigmoid).
   * Optimizador: Adam ($\eta = 0.0005$, $\beta_1 = 0.9$, $\beta_2 = 0.999$, $\epsilon = 10^{-8}$).
   * Regularización: Dropout = 0.15 en la primera capa densa; regularización $L_2 = 0.0$.
   * Criterio de parada temprana: Paciencia de 12 épocas monitoreando `val_auc` (modo max).
   * Semilla aleatoria: 42.
   * Parámetros entrenables: 1,985.
   * Peso en el ensamble: $w_2 = 1/3 \approx 0.3333$.

3. **Modelo 3 (`cfg_base_s2026.keras`):**
   * Arquitectura: 44 $\to$ Dense(64, ReLU) $\to$ Dropout(0.20) $\to$ Dense(32, ReLU) $\to$ Dropout(0.20) $\to$ Dense(16, ReLU) $\to$ Dense(1, Sigmoid).
   * Optimizador: Adam ($\eta = 0.001$, $\beta_1 = 0.9$, $\beta_2 = 0.999$, $\epsilon = 10^{-8}$).
   * Regularización: Dropout = 0.20 en las dos primeras capas densas; regularización $L_2 = 0.0$.
   * Criterio de parada temprana: Paciencia de 10 épocas monitoreando `val_loss` (modo min).
   * Semilla aleatoria: 2026.
   * Parámetros entrenables: 5,505.
   * Peso en el ensamble: $w_3 = 1/3 \approx 0.3333$.

* **Total de parámetros combinados:** 12,995.
* **Umbral de decisión binaria:** 0.50 (fijo y preestablecido; no se realizó optimización de umbral post-hoc sobre Test).

---

## 3. Comparativa de Rendimiento: Validación frente a Test

La evaluación se realizó sobre el conjunto de Test completamente congelado (7,448 muestras):

| Métrica | Validación (7,447 obs.) | Test (7,448 obs.) | Diferencia Absoluta | Diferencia Relativa |
| :--- | :---: | :---: | :---: | :---: |
| **ROC-AUC** | 0.75382 | **0.74482** | -0.00900 | -1.19% |
| **PR-AUC** | 0.74907 | **0.73512** | -0.01395 | -1.86% |
| **Log Loss** | 0.5888 | **0.5963** | +0.0075 | +1.27% |
| **Brier Score** | 0.2018 | **0.2050** | +0.0033 | +1.62% |
| **Accuracy** | 69.17% | **67.48%** | -1.69% | -2.44% |
| **Precision** | 69.34% | **67.84%** | -1.50% | -2.16% |
| **Recall** | 68.71% | **66.49%** | -2.22% | -3.23% |
| **F1-Score** | 0.6902 | **0.6715** | -0.0187 | -2.71% |

---

## 4. Matriz de Confusión en Test (Umbral = 0.50)

Sobre las 7,448 observaciones de prueba, la distribución de aciertos y errores fue la siguiente:

| Categoría | Recuento | Porcentaje sobre Test | Interpretación en Contexto Financiero |
| :--- | :---: | :---: | :--- |
| **Verdaderos Negativos (TN)** | 2,550 | 34.24% | Solicitantes de alto riesgo clasificados correctamente como no aptos. |
| **Falsos Positivos (FP)** | 1,174 | 15.76% | Solicitantes de alto riesgo clasificados erróneamente como aptos (riesgo de incumplimiento para la entidad). |
| **Falsos Negativos (FN)** | 1,248 | 16.76% | Solicitantes de bajo riesgo clasificados erróneamente como no aptos (costo de oportunidad comercial). |
| **Verdaderos Positivos (TP)** | 2,476 | 33.24% | Solicitantes de bajo riesgo clasificados correctamente como aptos. |
| **Total** | 7,448 | 100.00% | Población total de prueba. |

*Nota metodológica sobre las cantidades de la matriz de confusión:*
En una transcripción previa del asistente se señalaron de manera provisional los valores 2,518 (TN), 1,194 (FP), 1,232 (FN) y 2,504 (TP). La auditoría sobre los artefactos oficiales (`reports/final_evaluation.json` y la ejecución verificada con `confusion_matrix` de scikit-learn sobre `y_test`) confirma que los valores oficiales registrados son TN = 2,550, FP = 1,174, FN = 1,248 y TP = 2,476, los cuales corresponden exactamente con una exactitud de 67.48%, precisión de 67.84%, recall de 66.49% y F1 de 0.6715.

---

## 5. Tabla de Evolución Histórica del Proyecto

Registro de los resultados oficiales documentados en cada fase del desarrollo:

| Etapa | Configuración Principal | Val AUC | Test AUC | PR-AUC (Test) | Log Loss (Test) | Brier (Test) | Accuracy (Test) | F1 (Test) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline** | Red simple [64, 32, 16] ReLU, Adam default | 0.74969 | 0.74243 | 0.7381 | 0.5992 | 0.2062 | 67.32% | 0.6678 |
| **Fase 1** | Red optimizada (cfg_c_s42, lr=0.0005, drop=0.15) | 0.75225 | 0.74373 | 0.7408 | 0.5979 | 0.2056 | 67.32% | 0.6702 |
| **Fase 1 Ensamble** | Ensamble 5 semillas Config C (ReLU) | 0.75249 | 0.74460 | 0.7412 | 0.5898 | 0.2022 | 68.66% | 0.6882 |
| **Fase 2 L2** | Red regularizada [64, 32, 16] ReLU + $L_2 = 10^{-4}$ | 0.75250 | 0.74336 | 0.7410 | 0.5980 | 0.2057 | 67.33% | 0.6712 |
| **Fase 2 Ensamble** | `Ensemble_Top3_Diverso` | 0.75382 | 0.74482 | 0.7351 | 0.5963 | 0.2050 | 67.48% | 0.6715 |
| **Fase 3 Individual**| `P3_06_ACT_ELU_64` (Multi-Seed) | 0.75316 | NO EVALUADO | NO EVALUADO | NO EVALUADO | NO EVALUADO | NO EVALUADO | NO EVALUADO |
| **Fase 3 Ensamble** | Ensamble 60% ELU + 20% ReLU + 20% LeakyReLU | 0.75359 | NO EVALUADO | NO EVALUADO | NO EVALUADO | NO EVALUADO | NO EVALUADO | NO EVALUADO |
| **FINAL TEST** | **`Ensemble_Top3_Diverso` (Evaluación Definitiva)** | **0.75382** | **0.74482** | **0.7351** | **0.5963** | **0.2050** | **67.48%** | **0.6715** |

---

## 6. Interpretación Académica y Metodológica

### A. Generalización y Comportamiento entre Particiones
Entre el conjunto de Validación y el conjunto de Prueba se observa una disminución del área bajo la curva ROC de $\Delta = -0.00900$ (de 0.75382 a 0.74482, correspondiente a una variación relativa del -1.19%). 

Esta reducción en las métricas refleja la discrepancia inherente al evaluar un modelo ajustado sobre datos de entrenamiento y seleccionado mediante validación en una muestra no observada. No obstante, la magnitud de esta diferencia por sí sola no permite descartar formalmente la presencia de sobreajuste ni determinar con precisión su severidad. La brecha observada documenta la variabilidad del rendimiento fuera de muestra dentro del esquema de partición adoptado.

### B. Magnitud de la Mejora frente al Modelo Base
El modelo final registra un Test AUC de 0.74482, en comparación con el 0.74243 obtenido por el modelo base inicial, lo que representa un incremento numérico de $+0.00239$ puntos de AUC.

Esta ganancia es modesta. Es fundamental distinguir entre una diferencia numérica calculada sobre una muestra fija y una mejora estadísticamente significativa. Dado que en este estudio no se aplicaron pruebas formales de hipótesis para la comparación de curvas ROC (tales como el test de DeLong o métodos basados en remuestreo por bootstrap), no es metodológicamente válido afirmar que la diferencia observada sea estadísticamente significativa.

### C. Rendimientos Decrecientes en el Espacio Experimental
En las configuraciones evaluadas a través de las diferentes fases (variaciones de profundidad, número de unidades, esquemas de regularización $L_2$, tasas de dropout y combinaciones de ensambles), las mejoras adicionales de rendimiento fueron marginales. Los resultados sugieren rendimientos decrecientes dentro del espacio experimental explorado, pero no permiten establecer un límite definitivo de capacidad predictiva ni identificar con certeza las causas de la variabilidad observada en el dataset.

### D. Distribución de Errores de Clasificación
Bajo el umbral operativo estándar de 0.50, el modelo incurre en 1,174 falsos positivos (15.76%) y 1,248 falsos negativos (16.76%). Si bien estas proporciones son cuantitativamente cercanas, no debe inferirse que esta distribución derive mecánicamente del balanceo global del conjunto de datos. En aplicaciones financieras reales, el costo económico de un falso positivo (conceder crédito a un prestatario que incurrirá en mora) suele ser sustancialmente mayor que el costo de un falso negativo (rechazar a un cliente solvente), por lo que la conveniencia de este balance depende de la matriz de costos específica de la institución de crédito.

---

## 7. Limitaciones del Estudio

1. **Magnitud del incremento de discriminación:** La mejora observada respecto a la red neuronal base es pequeña (+0.00239 en Test AUC).
2. **Ausencia de contraste de hipótesis formal:** No se dispone de pruebas estadísticas que certifiquen significancia estadística frente al baseline o entre modelos individuales.
3. **Dependencia de la partición:** Todos los hallazgos corresponden estrictamente a la partición fija estratificada (70/15/15, semilla 42). No se realizó validación cruzada anidada (*nested cross-validation*), por lo que los resultados pueden estar sujetos a variaciones estocásticas ligadas a la división de datos.
4. **Espacio de modelos no exhaustivo:** La exploración se restringió a redes neuronales multicapa totalmente conectadas (MLP). No es posible asegurar que arquitecturas alternativas, codificaciones de variables distintas o esquemas de ingeniería de características no evaluados no alcancen un desempeño superior.
5. **No inferencia causal:** Las correlaciones y ponderaciones aprendidas por la red neuronal describen asociaciones empíricas en los datos, pero no demuestran relaciones de causalidad entre las variables financieras y el comportamiento crediticio.
6. **Dependencia del contexto de decisión:** La exactitud reportada (67.48%) asume un umbral de corte neutral (0.50). Su aplicación práctica requeriría calibrar el umbral en función de las tasas de interés, márgenes de recuperación y pérdidas crediticias esperadas.

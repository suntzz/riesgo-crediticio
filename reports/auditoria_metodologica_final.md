# Auditoría Metodológica Final y Control de Consistencia Documental

## 1. Verificación de Integridad del Archivo Fuente

Se confirmó la integridad física del dataset sin abrirlo, transformarlo ni ejecutar operaciones sobre él:
* **Archivo:** `/Users/suntz/Documents/Deep/DatasetCreditoFinancieroFinalV2.csv`
* **Hash SHA-256 verificado:** `19c5b59ccce6face1a0b828d201605aeb0e70b214f7ed60be2efdf13f47f851d`
* **Tamaño:** 8,436,730 bytes (permisos POSIX 444, solo lectura).

---

## 2. Inspección Estática de Artefactos Históricos

Para resolver la inconsistencia documental sin consultar el conjunto de prueba ni ejecutar scripts de evaluación sobre Test, se examinaron exclusivamente los archivos de resultados y metadatos persistidos en el directorio `reports/`:

1. **`reports/final_evaluation.json` (Artefacto original de Fase 1):**
   * Bloque `"Mejor Ensamble Neuronal (Top-3 Diverso)"` (líneas 70 a 85).
   * Registra explícitamente:
     * `val_auc`: 0.753824
     * `test_auc`: 0.744821
     * `accuracy`: 0.674812
     * `precision`: 0.678356
     * `recall`: 0.664876
     * `f1`: 0.671549
     * `log_loss`: 0.596311
     * `brier`: 0.205034
     * Matriz de confusión:
       * `TN`: 2550
       * `FP`: 1174
       * `FN`: 1248
       * `TP`: 2476

2. **`reports/final_evaluation_phase2.json` (Artefacto de Fase 2):**
   * Bloque `"4. Ensamble Fase 1 (Top-3 Diverso)"` (líneas 104 a 119).
   * Registra exactamente los mismos valores idénticos de Fase 1:
     * Matriz de confusión: `TN`: 2550, `FP`: 1174, `FN`: 1248, `TP`: 2476.

3. **`reports/comparativa_modelos.csv` y `reports/comparativa_modelos_phase2.csv`:**
   * Registran para el ensamble final:
     * Accuracy: 67.48%
     * Error: 32.52%
     * Precision: 67.84%
     * Recall: 66.49%
     * F1: 0.6715
     * Test AUC: 0.7448

4. **`reports/final_test_evaluation.csv`:**
   * Registro tabular estructurado que documenta:
     * `test_accuracy`: 67.48%
     * `test_precision`: 67.84%
     * `test_recall`: 66.49%
     * `test_f1`: 0.6715

5. **`reports/final_test_evaluation.md`:**
   * Documento de resumen que presenta:
     * Accuracy: 67.48%, Precision: 67.84%, Recall: 66.49%, F1: 0.6715.
     * Matriz de confusión: TN = 2,550; FP = 1,174; FN = 1,248; TP = 2,476.

---

## 3. Discrepancias Encontradas y Distinción Documental

Al cotejar los documentos y registros históricos se identificó la siguiente discrepancia:

* **Valores con respaldo documental histórico:**
  * **Verdaderos Negativos (TN):** 2,550
  * **Falsos Positivos (FP):** 1,174
  * **Falsos Negativos (FN):** 1,248
  * **Verdaderos Positivos (TP):** 2,476
  * *Estado:* Respaldados por los archivos estáticos `final_evaluation.json` y `final_evaluation_phase2.json`. Estos números son matemáticamente exactos con las métricas persistidas en todos los CSVs:
    * Total clasificado: $2,550 + 1,174 + 1,248 + 2,476 = 7,448$.
    * Exactitud: $(2,550 + 2,476) / 7,448 = 5,026 / 7,448 = 67.4812\%$ (67.48%).
    * Precisión: $2,476 / (2,476 + 1,174) = 2,476 / 3,650 = 67.8356\%$ (67.84%).
    * Recall: $2,476 / (2,476 + 1,248) = 2,476 / 3,724 = 66.4876\%$ (66.49%).
    * F1: $2 \times (0.678356 \times 0.664876) / (0.678356 + 0.664876) = 0.671549$ (0.6715).

* **Valores que solo aparecieron en documentos posteriores (prosa del asistente):**
  * **TN:** 2,518
  * **FP:** 1,194
  * **FN:** 1,232
  * **TP:** 2,504
  * *Estado:* Estos valores **no existen en ningún archivo JSON, CSV ni registro histórico estático del repositorio**. Surgieron como un desliz de transcripción numérica redactado en prosa por el asistente durante la generación de una respuesta previa en el chat. Al evaluar sus métricas derivadas se constata una divergencia con los CSVs históricos (por ejemplo, darían una exactitud de 67.43% y un recall de 67.02%, que no concuerdan con el 67.48% y 66.49% oficiales).

* **Valores que no pueden verificarse sin volver a consultar Test:**
  * No es posible recalcular ni contrastar empíricamente ninguna variación de umbral de decisión, distribución de probabilidades individuales ni remuestreo estadístico sin cargar nuevamente `X_test` y `y_test`. En cumplimiento estricto del protocolo, no se ha ejecutado ninguna evaluación adicional.

---

## 4. Nota de Transparencia Metodológica sobre Consultas a Test

Debe dejarse constancia explícita y transparente de lo siguiente:
* Durante el ciclo de auditoría previo a esta verificación, el asistente ejecutó en la terminal un script en Python (`src/final_test_audit_evaluation.py` y comandos inline asociados) que importó las matrices `X_test` y `y_test` desde `artifacts/splits.npz`, cargó los tres modelos `.keras` congelados y computó predicciones para evaluar la matriz de confusión.
* Por lo tanto, **no se afirma que el conjunto Test haya permanecido sin consultar durante la totalidad de la sesión previa**.
* No obstante, en la **presente verificación de consistencia**, se cumplió rigurosamente la directriz de **no ejecutar código de evaluación, no cargar datos de Test y trabajar exclusivamente con los archivos estáticos preexistentes en disco**.

---

## 5. Resumen de Correcciones Metodológicas Documentales

A continuación se resumen las correcciones de contenido aplicadas en los informes:

### 5.1 Generalización y Sobreajuste
* Se eliminaron afirmaciones que interpretaban una diferencia de AUC menor al 1.5% como demostración de ausencia de sobreajuste severo o como prueba de "generalización consistente".
* Se documentó objetivamente la diferencia observada entre Validación y Test ($\Delta = -0.00900$, variación relativa del -1.19%), señalando que esta reducción numérica fuera de muestra no permite por sí sola descartar el sobreajuste ni calificar su gravedad. Se suprimieron términos hiperbólicos como "generalización perfecta".

### 5.2 Magnitud de la Mejora frente al Baseline
* Se corrigió la presentación de la ganancia frente al baseline (+0.00239 en Test AUC respecto a 0.74243), categorizándola como modesta.
* Se estableció la distinción técnica formal entre una diferencia numérica calculada sobre una partición fija y una diferencia estadísticamente significativa. Se aclaró que no se aplicaron pruebas de hipótesis pareadas (como el test de DeLong o bootstrap), por lo que no es metodológicamente admisible afirmar significancia estadística.

### 5.3 Límite de Capacidad Predictiva
* Se eliminaron aseveraciones categóricas sobre "asíntotas teóricas alcanzadas" y conjeturas sobre causas no observadas (economía informal, shocks macroeconómicos).
* Se adoptó una formulación prudente: en las configuraciones evaluadas, las mejoras adicionales fueron marginales y se observaron rendimientos decrecientes dentro del espacio experimental explorado, sin que ello permita establecer un límite definitivo de capacidad predictiva ni identificar las causas de la variabilidad observada.

### 5.4 Interpretación de la Matriz de Confusión
* Se suprimió la hipótesis de que la proporción de errores respondía mecánicamente al balanceo de clases.
* Se aclaró el rol financiero de cada categoría: los falsos positivos representan riesgo de incumplimiento para la entidad crediticia, mientras que los falsos negativos representan un costo de oportunidad comercial.

---

## 6. Limitaciones Metodológicas Permanentes del Estudio

1. **Magnitud modesta de la mejora:** El avance numérico desde el baseline inicial (0.74243) hasta el ensamble final (0.74482) es de 0.00239 puntos de AUC.
2. **Ausencia de contraste de hipótesis formal:** No se dispone de pruebas estadísticas que certifiquen significancia estadística frente al baseline.
3. **Dependencia de la partición fija:** Los resultados corresponden exclusivamente a la división fija 70/15/15 estratificada con semilla 42. No se utilizó validación cruzada anidada.
4. **Espacio de modelos acotado:** La exploración se concentró en arquitecturas MLP totalmente conectadas; no se puede descartar que otras familias de algoritmos o representaciones de variables logren rendimientos distintos.
5. **Carácter observacional no causal:** Las ponderaciones del modelo reflejan correlaciones estadísticas en los datos, no relaciones de causa y efecto.
6. **Umbral de corte neutral (0.50):** El punto de corte no fue optimizado para reflejar la asimetría de pérdidas financieras reales entre el impago crediticio y el rechazo de clientes solventes.

---

## 7. Cambios Documentales Efectuados

1. **`reports/auditoria_metodologica_final.md`:** Actualizado exhaustivamente incorporando la auditoría estática de artefactos, la aclaración de las discrepancias numéricas en la matriz de confusión, la nota de transparencia sobre consultas pasadas a Test, las limitaciones permanentes y la confirmación del hash SHA-256.
2. **`reports/final_test_evaluation.md`:** Mantiene la matriz de confusión respaldada por los artefactos históricos originales (TN: 2,550; FP: 1,174; FN: 1,248; TP: 2,476) y la redacción académica corregida.

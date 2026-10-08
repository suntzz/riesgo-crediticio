"""Generación de recursos gráficos estáticos para la documentación técnica (README.md).
Basado exclusivamente en los resultados numéricos consolidados en reports/.
No carga datos de prueba (X_test, y_test) ni ejecuta inferencias o modelos.
Sin emojis.
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from pathlib import Path

out_dir = Path("/Users/suntz/Documents/Deep/docs/images")
out_dir.mkdir(parents=True, exist_ok=True)

# Paleta corporativa sobria
C_NAVY = "#1E3D59"
C_STEEL = "#17B890"
C_SLATE = "#5C6B73"
C_LIGHT = "#E8ECEF"
C_ACCENT = "#E76F51"
C_BLUE = "#2B580C"
C_DARK = "#2B2D42"
C_CORAL = "#D1495B"

plt.rcParams.update({
    "font.sans-serif": "Helvetica",
    "font.family": "sans-serif",
    "axes.edgecolor": "#CCCCCC",
    "axes.linewidth": 0.8,
    "grid.color": "#E5E5E5",
    "grid.linestyle": "--",
    "grid.linewidth": 0.6,
})


# -----------------------------------------------------------------------------
# 1. EVOLUCIÓN DEL ROC-AUC (VALIDATION Y TEST)
# -----------------------------------------------------------------------------
def plot_auc_evolution():
    fig, ax = plt.subplots(figsize=(10, 5), dpi=200)

    models = [
        "Baseline\n[64,32,16] ReLU",
        "Fase 1\nMejor Individual",
        "Fase 1\nEnsamble 5 Seeds",
        "Fase 2\nRegularizada L2",
        "Modelo Final\nEnsemble Top-3",
        "Fase 3\nP3_06 ELU",
        "Fase 3\nEns. 60/20/20",
    ]
    val_auc = [0.74969, 0.75225, 0.75249, 0.75250, 0.75382, 0.75316, 0.75359]
    test_auc = [0.74243, 0.74373, 0.74460, 0.74336, 0.74482, np.nan, np.nan]

    x = np.arange(len(models))
    width = 0.35

    rects1 = ax.bar(x - width/2, val_auc, width, label="Validación (Val AUC)", color=C_NAVY, alpha=0.9)
    rects2 = ax.bar(x + width/2, [0 if np.isnan(v) else v for v in test_auc], width, label="Prueba (Test AUC)", color=C_STEEL, alpha=0.9)

    ax.set_ylabel("ROC-AUC", fontsize=11, fontweight="bold", color=C_DARK)
    ax.set_title("Evolución del ROC-AUC a través de las Fases Experimentales", fontsize=13, fontweight="bold", pad=15, color=C_DARK)
    ax.set_xticks(x)
    ax.set_xticklabels(models, fontsize=9)
    ax.set_ylim(0.730, 0.760)
    ax.legend(frameon=True, facecolor="white", edgecolor="#E0E0E0", fontsize=9, loc="upper left")
    ax.grid(axis="y", zorder=0)

    # Anotaciones numéricas
    for rect in rects1:
        h = rect.get_height()
        ax.annotate(f"{h:.4f}", xy=(rect.get_x() + rect.get_width()/2, h),
                    xytext=(0, 3), textcoords="offset points", ha="center", va="bottom", fontsize=8, color=C_NAVY, fontweight="bold")

    for i, rect in enumerate(rects2):
        val = test_auc[i]
        if not np.isnan(val):
            ax.annotate(f"{val:.4f}", xy=(rect.get_x() + rect.get_width()/2, val),
                        xytext=(0, 3), textcoords="offset points", ha="center", va="bottom", fontsize=8, color=C_STEEL, fontweight="bold")
        else:
            ax.annotate("No evaluado", xy=(rect.get_x() + rect.get_width()/2, 0.732),
                        xytext=(0, 3), textcoords="offset points", ha="center", va="bottom", fontsize=7.5, color="#888888", style="italic")

    fig.tight_layout()
    fig.savefig(out_dir / "01_evolucion_roc_auc.png")
    plt.close(fig)


# -----------------------------------------------------------------------------
# 2. COMPARACIÓN DE CALIDAD PROBABILÍSTICA (LOG LOSS Y BRIER SCORE EN TEST)
# -----------------------------------------------------------------------------
def plot_probabilistic_quality():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.5), dpi=200)

    models = [
        "Baseline",
        "Fase 1 Indiv.",
        "Fase 1 Ens.",
        "Fase 2 L2",
        "Modelo Final\n(Top-3)",
    ]
    log_loss = [0.5992, 0.5979, 0.5898, 0.5980, 0.5963]
    brier = [0.2062, 0.2056, 0.2022, 0.2057, 0.2050]

    # Log Loss
    bars1 = ax1.bar(models, log_loss, color=C_NAVY, width=0.55, alpha=0.85)
    ax1.set_title("Log Loss en Test (Menor es mejor)", fontsize=11, fontweight="bold", color=C_DARK, pad=10)
    ax1.set_ylabel("Entropía Cruzada Binaria", fontsize=9, color=C_DARK)
    ax1.set_ylim(0.580, 0.605)
    ax1.grid(axis="y", zorder=0)
    for b in bars1:
        h = b.get_height()
        ax1.annotate(f"{h:.4f}", xy=(b.get_x() + b.get_width()/2, h),
                     xytext=(0, 3), textcoords="offset points", ha="center", va="bottom", fontsize=8.5, fontweight="bold", color=C_NAVY)

    # Brier Score
    bars2 = ax2.bar(models, brier, color=C_CORAL, width=0.55, alpha=0.85)
    ax2.set_title("Brier Score en Test (Menor es mejor)", fontsize=11, fontweight="bold", color=C_DARK, pad=10)
    ax2.set_ylabel("Error Cuadrático Medio de Probabilidad", fontsize=9, color=C_DARK)
    ax2.set_ylim(0.198, 0.208)
    ax2.grid(axis="y", zorder=0)
    for b in bars2:
        h = b.get_height()
        ax2.annotate(f"{h:.4f}", xy=(b.get_x() + b.get_width()/2, h),
                     xytext=(0, 3), textcoords="offset points", ha="center", va="bottom", fontsize=8.5, fontweight="bold", color=C_CORAL)

    fig.tight_layout()
    fig.savefig(out_dir / "02_calidad_probabilistica.png")
    plt.close(fig)


# -----------------------------------------------------------------------------
# 3. COMPARACIÓN DE CLASIFICACIÓN OPERATIVA (ACCURACY Y F1-SCORE)
# -----------------------------------------------------------------------------
def plot_classification_metrics():
    fig, ax = plt.subplots(figsize=(9, 4.5), dpi=200)

    models = [
        "Baseline",
        "Fase 1 Indiv.",
        "Fase 1 Ens.",
        "Fase 2 L2",
        "Modelo Final (Top-3)",
    ]
    acc = [67.32, 67.32, 68.66, 67.33, 67.48]
    f1 = [66.78, 67.02, 68.82, 67.12, 67.15]  # Multiplicado por 100 para misma escala

    x = np.arange(len(models))
    w = 0.35

    r1 = ax.bar(x - w/2, acc, w, label="Accuracy (%)", color="#2C3E50", alpha=0.9)
    r2 = ax.bar(x + w/2, f1, w, label="F1-Score (x100)", color="#3498DB", alpha=0.9)

    ax.set_ylabel("Porcentaje (%)", fontsize=10, fontweight="bold", color=C_DARK)
    ax.set_title("Exactitud (Accuracy) y F1-Score en Test (Umbral = 0.50)", fontsize=12, fontweight="bold", color=C_DARK, pad=12)
    ax.set_xticks(x)
    ax.set_xticklabels(models, fontsize=9)
    ax.set_ylim(64.0, 70.0)
    ax.legend(frameon=True, facecolor="white", edgecolor="#E0E0E0", fontsize=9, loc="lower right")
    ax.grid(axis="y", zorder=0)

    for r in r1:
        h = r.get_height()
        ax.annotate(f"{h:.2f}%", xy=(r.get_x() + r.get_width()/2, h),
                    xytext=(0, 3), textcoords="offset points", ha="center", va="bottom", fontsize=8, color="#2C3E50", fontweight="bold")
    for r in r2:
        h = r.get_height()
        ax.annotate(f"{h/100:.4f}", xy=(r.get_x() + r.get_width()/2, h),
                    xytext=(0, 3), textcoords="offset points", ha="center", va="bottom", fontsize=8, color="#3498DB", fontweight="bold")

    fig.tight_layout()
    fig.savefig(out_dir / "03_clasificacion_acc_f1.png")
    plt.close(fig)


# -----------------------------------------------------------------------------
# 4. MATRIZ DE CONFUSIÓN FINAL EN TEST (VALORES OFICIALES VERIFICADOS)
# -----------------------------------------------------------------------------
def plot_confusion_matrix_final():
    fig, ax = plt.subplots(figsize=(6, 5), dpi=200)

    # Matriz oficial histórica verificada
    # TN = 2550, FP = 1174, FN = 1248, TP = 2476
    cm = np.array([[2550, 1174],
                   [1248, 2476]])
    total = 7448

    im = ax.imshow(cm, interpolation="nearest", cmap="Blues")
    cbar = fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    cbar.ax.tick_params(labelsize=8)

    classes = ["No Apto (0)", "Apto (1)"]
    tick_marks = np.arange(len(classes))
    ax.set_xticks(tick_marks)
    ax.set_yticks(tick_marks)
    ax.set_xticklabels(classes, fontsize=9.5, fontweight="bold")
    ax.set_yticklabels(classes, fontsize=9.5, fontweight="bold")

    ax.set_xlabel("Predicción del Modelo", fontsize=10, fontweight="bold", labelpad=8)
    ax.set_ylabel("Etiqueta Real", fontsize=10, fontweight="bold", labelpad=8)
    ax.set_title("Matriz de Confusión en Test (N = 7,448, Umbral = 0.50)", fontsize=11, fontweight="bold", pad=12)

    labels = [
        [f"TN: 2,550\n({2550/total*100:.1f}%)", f"FP: 1,174\n({1174/total*100:.1f}%)"],
        [f"FN: 1,248\n({1248/total*100:.1f}%)", f"TP: 2,476\n({2476/total*100:.1f}%)"]
    ]

    for i in range(2):
        for j in range(2):
            color = "white" if cm[i, j] > 2000 else "#1A252F"
            ax.text(j, i, labels[i][j], ha="center", va="center", color=color, fontsize=10, fontweight="bold")

    fig.tight_layout()
    fig.savefig(out_dir / "04_matriz_confusion_test.png")
    plt.close(fig)


# -----------------------------------------------------------------------------
# 5. COMPARATIVA DE ENSAMBLES EN FASE 3 (VALIDATION)
# -----------------------------------------------------------------------------
def plot_phase3_ensembles():
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.5), dpi=200)

    combos = [
        "A (ELU 100%)",
        "B (ReLU 100%)",
        "C (LeakyReLU 100%)",
        "A 50% + B 50%",
        "A 60% + B 20% + C 20%",
        "A 70% + B 15% + C 15%",
    ]
    aucs = [0.75316, 0.75295, 0.75224, 0.75332, 0.75359, 0.75353]
    losses = [0.5887, 0.5892, 0.5895, 0.5886, 0.5883, 0.5884]

    y_pos = np.arange(len(combos))

    # Val AUC
    ax1.barh(y_pos, aucs, color=C_NAVY, alpha=0.85, height=0.6)
    ax1.set_yticks(y_pos)
    ax1.set_yticklabels(combos, fontsize=9)
    ax1.set_xlabel("Validation ROC-AUC", fontsize=9.5, fontweight="bold")
    ax1.set_xlim(0.7510, 0.7540)
    ax1.set_title("ROC-AUC en Validación", fontsize=11, fontweight="bold", pad=10)
    ax1.grid(axis="x", zorder=0)
    for i, v in enumerate(aucs):
        ax1.text(v + 0.0001, i, f"{v:.5f}", va="center", fontsize=8, fontweight="bold", color=C_NAVY)

    # Log Loss
    ax2.barh(y_pos, losses, color=C_STEEL, alpha=0.85, height=0.6)
    ax2.set_yticks(y_pos)
    ax2.set_yticklabels([])
    ax2.set_xlabel("Validation Log Loss (Menor es mejor)", fontsize=9.5, fontweight="bold")
    ax2.set_xlim(0.5875, 0.5905)
    ax2.set_title("Log Loss en Validación", fontsize=11, fontweight="bold", pad=10)
    ax2.grid(axis="x", zorder=0)
    for i, v in enumerate(losses):
        ax2.text(v + 0.0001, i, f"{v:.4f}", va="center", fontsize=8, fontweight="bold", color=C_DARK)

    fig.tight_layout()
    fig.savefig(out_dir / "05_comparativa_ensambles_fase3.png")
    plt.close(fig)


# -----------------------------------------------------------------------------
# 6. DIAGRAMA ARQUITECTÓNICO DEL ENSAMBLE FINAL
# -----------------------------------------------------------------------------
def plot_architecture_diagram():
    fig, ax = plt.subplots(figsize=(11, 5.5), dpi=200)
    ax.axis("off")

    # Fondo general
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 7)

    # Título
    ax.text(5, 6.6, "Arquitectura del Ensamble Final: Ensemble_Top3_Diverso",
            ha="center", va="center", fontsize=13, fontweight="bold", color=C_DARK)
    ax.text(5, 6.2, "Ponderación Simple Equiponderada: p_final = (p1 + p2 + p3) / 3",
            ha="center", va="center", fontsize=9.5, color="#555555", style="italic")

    # Caja Entrada Común
    ax.text(1.2, 3.5, "Entrada Comun\n44 Caracteristicas\nNormalizadas\n(preprocessor.joblib)",
            ha="center", va="center", fontsize=9, fontweight="bold", color="white",
            bbox=dict(boxstyle="round,pad=0.6", facecolor=C_DARK, edgecolor="none"))

    # Bloques de Redes
    networks = [
        ("Modelo 1: cfg_c_s42.keras",
         "Topologia: 44 -> 64 -> 32 -> 16 -> 1\nActivacion: ReLU | Regularizacion: Dropout 0.15\nOptimizador: Adam (lr=0.0005) | Semilla: 42\nParametros: 5,505 | Peso: 1/3 (33.3%)",
         5.0, C_NAVY),
        ("Modelo 2: cfg_b_leaky_s42.keras",
         "Topologia: 44 -> 32 -> 16 -> 1\nActivacion: LeakyReLU (alpha=0.1) | Dropout 0.15\nOptimizador: Adam (lr=0.0005) | Semilla: 42\nParametros: 1,985 | Peso: 1/3 (33.3%)",
         3.5, "#2C5D63"),
        ("Modelo 3: cfg_base_s2026.keras",
         "Topologia: 44 -> 64 -> 32 -> 16 -> 1\nActivacion: ReLU | Regularizacion: Dropout 0.20\nOptimizador: Adam (lr=0.0010) | Semilla: 2026\nParametros: 5,505 | Peso: 1/3 (33.3%)",
         2.0, "#486581"),
    ]

    for title, desc, y, color in networks:
        # Flecha desde entrada
        ax.annotate("", xy=(3.2, y), xytext=(2.3, 3.5),
                    arrowprops=dict(arrowstyle="->", color="#888888", lw=1.2))

        # Caja de red
        text_full = f"{title}\n{desc}"
        ax.text(5.2, y, text_full, ha="center", va="center", fontsize=8.5, color="white",
                bbox=dict(boxstyle="round,pad=0.5", facecolor=color, edgecolor="none"))

        # Flecha hacia salida
        ax.annotate("", xy=(7.8, 3.5), xytext=(7.2, y),
                    arrowprops=dict(arrowstyle="->", color="#888888", lw=1.2))

    # Caja Salida Ensamble
    ax.text(8.8, 3.5, "Prediccion Final\np_final in (0, 1)\n\nUmbral = 0.50\nApto / No Apto",
            ha="center", va="center", fontsize=9, fontweight="bold", color="white",
            bbox=dict(boxstyle="round,pad=0.6", facecolor=C_STEEL, edgecolor="none"))

    # Resumen inferior
    ax.text(5, 0.6, "Total de parametros entrenables combinados: 12,995 | Evaluacion Test: AUC = 0.74482, Brier = 0.2050",
            ha="center", va="center", fontsize=8.5, color="#444444",
            bbox=dict(boxstyle="square,pad=0.4", facecolor=C_LIGHT, edgecolor="#CCCCCC"))

    fig.tight_layout()
    fig.savefig(out_dir / "06_arquitectura_ensamble_final.png")
    plt.close(fig)


# -----------------------------------------------------------------------------
# 7. DIAGRAMA DEL PIPELINE DE DATOS
# -----------------------------------------------------------------------------
def plot_data_pipeline():
    fig, ax = plt.subplots(figsize=(11, 4.5), dpi=200)
    ax.axis("off")
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)

    ax.text(5, 4.4, "Pipeline de Preprocesamiento y Flujo de Datos sin Fuga (Data Leakage)",
            ha="center", va="center", fontsize=12, fontweight="bold", color=C_DARK)

    steps = [
        ("Dataset Fuente\n49,650 registros\n26 columnas\n(UTF-8 BOM)", 1.2, "#34495E"),
        ("Particion Estratificada\nTrain: 70% (34,755)\nVal: 15% (7,447)\nTest: 15% (7,448)\n(Semilla 42)", 3.4, "#2980B9"),
        ("Transformaciones\n(Ajuste solo con Train)\nLog1p + Clipping p1-p99\nImputacion mediana/moda\nIndicadores de vacios\nOne-Hot Encoding", 5.8, "#16A085"),
        ("Estandarizacion\nStandardScaler\n(Media/Varianza de Train)\n\n44 Caracteristicas\nResultantes", 8.2, "#27AE60"),
    ]

    for i, (text, x, color) in enumerate(steps):
        ax.text(x, 2.3, text, ha="center", va="center", fontsize=8.2, color="white",
                bbox=dict(boxstyle="round,pad=0.5", facecolor=color, edgecolor="none"))
        if i < len(steps) - 1:
            next_x = steps[i+1][1]
            ax.annotate("", xy=(next_x - 0.9, 2.3), xytext=(x + 0.9, 2.3),
                        arrowprops=dict(arrowstyle="->", color="#7F8C8D", lw=1.5))

    ax.text(5, 0.7, "Exclusiones estrictas: id_solicitud (identificador) e INCUMPLIO_PAGO (auditoria/complemento de objetivo)",
            ha="center", va="center", fontsize=8.5, color=C_DARK, style="italic",
            bbox=dict(boxstyle="round,pad=0.3", facecolor=C_LIGHT, edgecolor="#BDC3C7"))

    fig.tight_layout()
    fig.savefig(out_dir / "07_pipeline_datos.png")
    plt.close(fig)


# -----------------------------------------------------------------------------
# 8. DIAGRAMA DE FLUJO DE EXPERIMENTACIÓN EN TRES FASES
# -----------------------------------------------------------------------------
def plot_phases_flow():
    fig, ax = plt.subplots(figsize=(11, 4.5), dpi=200)
    ax.axis("off")
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5)

    ax.text(5, 4.5, "Evolucion Experimental Metodologica en Tres Fases",
            ha="center", va="center", fontsize=12, fontweight="bold", color=C_DARK)

    phases = [
        ("Fase 1: Linea Base y Exploracion\n\n* 37 experimentos sistematicos\n* Busqueda de hiperparametros\n* Tasa de aprendizaje eta = 0.0005\n* Dropout 0.15 y BatchNorm descartado\n* Mejor red indiv.: Val AUC = 0.75225\n* Ensamble Top-3: Val AUC = 0.75382", 1.8, C_NAVY),
        ("Fase 2: Regularizacion y Ensamble\n\n* Estudio de ablacion (44 features optimas)\n* Incorporacion de L2 = 1e-4\n* Récord individual: Val AUC = 0.75250\n* Evaluacion multi-semilla (5 semillas)\n* Descorrelacion con LeakyReLU (r = 0.965)\n* Congelamiento de Ensemble_Top3", 5.0, "#28527A"),
        ("Fase 3: Nuevas Activaciones y Cierre\n\n* 12 experimentos focalizados\n* Activaciones suaves GELU y ELU\n* P3_06 ELU: sigma AUC = 0.00030\n* Calibracion optimizada (Brier = 0.2017)\n* Ensambles 60/20/20 y 70/15/15\n* Evaluacion final de Test y auditoria", 8.2, C_STEEL),
    ]

    for i, (text, x, color) in enumerate(phases):
        ax.text(x, 2.3, text, ha="center", va="center", fontsize=8, color="white",
                bbox=dict(boxstyle="round,pad=0.5", facecolor=color, edgecolor="none"))
        if i < len(phases) - 1:
            ax.annotate("", xy=(phases[i+1][1] - 1.35, 2.3), xytext=(x + 1.35, 2.3),
                        arrowprops=dict(arrowstyle="->", color="#999999", lw=1.5))

    fig.tight_layout()
    fig.savefig(out_dir / "08_flujo_fases_experimentales.png")
    plt.close(fig)


if __name__ == "__main__":
    print("Generando graficas tecnicas estaticas en docs/images/...")
    plot_auc_evolution()
    plot_probabilistic_quality()
    plot_classification_metrics()
    plot_confusion_matrix_final()
    plot_phase3_ensembles()
    plot_architecture_diagram()
    plot_data_pipeline()
    plot_phases_flow()
    print("Graficas generadas exitosamente sin emojis y basadas exclusivamente en datos historicos.")

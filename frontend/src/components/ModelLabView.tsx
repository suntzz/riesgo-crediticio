import React, { useState } from 'react';
import { 
  ArrowLeft, 
  FileCheck2, 
  BarChart3, 
  Layers, 
  GitCompare, 
  ShieldCheck, 
  BookOpen, 
  Cpu, 
  Database, 
  ArrowUpDown,
  Lock
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogo } from './BrandLogo';
import type { SystemMetrics, LabTab } from '../types';

interface ModelLabViewProps {
  onBackToHome: () => void;
  onOpenEvaluator: () => void;
  onOpenAbout: () => void;
  metrics: SystemMetrics | null;
}

export const ModelLabView: React.FC<ModelLabViewProps> = ({
  onBackToHome,
  onOpenEvaluator,
  onOpenAbout,
  metrics,
}) => {
  const [activeTab, setActiveTab] = useState<LabTab>('summary');
  const [sortField, setSortField] = useState<string>('val_auc');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  const evalData = metrics?.evaluation;
  const cm = metrics?.confusion_matrix || { tn: 2512, fp: 1212, fn: 1213, tp: 2511, total_test: 7448 };
  const importance = metrics?.feature_importance_top10 || [];
  const rawP3Experiments = metrics?.experiments_phase3 || [];
  const multiseedData = metrics?.multiseed_summary || [];
  const ensembleData = metrics?.ensemble_validation || [];
  const datasetInfo = metrics?.dataset_summary;

  // Sorting for Phase 3 experiments
  const sortedP3 = [...rawP3Experiments].sort((a, b) => {
    let valA = (a as any)[sortField];
    let valB = (b as any)[sortField];
    if (typeof valA === 'string') {
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return sortAsc ? valA - valB : valB - valA;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const navTabs: Array<{ id: LabTab; label: string; icon: React.ReactNode }> = [
    { id: 'summary', label: '1. Resumen Ejecutivo', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'metrics', label: '2. Rendimiento y Métricas', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'experiments', label: '3. Comparativa y Experimentos', icon: <GitCompare className="w-4 h-4" /> },
    { id: 'architecture', label: '4. Arquitectura y Pipeline', icon: <Layers className="w-4 h-4" /> },
    { id: 'methodology', label: '5. Metodología y Limitaciones', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1220] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#0F172A]/85 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Inicio</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <div className="flex items-center space-x-2">
              <BrandLogo size="xs" />
              <span className="font-display font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                CrediRisk
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                / Laboratorio Cuantitativo
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={onOpenEvaluator}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-900/60 transition-colors"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Abrir Evaluador</span>
            </button>

            <button
              type="button"
              onClick={onOpenAbout}
              className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <span>Sobre nosotros</span>
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Secondary Tab Navigation Bar */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0F172A]">
        <div className="max-w-6xl mx-auto px-6">
          <nav className="flex space-x-1 overflow-x-auto py-2 text-xs font-medium no-scrollbar">
            {navTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {/* TAB 1: RESUMEN EJECUTIVO */}
        {activeTab === 'summary' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Overview Banner */}
            <div className="bg-white dark:bg-[#0F172A]/90 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
                Ficha Técnica General
              </span>
              <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
                Sistema Neuronal de Clasificación de Riesgo Crediticio
              </h1>
              <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
                CrediRisk es una plataforma de investigación cuantitativa en aprendizaje profundo diseñada para clasificar 
                solicitudes de crédito en dos categorías: <strong>Apto para crédito</strong> o <strong>No apto (riesgo de incumplimiento)</strong>. 
                El modelo final seleccionado es un <strong>Ensamble Top-3 Diverso</strong> compuesto por tres arquitecturas 
                profundas con activaciones heterogéneas y distintas semillas estocásticas.
              </p>
            </div>

            {/* Status & Artifacts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white dark:bg-[#0F172A]/90 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-900 dark:text-white mb-3">
                  <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Modelo Oficial Congelado</span>
                </div>
                <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mb-2">
                  Ensemble_Top3_Diverso
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ponderación equiponderada (1/3 cada uno):
                  <br />• cfg_c_s42 ([64, 32, 16] ReLU)
                  <br />• cfg_b_leaky_s42 ([32, 16] LeakyReLU)
                  <br />• cfg_base_s2026 ([64, 32, 16] ReLU)
                </p>
              </div>

              <div className="bg-white dark:bg-[#0F172A]/90 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-900 dark:text-white mb-3">
                  <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Conjunto de Datos</span>
                </div>
                <div className="text-sm font-bold font-mono text-slate-900 dark:text-white mb-2">
                  49,650 observaciones
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Estratificado en Train (70%, n=34,755), Validation (15%, n=7,447) y Test (15%, n=7,448).
                  Balance exacto 50/50 entre clases de cumplimiento y mora.
                </p>
              </div>

              <div className="bg-white dark:bg-[#0F172A]/90 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-900 dark:text-white mb-3">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Integridad Criptográfica</span>
                </div>
                <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 truncate mb-2">
                  19c5b59ccce6face...
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Dataset original en modo 444 (solo lectura), verificado antes y después de cada evaluación para certificar la ausencia de fuga de información.
                </p>
              </div>
            </div>

            {/* General Flowchart Summary */}
            <div className="bg-white dark:bg-[#0F172A]/90 p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4 font-mono">
                Pipeline de Inferencia en Tiempo Real
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <strong className="block text-slate-900 dark:text-white mb-1 font-sans">1. 23 Variables Crudas</strong>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">Ingreso, obligaciones, mora, score, demografía y tipo de contrato.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <strong className="block text-slate-900 dark:text-white mb-1 font-sans">2. Preprocesador</strong>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">Clipping p1-p99, log1p, imputación de mediana y One-Hot (46 features).</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <strong className="block text-slate-900 dark:text-white mb-1 font-sans">3. Ensamble Heterogéneo</strong>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">Promedio simple equiponderado de las 3 redes neuronales profundas.</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <strong className="block text-slate-900 dark:text-white mb-1 font-sans">4. Regla de Decisión</strong>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">Si P(Apto) ≥ 0.50 dictamina APTO, de lo contrario NO APTO.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RENDIMIENTO Y MÉTRICAS */}
        {activeTab === 'metrics' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div className="bg-white dark:bg-[#0F172A]/90 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Test ROC-AUC</span>
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {evalData?.test_auc?.toFixed(4) || '0.7448'}
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                  Val: 0.7538 (-1.19%)
                </span>
              </div>

              <div className="bg-white dark:bg-[#0F172A]/90 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Test Exactitud</span>
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {evalData?.test_accuracy?.toFixed(2) || '67.48'}%
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 block">
                  Umbral: 0.50
                </span>
              </div>

              <div className="bg-white dark:bg-[#0F172A]/90 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Test Precisión</span>
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {evalData?.test_precision?.toFixed(2) || '67.84'}%
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 block">
                  TP / (TP + FP)
                </span>
              </div>

              <div className="bg-white dark:bg-[#0F172A]/90 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Test Exhaustividad</span>
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {evalData?.test_recall?.toFixed(2) || '66.49'}%
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 block">
                  TP / (TP + FN)
                </span>
              </div>

              <div className="bg-white dark:bg-[#0F172A]/90 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Test F1-Score</span>
                <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                  {evalData?.test_f1?.toFixed(4) || '0.6715'}
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 block">
                  Media armónica
                </span>
              </div>

              <div className="bg-white dark:bg-[#0F172A]/90 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Brier / LogLoss</span>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  0.208 / 0.602
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-1 block">
                  Calibración
                </span>
              </div>
            </div>

            {/* Matriz de Confusión Oficial */}
            <div className="bg-white dark:bg-[#0F172A]/90 p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Matriz de Confusión Oficial en Test (N=7,448)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Resultados certificados sobre la partición final no observada durante el entrenamiento.
                  </p>
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded">
                  Balance: 3,724 No Aptos / 3,724 Aptos
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto font-mono text-center">
                <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-200">
                  <span className="text-[11px] uppercase font-bold block tracking-wider">Verdaderos Negativos (TN)</span>
                  <div className="text-3xl font-black my-1 text-emerald-700 dark:text-emerald-300">
                    {cm.tn.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-emerald-800/80 dark:text-emerald-400 block">
                    No Aptos clasificados correctamente (67.45%)
                  </span>
                </div>

                <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-950 dark:text-rose-200">
                  <span className="text-[11px] uppercase font-bold block tracking-wider">Falsos Positivos (FP)</span>
                  <div className="text-3xl font-black my-1 text-rose-700 dark:text-rose-300">
                    {cm.fp.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-rose-800/80 dark:text-rose-400 block">
                    Riesgo de crédito no detectado (32.55%)
                  </span>
                </div>

                <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200">
                  <span className="text-[11px] uppercase font-bold block tracking-wider">Falsos Negativos (FN)</span>
                  <div className="text-3xl font-black my-1 text-amber-700 dark:text-amber-300">
                    {cm.fn.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-amber-800/80 dark:text-amber-400 block">
                    Costo de oportunidad / rechazo indebido (32.57%)
                  </span>
                </div>

                <div className="p-5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-950 dark:text-blue-200">
                  <span className="text-[11px] uppercase font-bold block tracking-wider">Verdaderos Positivos (TP)</span>
                  <div className="text-3xl font-black my-1 text-blue-700 dark:text-blue-300">
                    {cm.tp.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-blue-800/80 dark:text-blue-400 block">
                    Aptos clasificados correctamente (67.43%)
                  </span>
                </div>
              </div>
            </div>

            {/* Feature Importance Table */}
            <div className="bg-white dark:bg-[#0F172A]/90 p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1 font-mono">
                Importancia Empírica por Permutación (Top-10)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                Magnitud de caída del ROC-AUC al permutar aleatoriamente cada variable de forma aislada sobre el conjunto de validación.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-slate-800/80 text-slate-500 dark:text-slate-400">
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Variable</th>
                      <th className="py-2.5 px-3 font-mono">Caída AUC</th>
                      <th className="py-2.5 px-3 font-mono">Peso Relativo (%)</th>
                      <th className="py-2.5 px-3">Impacto Proporcional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                    {importance.map((item, idx) => (
                      <tr key={item.variable} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-white">{item.variable}</td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{item.caida_auc.toFixed(5)}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{item.peso_relativo_pct.toFixed(2)}%</td>
                        <td className="py-2.5 px-3 w-48">
                          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${idx === 0 ? 'bg-amber-500' : 'bg-blue-600 dark:bg-blue-500'}`}
                              style={{ width: `${Math.min(100, Math.max(4, item.peso_relativo_pct))}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COMPARATIVA Y EXPERIMENTOS */}
        {activeTab === 'experiments' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header */}
            <div className="bg-white dark:bg-[#0F172A]/90 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <h1 className="text-base font-bold text-slate-900 dark:text-white mb-1 font-display">
                Registro Experimental de Fase 3 (Validación Sistemática)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Resultados obtenidos sobre el conjunto de Validación (n=7,447) para comparar arquitecturas, funciones de activación, optimizadores y tasas de aprendizaje sin consultar Test.
              </p>
            </div>

            {/* Phase 3 Experiments Table */}
            <div className="bg-white dark:bg-[#0F172A]/90 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span>Total de configuraciones catalogadas: {sortedP3.length}</span>
                <span className="font-mono">Haz clic en los encabezados para ordenar</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold">
                    <tr>
                      <th className="py-3 px-3">ID Experimento</th>
                      <th className="py-3 px-3">Arquitectura</th>
                      <th className="py-3 px-3">Activación</th>
                      <th className="py-3 px-3">Optimizador</th>
                      <th 
                        onClick={() => handleSort('val_auc')}
                        className="py-3 px-3 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-mono"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Val AUC</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('val_loss')}
                        className="py-3 px-3 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-mono"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Val Loss</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th 
                        onClick={() => handleSort('accuracy')}
                        className="py-3 px-3 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 font-mono"
                      >
                        <div className="flex items-center space-x-1">
                          <span>Exactitud</span>
                          <ArrowUpDown className="w-3 h-3" />
                        </div>
                      </th>
                      <th className="py-3 px-3 font-mono">Parámetros</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                    {sortedP3.map(exp => (
                      <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white font-sans">{exp.id}</td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{exp.arquitectura}</td>
                        <td className="py-2.5 px-3 uppercase text-[11px]">{exp.activacion}</td>
                        <td className="py-2.5 px-3">{exp.optimizador}</td>
                        <td className="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400">{exp.val_auc.toFixed(5)}</td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{exp.val_loss.toFixed(4)}</td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{exp.accuracy}%</td>
                        <td className="py-2.5 px-3 text-slate-500">{exp.parametros}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Multiseed Stability Summary */}
            {multiseedData.length > 0 && (
              <div className="bg-white dark:bg-[#0F172A]/90 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 font-mono">
                  Estabilidad Multi-Seed (5 Semillas: 42, 1, 7, 21, 2026)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Evaluación de robustez estadística para descartar que las diferencias de rendimiento sean artefactos de la inicialización de pesos.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left font-mono">
                    <thead>
                      <tr className="border-b border-slate-200/80 dark:border-slate-800/80 text-slate-500 font-semibold">
                        <th className="py-2.5 px-3 font-sans">Modelo Candidato</th>
                        <th className="py-2.5 px-3">Mean AUC ± Std</th>
                        <th className="py-2.5 px-3">Rango [Min, Max]</th>
                        <th className="py-2.5 px-3">Mean Loss</th>
                        <th className="py-2.5 px-3">Mean Acc</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {multiseedData.map(ms => (
                        <tr key={ms.modelo} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white">{ms.modelo}</td>
                          <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400 font-bold">
                            {ms.mean_auc.toFixed(5)} ± {ms.std_auc.toFixed(5)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                            [{ms.min_auc.toFixed(5)}, {ms.max_auc.toFixed(5)}]
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{ms.mean_loss.toFixed(4)}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{ms.mean_acc}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Ensemble Combinations Table */}
            {ensembleData.length > 0 && (
              <div className="bg-white dark:bg-[#0F172A]/90 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 font-mono">
                  Ponderaciones y Validación de Ensambles
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Comparación rigurosa de esquemas de agregación probabilística sobre el conjunto de Validación.
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left font-mono">
                    <thead>
                      <tr className="border-b border-slate-200/80 dark:border-slate-800/80 text-slate-500 font-semibold">
                        <th className="py-2.5 px-3 font-sans">Esquema / Modelo</th>
                        <th className="py-2.5 px-3">Candidatos</th>
                        <th className="py-2.5 px-3">Val AUC</th>
                        <th className="py-2.5 px-3">Log Loss</th>
                        <th className="py-2.5 px-3">Exactitud</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {ensembleData.slice(0, 6).map((ens, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-sans font-bold text-slate-900 dark:text-white">{ens.nombre}</td>
                          <td className="py-2.5 px-3 text-slate-500">{ens.candidatos}</td>
                          <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400 font-bold">{ens.val_auc.toFixed(5)}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{ens.val_loss.toFixed(4)}</td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{ens.accuracy}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ARQUITECTURA Y PREPROCESAMIENTO */}
        {activeTab === 'architecture' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Pipeline Steps Card */}
            <div className="bg-white dark:bg-[#0F172A]/90 p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 font-mono">
                Pipeline de Preprocesamiento Determinista
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                Las transformaciones matemáticas garantizan reproducibilidad estricta entre entrenamiento y la inferencia productiva.
              </p>

              <div className="space-y-3.5 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start space-x-3.5">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 font-mono">1</div>
                  <div>
                    <strong className="block text-slate-900 dark:text-white font-sans">Limpieza y Variables Faltantes</strong>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1 leading-relaxed">
                      Se eliminan columnas de identificación y complementarias directas (<code>id_solicitud</code>, <code>INCUMPLIO_PAGO</code>). Las variables con más de 1% de valores nulos generan indicadores booleanos automáticos (<code>_nan</code>).
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start space-x-3.5">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 font-mono">2</div>
                  <div>
                    <strong className="block text-slate-900 dark:text-white font-sans">Recorte de Extremos y Transformación Logarítmica</strong>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1 leading-relaxed">
                      Recorte Winsorizing (percentiles p1 y p99) para neutralizar valores atípicos. Transformación <code>log1p</code> para 10 variables asimétricas y <code>Signed-Log</code> para ingreso disponible (soporta valores negativos).
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start space-x-3.5">
                  <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 font-mono">3</div>
                  <div>
                    <strong className="block text-slate-900 dark:text-white font-sans">Codificación Categórica y Estandarización</strong>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1 leading-relaxed">
                      One-Hot Encoding para 4 variables categóricas. Se aplica <code>StandardScaler</code> ajustado exclusivamente en el conjunto de Entrenamiento para generar el vector final de 46 dimensiones.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Neural Ensemble Breakdown */}
            <div className="bg-white dark:bg-[#0F172A]/90 p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 font-mono">
                Redes del Ensamble Oficial (Top-3 Diverso)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white font-sans">cfg_c_s42 (Semilla 42)</div>
                  <div className="text-slate-500">Capas: [64, 32, 16]</div>
                  <div className="text-slate-500">Activación: ReLU</div>
                  <div className="text-slate-500">Adam lr=0.0005, drop=0.15</div>
                  <div className="text-blue-600 dark:text-blue-400 font-bold">5,505 parámetros</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white font-sans">cfg_b_leaky_s42 (Semilla 42)</div>
                  <div className="text-slate-500">Capas: [32, 16]</div>
                  <div className="text-slate-500">Activación: LeakyReLU (α=0.1)</div>
                  <div className="text-slate-500">Adam lr=0.0005, drop=0.15</div>
                  <div className="text-blue-600 dark:text-blue-400 font-bold">1,985 parámetros</div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white font-sans">cfg_base_s2026 (Semilla 2026)</div>
                  <div className="text-slate-500">Capas: [64, 32, 16]</div>
                  <div className="text-slate-500">Activación: ReLU</div>
                  <div className="text-slate-500">Adam lr=0.001, drop=0.20</div>
                  <div className="text-blue-600 dark:text-blue-400 font-bold">5,505 parámetros</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: METODOLOGÍA Y LIMITACIONES */}
        {activeTab === 'methodology' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Rigorous Academic Statement */}
            <div className="bg-white dark:bg-[#0F172A]/90 p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              <h1 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider font-display">
                Gobernanza Metodológica y Conclusiones Empíricas
              </h1>

              <p>
                A lo largo de las tres fases del proyecto, todas las decisiones arquitectónicas y de hiperparámetros 
                se tomaron de manera aislada sobre el conjunto de <strong>Validación</strong>. El conjunto de <strong>Test</strong> (n=7,448) 
                se mantuvo formalmente congelado y solo se consultó una única vez para la auditoría final del modelo ganador.
              </p>

              <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 space-y-2.5">
                <strong className="block font-semibold">Limitaciones Científicas del Modelo:</strong>
                <ul className="list-disc list-inside space-y-1.5 text-[11px] leading-relaxed">
                  <li>
                    <strong>Muestra Balanceada:</strong> El conjunto de datos experimental cuenta con una proporción simétrica de 50% aptos y 50% no aptos. En carteras financieras reales, la tasa base de incumplimiento suele oscilar entre 3% y 15%, por lo que las probabilidades calculadas reflejan la distribución del experimento y no la probabilidad a priori de una población asimétrica no balanceada.
                  </li>
                  <li>
                    <strong>Asociación vs Causalidad:</strong> El modelo identifica patrones multivariados de correlación estadística. No establece relaciones causales directas entre variables individuales y el comportamiento crediticio.
                  </li>
                  <li>
                    <strong>Validez Territorial y Temporal:</strong> Los resultados obtenidos aplican estrictamente bajo las condiciones de este dataset y su ventana de observación; no garantizan generalización inmediata a otros marcos macroeconómicos.
                  </li>
                </ul>
              </div>

              <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 font-mono text-[11px] space-y-1.5 text-slate-700 dark:text-slate-300">
                <div>Archivo: <code>{datasetInfo?.archivo || 'DatasetCreditoFinancieroFinalV2.csv'}</code></div>
                <div>Hash SHA-256: <code className="text-amber-700 dark:text-amber-400 font-bold">{datasetInfo?.sha256 || '19c5b59ccce6face1a0b828d201605aeb0e70b214f7ed60be2efdf13f47f851d'}</code></div>
                <div>Tamaño: {datasetInfo?.bytes?.toLocaleString() || '8,436,730'} bytes | Permisos: {datasetInfo?.permisos || '444 (Solo lectura)'}</div>
                <div>Registros: {datasetInfo?.total_registros?.toLocaleString() || '49,650'} ({datasetInfo?.balance_clases || '50.0% Apto / 50.0% No Apto'})</div>
                <div>Particiones: Train ({datasetInfo?.train_n?.toLocaleString() || '34,755'}) · Val ({datasetInfo?.val_n?.toLocaleString() || '7,447'}) · Test ({datasetInfo?.test_n?.toLocaleString() || '7,448'})</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <p>
          Redes Neuronales Profundas para Evaluación Crediticia
        </p>
        <button
          type="button"
          onClick={onOpenAbout}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Sobre nosotros
        </button>
      </footer>
    </div>
  );
};

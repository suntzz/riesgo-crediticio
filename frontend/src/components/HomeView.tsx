import React from 'react';
import { 
  FileCheck2, 
  FlaskConical, 
  ArrowRight, 
  Binary, 
  ShieldCheck, 
  Activity
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogo } from './BrandLogo';
import { QuantitativeMesh } from './QuantitativeMesh';
import type { HealthStatus, ViewMode } from '../types';

interface HomeViewProps {
  onSelectView: (view: ViewMode) => void;
  health: HealthStatus | null;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectView, health }) => {
  const isHealthy = health?.status === 'healthy';

  return (
    <div className="min-h-[100dvh] flex flex-col justify-between bg-slate-50 dark:bg-[#0B1220] text-slate-900 dark:text-slate-100 transition-colors relative overflow-hidden">
      {/* Retícula matemática técnica de fondo */}
      <div className="absolute inset-0 bg-atelier-grid opacity-75 pointer-events-none" aria-hidden="true" />
      
      {/* Constelación dimensional abstracta de 23 variables */}
      <div className="absolute right-[-10%] top-[-5%] w-[650px] h-[650px] opacity-40 dark:opacity-30 pointer-events-none hidden lg:block">
        <QuantitativeMesh className="w-full h-full" />
      </div>

      {/* Navegación Superior */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800/60 backdrop-blur-sm">
        {/* Identidad de Marca */}
        <div className="flex items-center space-x-3">
          <BrandLogo size="sm" />
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-base tracking-tight text-slate-950 dark:text-white leading-none">
              CrediRisk
            </span>
            <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 mt-0.5">
              Quantitative Atelier
            </span>
          </div>
        </div>

        {/* Acciones y selector de tema */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div 
            className="hidden sm:inline-flex items-center space-x-2 px-2.5 py-1 rounded-md text-[11px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-2xs"
            title={isHealthy ? 'Servicio de inferencia activo' : 'Verificando servicio...'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span>{isHealthy ? 'API Conectada' : 'API Desconectada'}</span>
          </div>

          <button
            type="button"
            onClick={() => onSelectView('about')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-colors"
          >
            Sobre nosotros
          </button>

          <ThemeToggle />
        </div>
      </header>

      {/* Área Principal: Composición Asimétrica Editorial */}
      <main className="relative z-10 w-full max-w-6xl mx-auto px-6 py-8 md:py-12 flex-1 flex flex-col justify-center">
        {/* Titular y subtítulo exactos requeridos */}
        <div className="max-w-3xl mb-10 md:mb-12">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md text-[11px] font-mono uppercase tracking-[0.14em] font-semibold bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60 mb-3">
            <Binary className="w-3.5 h-3.5" />
            <span>Deep Learning</span>
          </div>
          
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.05]">
            CrediRisk
          </h1>
          
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl font-sans">
            Plataforma de evaluación cuantitativa del riesgo crediticio mediante ensamble de redes neuronales profundas y análisis probabilístico multivariado.
          </p>
        </div>

        {/* Las dos experiencias principales: Bloques con identidad diferenciada */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Opción 1: Evaluador de Crédito (Dominante, 7 columnas) */}
          <div 
            onClick={() => onSelectView('evaluator')}
            className="lg:col-span-7 group relative bg-white dark:bg-slate-900 rounded-2xl p-7 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500/80 dark:hover:border-blue-500/80 transition-all duration-200 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <span className="font-mono text-[11px] text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50 px-2.5 py-1 rounded-md font-medium">
                  Inferencia Activa
                </span>
              </div>

              <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-950 dark:text-white mb-2.5 tracking-tight">
                Evaluador de crédito
              </h2>
              
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6 font-sans">
                Introduce los 23 parámetros financieros y personales del solicitante para calcular la probabilidad objetiva de cumplimiento bajo el umbral calibrado del modelo.
              </p>

              {/* Ficha técnica resumida */}
              <div className="grid grid-cols-2 gap-3 mb-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>23 Variables Validadas</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400">
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Diagnóstico Multivariado</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectView('evaluator');
              }}
              className="w-full inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors active:scale-[0.99]"
            >
              <span>Abrir evaluador de crédito</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Opción 2: Laboratorio del Modelo (Analítico, 5 columnas) */}
          <div 
            onClick={() => onSelectView('lab')}
            className="lg:col-span-5 group relative bg-white/80 dark:bg-slate-900/80 rounded-2xl p-7 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-200 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 flex items-center justify-center border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-md font-medium">
                  Evidencia Empírica
                </span>
              </div>

              <h2 className="font-display text-xl sm:text-2xl font-bold text-slate-950 dark:text-white mb-2.5 tracking-tight">
                Laboratorio del modelo
              </h2>
              
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6 font-sans">
                Inspecciona la arquitectura de las 3 redes neuronales, la matriz de confusión sobre el conjunto Test congelado y los experimentos de optimización.
              </p>

              {/* Métricas clave en formato tabular */}
              <div className="bg-slate-50 dark:bg-slate-950/60 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800/80 mb-6 font-mono text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-slate-500">Modelo Final</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Ensemble Top-3</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                  <span className="text-slate-500">Test ROC-AUC</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">0.7448</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Observaciones</span>
                  <span className="font-semibold text-slate-900 dark:text-white tabular-nums">49,650</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectView('lab');
              }}
              className="w-full inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors active:scale-[0.99]"
            >
              <span>Explorar laboratorio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </main>

      {/* Pie de página unificado */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 border-t border-slate-200/70 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <p className="font-sans">
          Redes Neuronales Profundas para Evaluación Crediticia
        </p>
        <button
          type="button"
          onClick={() => onSelectView('about')}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors"
        >
          Sobre nosotros
        </button>
      </footer>
    </div>
  );
};

export default HomeView;

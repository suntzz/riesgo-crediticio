import { 
  FileCheck2, 
  FlaskConical, 
  ArrowRight, 
  Cpu
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import type { HealthStatus, ViewMode } from '../types';

interface HomeViewProps {
  onSelectView: (view: ViewMode) => void;
  health: HealthStatus | null;
}

export const HomeView: React.FC<HomeViewProps> = ({ onSelectView, health }) => {
  const isHealthy = health?.status === 'healthy';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Minimal Top Bar */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            CR
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
            CrediRisk
          </span>
        </div>

        {/* Status, Sobre nosotros & Theme Toggle */}
        <div className="flex items-center space-x-3">
          <div 
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            title={isHealthy ? 'Backend FastAPI conectado' : 'Conectando con la API...'}
          >
            <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isHealthy ? 'API Conectada' : 'Verificando API'}</span>
          </div>

          <button
            type="button"
            onClick={() => onSelectView('about')}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Sobre nosotros
          </button>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Hero & Choice Section */}
      <main className="w-full max-w-4xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        {/* Heading */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>Deep Learning</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.15]">
            Evaluación inteligente del riesgo crediticio
          </h1>
        </div>

        {/* The Two Main Experiences (Opción A & Opción B) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
          {/* Opción A: Evaluador de Crédito */}
          <div 
            onClick={() => onSelectView('evaluator')}
            className="group relative bg-white dark:bg-slate-900/90 rounded-2xl p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 border border-blue-100 dark:border-blue-900/40 group-hover:scale-105 transition-transform">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                Evaluador de crédito
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                Evalúa un perfil de solicitante y consulta la predicción generada por el modelo.
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectView('evaluator');
              }}
              className="w-full inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
            >
              <span>Abrir evaluador</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Opción B: Laboratorio del Modelo */}
          <div 
            onClick={() => onSelectView('lab')}
            className="group relative bg-white dark:bg-slate-900/90 rounded-2xl p-7 border border-slate-200/90 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600 transition-all duration-200 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center mb-5 border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform">
                <FlaskConical className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                Laboratorio del modelo
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                Explora la arquitectura, los experimentos, las métricas y los resultados del entrenamiento.
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectView('lab');
              }}
              className="w-full inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
            >
              <span>Explorar laboratorio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full max-w-4xl mx-auto px-6 py-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <p>
          Redes Neuronales Profundas para Evaluación Crediticia
        </p>
        <button
          type="button"
          onClick={() => onSelectView('about')}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          Sobre nosotros
        </button>
      </footer>
    </div>
  );
};

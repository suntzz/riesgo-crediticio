import React from 'react';
import { 
  ArrowLeft, 
  FileCheck2, 
  FlaskConical, 
  Users
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { BrandLogo } from './BrandLogo';

interface AboutUsViewProps {
  onBackToHome: () => void;
  onOpenEvaluator: () => void;
  onOpenLab: () => void;
}

interface TeamMember {
  id: number;
  nombre: string;
  iniciales: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  { id: 1, nombre: 'IVAN CAMILO SOLANO SANCHEZ', iniciales: 'IS' },
  { id: 2, nombre: 'CRISTIAN CAMILO MARTINEZ DELGADO', iniciales: 'CM' },
  { id: 3, nombre: 'SHARICK NATALIA HERNANDEZ GOMEZ', iniciales: 'SH' },
  { id: 4, nombre: 'LAURA SOFIA DIAZ SUAREZ', iniciales: 'LD' },
  { id: 5, nombre: 'LEIDY VANESSA GUECHA ALAPE', iniciales: 'LG' },
];

export const AboutUsView: React.FC<AboutUsViewProps> = ({
  onBackToHome,
  onOpenEvaluator,
  onOpenLab,
}) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Inicio</span>
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <div className="flex items-center space-x-2">
              <BrandLogo size="xs" />
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                CrediRisk
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">/ Sobre nosotros</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={onOpenEvaluator}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Evaluador</span>
            </button>
            <button
              type="button"
              onClick={onOpenLab}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Laboratorio</span>
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 flex flex-col justify-center">
        {/* Title & Introduction */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 mb-4">
            <Users className="w-3.5 h-3.5" />
            <span>Equipo de Desarrollo</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
            Sobre nosotros
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Somos el equipo responsable del desarrollo de CrediRisk y del trabajo relacionado con redes neuronales profundas para la evaluación crediticia.
          </p>
        </div>

        {/* Team Grid: 5 members in a balanced layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-3xl mx-auto w-full mb-12">
          {TEAM_MEMBERS.map((member) => (
            <div
              key={member.id}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center transition-all hover:border-blue-400 dark:hover:border-blue-500"
            >
              {/* Abstract avatar */}
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-sm font-mono text-blue-600 dark:text-blue-400 mb-4 shadow-inner">
                {member.iniciales}
              </div>
              <h2 className="text-xs sm:text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                {member.nombre}
              </h2>
            </div>
          ))}
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Volver al Inicio
          </button>
          <button
            type="button"
            onClick={onOpenEvaluator}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            Abrir Evaluador de Crédito
          </button>
          <button
            type="button"
            onClick={onOpenLab}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            Explorar Laboratorio
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto px-6 py-6 border-t border-slate-200 dark:border-slate-800/80 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>
          Redes Neuronales Profundas para Evaluación Crediticia
        </p>
      </footer>
    </div>
  );
};

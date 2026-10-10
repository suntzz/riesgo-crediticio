import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { HomeView } from './components/HomeView';
import { EvaluatorView } from './components/EvaluatorView';
import { ModelLabView } from './components/ModelLabView';
import { AboutUsView } from './components/AboutUsView';
import { fetchHealth, fetchMetrics } from './services/api';
import type { ApplicantFormData, HealthStatus, SystemMetrics, ViewMode } from './types';

const DEFAULT_APPLICANT: ApplicantFormData = {
  id_solicitud: 172745,
  edad: 43.9,
  ingreso_mensual: 202500.0,
  obligaciones_mensuales: 153454.09,
  estado_civil: 'Single / not married',
  ingreso_disponible: 13522.91,
  monto_solicitado: 835380.0,
  plazo_meses: 48.0,
  cuota_estimada: 35523.0,
  tasa_interes_ea: 49.31,
  nivel_endeudamiento_pct: 93.32,
  score_crediticio: 585.0,
  numero_creditos_activos: 2.0,
  saldo_total_creditos: 2619045.0,
  numero_cuotas_mora: 0.0,
  dias_maximo_mora: 0.0,
  porcentaje_pagos_oportunos: 100.0,
  antiguedad_laboral_anios: 7.17,
  patrimonio_indice: 4,
  antiguedad_cliente_anios: 7.74,
  linea_negocio: 'Cash loans',
  tipo_contrato: 'Working',
  personas_a_cargo: 1,
  tipo_vivienda: 'House / apartment',
  model_type: 'ensemble',
};

const MainContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);

  useEffect(() => {
    fetchHealth()
      .then(setHealth)
      .catch(err => console.warn('Backend aún no disponible:', err.message));

    fetchMetrics()
      .then(setMetrics)
      .catch(err => console.warn('Error cargando métricas:', err.message));
  }, []);

  if (currentView === 'evaluator') {
    return (
      <EvaluatorView
        onBackToHome={() => setCurrentView('home')}
        onOpenLab={() => setCurrentView('lab')}
        onOpenAbout={() => setCurrentView('about')}
        defaultData={DEFAULT_APPLICANT}
      />
    );
  }

  if (currentView === 'lab') {
    return (
      <ModelLabView
        onBackToHome={() => setCurrentView('home')}
        onOpenEvaluator={() => setCurrentView('evaluator')}
        onOpenAbout={() => setCurrentView('about')}
        metrics={metrics}
      />
    );
  }

  if (currentView === 'about') {
    return (
      <AboutUsView
        onBackToHome={() => setCurrentView('home')}
        onOpenEvaluator={() => setCurrentView('evaluator')}
        onOpenLab={() => setCurrentView('lab')}
      />
    );
  }

  return (
    <HomeView
      onSelectView={setCurrentView}
      health={health}
    />
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <MainContent />
    </ThemeProvider>
  );
};

export default App;

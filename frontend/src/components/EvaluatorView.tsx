import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  Sparkles, 
  AlertCircle,
  FlaskConical,
  CheckCircle2,
  XCircle,
  Calculator,
  User,
  DollarSign,
  History,
  Briefcase,
  FileText,
  Printer,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Info
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { PrintReport } from './PrintReport';
import { BrandLogo } from './BrandLogo';
import { predictApplicant, fetchSampleApplicant } from '../services/api';
import type { ApplicantFormData, PredictionResult } from '../types';

interface EvaluatorViewProps {
  onBackToHome: () => void;
  onOpenLab: () => void;
  onOpenAbout: () => void;
  defaultData: ApplicantFormData;
}

const TOTAL_STEPS = 5;

const STEP_LABELS = [
  { step: 1, title: 'Datos Personales', subtitle: 'Perfil e identidad' },
  { step: 2, title: 'Capacidad Financiera', subtitle: 'Flujos y condiciones' },
  { step: 3, title: 'Historial Crediticio', subtitle: 'Buró y puntualidad' },
  { step: 4, title: 'Perfil Laboral', subtitle: 'Ocupación y contrato' },
  { step: 5, title: 'Diagnóstico Final', subtitle: 'Revisión y cálculo' },
];

export const EvaluatorView: React.FC<EvaluatorViewProps> = ({
  onBackToHome,
  onOpenLab,
  onOpenAbout,
  defaultData,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<ApplicantFormData>(defaultData);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingSample, setLoadingSample] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Field change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      const parsed = value === '' ? 0 : parseFloat(value);
      setFormData(prev => ({ ...prev, [name]: isNaN(parsed) ? 0 : parsed }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Helper auto-calculations
  const handleAutoDisposableIncome = () => {
    const disp = (formData.ingreso_mensual || 0) - (formData.obligaciones_mensuales || 0);
    setFormData(prev => ({ ...prev, ingreso_disponible: parseFloat(disp.toFixed(2)) }));
  };

  const handleAutoDebtRatio = () => {
    const income = formData.ingreso_mensual || 0;
    if (income > 0) {
      const ratio = ((formData.obligaciones_mensuales || 0) / income) * 100;
      setFormData(prev => ({ ...prev, nivel_endeudamiento_pct: parseFloat(ratio.toFixed(2)) }));
    }
  };

  const handleAutoInstallment = () => {
    const principal = formData.monto_solicitado || 0;
    const months = formData.plazo_meses || 1;
    const rateEA = (formData.tasa_interes_ea || 0) / 100;
    if (principal > 0 && months > 0) {
      const monthlyRate = Math.pow(1 + rateEA, 1 / 12) - 1;
      let installment = 0;
      if (monthlyRate > 0) {
        installment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
      } else {
        installment = principal / months;
      }
      setFormData(prev => ({ ...prev, cuota_estimada: parseFloat(installment.toFixed(2)) }));
    }
  };

  // Sample data loader
  const handleLoadSample = async () => {
    setLoadingSample(true);
    setErrorMsg(null);
    try {
      const sample = await fetchSampleApplicant();
      setFormData({ ...sample, model_type: 'ensemble' });
    } catch {
      setFormData({ ...defaultData, model_type: 'ensemble' });
    } finally {
      setLoadingSample(false);
    }
  };

  // Reset handler
  const handleReset = () => {
    setFormData({
      edad: 35,
      estado_civil: 'Single / not married',
      personas_a_cargo: 0,
      tipo_vivienda: 'House / apartment',
      ingreso_mensual: 150000,
      obligaciones_mensuales: 40000,
      ingreso_disponible: 110000,
      monto_solicitado: 500000,
      plazo_meses: 36,
      cuota_estimada: 22000,
      tasa_interes_ea: 38.0,
      nivel_endeudamiento_pct: 26.6,
      score_crediticio: 620,
      numero_creditos_activos: 1,
      saldo_total_creditos: 800000,
      numero_cuotas_mora: 0,
      dias_maximo_mora: 0,
      porcentaje_pagos_oportunos: 100,
      antiguedad_laboral_anios: 4.0,
      patrimonio_indice: 3,
      antiguedad_cliente_anios: 3.5,
      linea_negocio: 'Cash loans',
      tipo_contrato: 'Working',
      model_type: 'ensemble',
    });
    setPrediction(null);
    setCurrentStep(1);
    setErrorMsg(null);
  };

  // Step validation
  const validateStep = (step: number): boolean => {
    setErrorMsg(null);
    if (step === 1) {
      if (formData.edad < 18 || formData.edad > 95) {
        setErrorMsg('La edad debe estar comprendida entre 18 y 95 años.');
        return false;
      }
    } else if (step === 2) {
      if (formData.ingreso_mensual <= 0) {
        setErrorMsg('El ingreso mensual debe ser mayor a 0.');
        return false;
      }
      if (formData.monto_solicitado <= 0) {
        setErrorMsg('El monto solicitado debe ser mayor a 0.');
        return false;
      }
      if (formData.plazo_meses <= 0 || formData.plazo_meses > 120) {
        setErrorMsg('El plazo debe situarse entre 1 y 120 meses.');
        return false;
      }
    } else if (step === 3) {
      if (formData.score_crediticio < 0 || formData.score_crediticio > 1000) {
        setErrorMsg('El score crediticio debe estar entre 0 y 1000 puntos.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(TOTAL_STEPS, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setErrorMsg(null);
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Submit inference
  const handleExecuteInference = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await predictApplicant(formData);
      setPrediction(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al ejecutar la inferencia del modelo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B1220] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Atelier Minimal Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-[#0F172A]/85 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 py-3.5 flex items-center justify-between">
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
                / Evaluador Cuantitativo
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={onOpenLab}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <FlaskConical className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Laboratorio</span>
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

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8">
        {/* Error notification */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start justify-between shadow-sm animate-in fade-in duration-150">
            <div className="flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Validación requerida:</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700 ml-3">✕</button>
          </div>
        )}

        {/* Prediction Ready: Quantitative Certificate Verdict */}
        {prediction ? (
          <div className="bg-white dark:bg-[#0F172A]/90 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm p-6 sm:p-8 space-y-8 animate-in fade-in duration-200">
            {/* Certificate Top Banner */}
            <div className="border-b border-slate-200/80 dark:border-slate-800/80 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">
                  <span>EXPEDIENTE TÉCNICO #{prediction.id_solicitud}</span>
                  <span>·</span>
                  <span>{new Date().toLocaleDateString('es-CO')}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
                  Dictamen de Inferencia Crediticia
                </h1>
              </div>

              <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/70">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Modelo: Ensemble Top-3 Diverso</span>
              </div>
            </div>

            {/* Verdict Centerpiece */}
            <div className="text-center max-w-xl mx-auto py-2">
              <span className="text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-mono block mb-3">
                Resultado Oficial del Algoritmo
              </span>

              {/* Classification Pill */}
              <div className="flex items-center justify-center mb-6">
                {prediction.resultado === 'APTO' ? (
                  <div className="inline-flex items-center space-x-3 px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-display font-bold text-base tracking-wide shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>DICTAMEN: APTO PARA CRÉDITO</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-3 px-6 py-3 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 font-display font-bold text-base tracking-wide shadow-sm">
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    <span>DICTAMEN: NO APTO PARA CRÉDITO</span>
                  </div>
                )}
              </div>

              {/* Probability Number */}
              <div className="mb-6">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                  Probabilidad calculada de cumplimiento crediticio P(Apto)
                </span>
                <div className="text-5xl sm:text-6xl font-mono font-bold tracking-tight text-slate-900 dark:text-white">
                  {(prediction.probabilidad_apto * 100).toFixed(2)}%
                </div>
              </div>

              {/* Calibrated Probability Gauge */}
              <div className="space-y-2 max-w-md mx-auto">
                <div className="relative pt-6 pb-2">
                  {/* Gauge Track */}
                  <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden relative">
                    <div 
                      className={`h-full transition-all duration-700 ${
                        prediction.resultado === 'APTO' 
                          ? 'bg-gradient-to-r from-blue-600 via-sky-500 to-emerald-500' 
                          : 'bg-gradient-to-r from-rose-500 via-amber-500 to-blue-600'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, prediction.probabilidad_apto * 100))}%` }}
                    />
                  </div>

                  {/* 50% Threshold marker */}
                  <div 
                    className="absolute top-2 bottom-0 w-0.5 bg-slate-900 dark:bg-white z-10 flex flex-col items-center"
                    style={{ left: '50%' }}
                  >
                    <span className="absolute -top-4 text-[10px] font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      Umbral 50%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <span>0% (Riesgo Crítico)</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Corte Operativo: 50.00%
                  </span>
                  <span>100% (Perfil Óptimo)</span>
                </div>
              </div>

              {/* Scientific Interpretation */}
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg mx-auto mt-6">
                {prediction.resultado === 'APTO'
                  ? `La probabilidad estimada (${(prediction.probabilidad_apto * 100).toFixed(2)}%) supera el umbral estricto de decisión (50.00%). El perfil financiero y de buró se clasifica dentro de la categoría de cumplimiento.`
                  : `La probabilidad estimada (${(prediction.probabilidad_apto * 100).toFixed(2)}%) se sitúa por debajo del umbral estricto de decisión (50.00%). El perfil refleja factores de riesgo que comprometen la viabilidad crediticia.`}
              </p>
            </div>

            {/* Relevant Factors Breakdown */}
            {prediction.factores_relevantes && prediction.factores_relevantes.length > 0 && (
              <div className="border-t border-slate-200/80 dark:border-slate-800/80 pt-6">
                <div className="flex items-center space-x-2 text-xs font-mono font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-4">
                  <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Factores Determinantes Identificados por el Modelo</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {prediction.factores_relevantes.map((factor, idx) => (
                    <div 
                      key={idx} 
                      className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 dark:text-white font-sans">
                            {factor.variable}
                          </span>
                          <span 
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                              factor.impacto === 'positivo'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : factor.impacto === 'negativo'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {factor.impacto}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                          {factor.detalle}
                        </p>
                      </div>

                      <div className="text-right font-mono text-xs font-bold text-slate-900 dark:text-white shrink-0">
                        {factor.valor}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evaluated Variables Summary Grid */}
            <div className="bg-slate-50 dark:bg-[#0B1220]/60 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800/80 text-xs">
              <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 block mb-3 uppercase tracking-wider">
                Resumen del Perfil Registrado
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-slate-600 dark:text-slate-300 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Score Buró</span>
                  <strong className="text-slate-900 dark:text-white">{formData.score_crediticio} pts</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Monto Solicitado</span>
                  <strong className="text-slate-900 dark:text-white">${formData.monto_solicitado.toLocaleString('es-CO')}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Nivel Endeudamiento</span>
                  <strong className="text-slate-900 dark:text-white">{formData.nivel_endeudamiento_pct}%</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Días Máx Mora</span>
                  <strong className="text-slate-900 dark:text-white">{formData.dias_maximo_mora} días</strong>
                </div>
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPrediction(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                  Modificar datos actuales
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                >
                  Nuevo solicitante
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  title="Generar e imprimir informe PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir informe</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onOpenLab}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                <span>Inspeccionar en el Laboratorio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Academic disclaimer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed text-center">
              Aviso metodológico: Este sistema es un prototipo académico basado en redes neuronales entrenadas sobre una muestra experimental balanceada (50% aptos / 50% no aptos). La predicción probabilística refleja correlaciones estadísticas multivariadas y no constituye una aprobación crediticia bancaria vinculante.
            </div>
          </div>
        ) : (
          /* Multi-Step Quantitative Form */
          <div className="bg-white dark:bg-[#0F172A]/90 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm overflow-hidden">
            {/* Form Top Toolbar */}
            <div className="px-6 py-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-900/50">
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Etapa {currentStep} de {TOTAL_STEPS}
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {STEP_LABELS[currentStep - 1].subtitle}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  disabled={loadingSample}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
                  title="Cargar perfil de prueba predeterminado"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                  <span>{loadingSample ? 'Cargando...' : 'Cargar Ejemplo'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  title="Restablecer valores del formulario"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Horizontal Stepper Rail */}
            <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0F172A] px-6 py-3 overflow-x-auto no-scrollbar">
              <div className="flex items-center space-x-2 sm:space-x-4 min-w-max">
                {STEP_LABELS.map((item) => {
                  const isActive = item.step === currentStep;
                  const isCompleted = item.step < currentStep;

                  return (
                    <button
                      key={item.step}
                      type="button"
                      onClick={() => {
                        if (item.step < currentStep || validateStep(currentStep)) {
                          setCurrentStep(item.step);
                        }
                      }}
                      className={`flex items-center space-x-2 py-1 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                          : isCompleted
                          ? 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                          : 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                        isActive 
                          ? 'bg-blue-600 text-white' 
                          : isCompleted 
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {item.step}
                      </span>
                      <span>{item.title}</span>
                      {item.step < TOTAL_STEPS && (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 hidden sm:inline" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
              <div 
                className="bg-blue-600 dark:bg-blue-500 h-1 transition-all duration-300 ease-out"
                style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              />
            </div>

            {/* Form Step Contents */}
            <div className="p-6 sm:p-8">
              {/* Step 1: Información Personal y Demográfica */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>01. Parámetros personales y situación familiar</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                        Edad del Solicitante (años) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="edad"
                        step="0.1"
                        min="18"
                        max="95"
                        value={formData.edad || ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 43.9"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                        Estado Civil <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="estado_civil"
                        value={formData.estado_civil}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                      >
                        <option value="Single / not married">Soltero(a) / No casado</option>
                        <option value="Married">Casado(a)</option>
                        <option value="Civil marriage">Unión libre / Matrimonio civil</option>
                        <option value="Separated">Separado(a) / Divorciado</option>
                        <option value="Widow">Viudo(a)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                        Personas a Cargo <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="personas_a_cargo"
                        min="0"
                        max="15"
                        value={formData.personas_a_cargo}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 1"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                        Tipo de Vivienda <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="tipo_vivienda"
                        value={formData.tipo_vivienda}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                      >
                        <option value="House / apartment">Casa / Apartamento propio</option>
                        <option value="Rented apartment">Apartamento en arriendo</option>
                        <option value="With parents">Con padres / familiares</option>
                        <option value="Municipal apartment">Vivienda municipal / social</option>
                        <option value="Office apartment">Oficina / Apartamento comercial</option>
                        <option value="Co-op apartment">Cooperativa de vivienda</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Capacidad Financiera y Condiciones del Crédito */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>02. Flujos monetarios, obligaciones y estructura del crédito</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                        Ingreso Mensual ($) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="ingreso_mensual"
                        step="1000"
                        min="0"
                        value={formData.ingreso_mensual || ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 202500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                        Obligaciones Mensuales ($)
                      </label>
                      <input
                        type="number"
                        name="obligaciones_mensuales"
                        step="100"
                        min="0"
                        value={formData.obligaciones_mensuales || ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 153454.09"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 font-sans">
                          Ingreso Disponible ($) <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleAutoDisposableIncome}
                          className="inline-flex items-center space-x-1 text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Calculator className="w-3 h-3" />
                          <span>Auto-calcular</span>
                        </button>
                      </div>
                      <input
                        type="number"
                        name="ingreso_disponible"
                        step="100"
                        value={formData.ingreso_disponible || ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 13522.91"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 font-sans">
                          Nivel de Endeudamiento (%) <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleAutoDebtRatio}
                          className="inline-flex items-center space-x-1 text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Calculator className="w-3 h-3" />
                          <span>Auto-calcular</span>
                        </button>
                      </div>
                      <input
                        type="number"
                        name="nivel_endeudamiento_pct"
                        step="0.01"
                        min="0"
                        value={formData.nivel_endeudamiento_pct || ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 93.32"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                        Monto Solicitado ($) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="monto_solicitado"
                        step="1000"
                        min="1000"
                        value={formData.monto_solicitado || ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 835380"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                        Plazo del Crédito (meses) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="plazo_meses"
                        min="1"
                        max="120"
                        value={formData.plazo_meses || ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 48"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                        Tasa de Interés (% E.A.) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="tasa_interes_ea"
                        step="0.01"
                        min="0"
                        max="120"
                        value={formData.tasa_interes_ea || ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 49.31"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300 font-sans">
                          Cuota Estimada ($) <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleAutoInstallment}
                          className="inline-flex items-center space-x-1 text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Calculator className="w-3 h-3" />
                          <span>Auto-estimar</span>
                        </button>
                      </div>
                      <input
                        type="number"
                        name="cuota_estimada"
                        step="100"
                        min="0"
                        value={formData.cuota_estimada || ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 35523"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Historial Crediticio y Comportamiento de Pago */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                    <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>03. Centrales de riesgo, morosidad y saldo acumulado</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Score Buró Hero */}
                    <div className="sm:col-span-2 bg-slate-50/80 dark:bg-slate-900/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-900 dark:text-white font-sans">
                          Score Crediticio Oficial (0 - 1000) <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                          {formData.score_crediticio} pts
                        </span>
                      </div>
                      <input
                        type="number"
                        name="score_crediticio"
                        min="0"
                        max="1000"
                        value={formData.score_crediticio || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 text-base font-bold font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 585"
                      />
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                        Puntaje oficial de comportamiento crediticio. Corresponde a la dimensión con mayor peso relativo en el ensamble neuronal.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                        Número de Créditos Activos
                      </label>
                      <input
                        type="number"
                        name="numero_creditos_activos"
                        min="0"
                        value={formData.numero_creditos_activos ?? ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 2"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                        Saldo Total Deuda ($)
                      </label>
                      <input
                        type="number"
                        name="saldo_total_creditos"
                        step="1000"
                        min="0"
                        value={formData.saldo_total_creditos ?? ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 2619045"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                        Cuotas en Mora Actuales
                      </label>
                      <input
                        type="number"
                        name="numero_cuotas_mora"
                        min="0"
                        value={formData.numero_cuotas_mora ?? ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                        Días Máximos de Mora <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="dias_maximo_mora"
                        min="0"
                        value={formData.dias_maximo_mora ?? ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 0"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                        Porcentaje de Pagos Oportunos (% Cumplimiento)
                      </label>
                      <input
                        type="number"
                        name="porcentaje_pagos_oportunos"
                        step="0.1"
                        min="0"
                        max="100"
                        value={formData.porcentaje_pagos_oportunos ?? ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 100.0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Perfil Laboral y Relación Institucional */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                    <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>04. Relación institucional, estabilidad laboral y patrimonio</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                        Línea de Negocio <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="linea_negocio"
                        value={formData.linea_negocio}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                      >
                        <option value="Cash loans">Crédito Libre Inversión (Cash loans)</option>
                        <option value="Revolving loans">Crédito Rotativo / Tarjeta (Revolving loans)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                        Tipo de Contrato / Ocupación <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="tipo_contrato"
                        value={formData.tipo_contrato}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                      >
                        <option value="Working">Empleado / Asalariado (Working)</option>
                        <option value="Commercial associate">Socio Comercial / Independiente</option>
                        <option value="State servant">Funcionario Público (State servant)</option>
                        <option value="Pensioner">Pensionado / Jubilado (Pensioner)</option>
                        <option value="Businessman">Empresario (Businessman)</option>
                        <option value="Student">Estudiante (Student)</option>
                        <option value="Unemployed">Desempleado (Unemployed)</option>
                        <option value="Otro">Otro Régimen</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                        Antigüedad Laboral (años)
                      </label>
                      <input
                        type="number"
                        name="antiguedad_laboral_anios"
                        step="0.1"
                        min="0"
                        max="60"
                        value={formData.antiguedad_laboral_anios ?? ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 7.17"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                        Antigüedad como Cliente (años)
                      </label>
                      <input
                        type="number"
                        name="antiguedad_cliente_anios"
                        step="0.1"
                        min="0"
                        max="60"
                        value={formData.antiguedad_cliente_anios ?? ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 7.74"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
                        Índice Patrimonial (escala 0 a 10) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="patrimonio_indice"
                        min="0"
                        max="10"
                        value={formData.patrimonio_indice}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 text-sm font-mono bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 4"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Diagnóstico Pre-Inferencia */}
              {currentStep === 5 && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>05. Dossier de validación previo al cálculo de inferencia</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-[#0B1220]/60 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3.5 gap-x-4">
                      <div>
                        <span className="text-slate-400 text-[11px] block font-sans">Edad / Dependientes</span>
                        <strong className="text-slate-900 dark:text-white font-mono">{formData.edad} años ({formData.personas_a_cargo} a cargo)</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block font-sans">Estado Civil</span>
                        <strong className="text-slate-900 dark:text-white">{formData.estado_civil}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block font-sans">Ingreso Mensual</span>
                        <strong className="text-slate-900 dark:text-white font-mono">${formData.ingreso_mensual.toLocaleString('es-CO')}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block font-sans">Monto Solicitado</span>
                        <strong className="text-slate-900 dark:text-white font-mono">${formData.monto_solicitado.toLocaleString('es-CO')}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block font-sans">Plazo / Cuota</span>
                        <strong className="text-slate-900 dark:text-white font-mono">{formData.plazo_meses}m (${formData.cuota_estimada.toLocaleString('es-CO')})</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block font-sans">Score Buró</span>
                        <strong className="text-blue-600 dark:text-blue-400 font-mono font-bold">{formData.score_crediticio} pts</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block font-sans">Nivel Endeudamiento</span>
                        <strong className="text-slate-900 dark:text-white font-mono">{formData.nivel_endeudamiento_pct}%</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block font-sans">Días Mora Máxima</span>
                        <strong className="text-slate-900 dark:text-white font-mono">{formData.dias_maximo_mora} días</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block font-sans">Tipo Contrato</span>
                        <strong className="text-slate-900 dark:text-white">{formData.tipo_contrato}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50/60 dark:bg-blue-950/40 p-4 rounded-xl border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-950 dark:text-blue-300">
                    <div className="flex items-center space-x-2 font-semibold mb-1">
                      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Motor de Evaluación: Ensemble Top-3 Diverso (Equiponderado)</span>
                    </div>
                    <p className="text-[11px] text-blue-900/80 dark:text-blue-300/80 leading-relaxed pl-6">
                      El cálculo promediará las salidas probabilísticas de tres redes profundas con semillas y activaciones heterogéneas. Umbral operativo = 50.00%.
                    </p>
                  </div>
                </div>
              )}

              {/* Bottom Nav Buttons */}
              <div className="mt-8 pt-5 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-3">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={isLoading}
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Anterior</span>
                  </button>
                ) : (
                  <div />
                )}

                {currentStep < TOTAL_STEPS ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleExecuteInference}
                    disabled={isLoading}
                    className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Ejecutando inferencia neuronal...</span>
                      </>
                    ) : (
                      <>
                        <Calculator className="w-3.5 h-3.5" />
                        <span>Ejecutar Predicción</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 no-print">
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

      {/* Printable Report template (visible only on @media print) */}
      {prediction && <PrintReport result={prediction} applicant={formData} />}
    </div>
  );
};

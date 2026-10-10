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
  Printer
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

const STEP_TITLES = [
  'Datos Personales',
  'Capacidad Financiera',
  'Historial Crediticio',
  'Perfil Laboral',
  'Confirmación y Evaluación',
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
      // Fallback
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
        setErrorMsg('El plazo debe ser entre 1 y 120 meses.');
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
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
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
              <span className="text-xs text-slate-500 dark:text-slate-400">/ Evaluador</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={onOpenLab}
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Laboratorio</span>
            </button>

            <button
              type="button"
              onClick={onOpenAbout}
              className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span>Sobre nosotros</span>
            </button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-8">
        {/* Error notification */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-xs flex items-start justify-between shadow-sm">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Validación de datos:</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-rose-500 hover:text-rose-700 ml-3">✕</button>
          </div>
        )}

        {/* If prediction is ready, show Result View */}
        {prediction ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 space-y-8 animate-in fade-in duration-200">
            {/* Top Status */}
            <div className="text-center max-w-lg mx-auto">
              <div className="inline-flex items-center space-x-2 mb-3">
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Solicitud #{prediction.id_solicitud}
                </span>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  Umbral: 50.00%
                </span>
              </div>

              {/* Classification Pill */}
              <div className="flex items-center justify-center my-4">
                {prediction.resultado === 'APTO' ? (
                  <div className="inline-flex items-center space-x-2.5 px-5 py-2.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 font-bold text-sm tracking-wide">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>DICTAMEN: APTO PARA CRÉDITO</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-2.5 px-5 py-2.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 font-bold text-sm tracking-wide">
                    <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                    <span>DICTAMEN: NO APTO PARA CRÉDITO</span>
                  </div>
                )}
              </div>

              {/* Probability Display */}
              <div className="mt-6 mb-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                  Probabilidad estimada de cumplimiento
                </span>
                <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                  {(prediction.probabilidad_apto * 100).toFixed(2)}%
                </div>
              </div>

              {/* Interpretation text */}
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto mt-3">
                {prediction.resultado === 'APTO'
                  ? `La probabilidad estimada (${(prediction.probabilidad_apto * 100).toFixed(2)}%) se encuentra por encima del umbral operativo (50.00%). El modelo clasifica el perfil en la categoría de cumplimiento.`
                  : `La probabilidad estimada (${(prediction.probabilidad_apto * 100).toFixed(2)}%) se sitúa por debajo del umbral operativo (50.00%). El modelo clasifica el perfil en la categoría de riesgo de impago.`}
              </p>
            </div>

            {/* Compact summary of inputs */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-900 dark:text-slate-200 block mb-3 uppercase tracking-wider text-[11px]">
                Resumen de variables evaluadas
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600 dark:text-slate-300 font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block">Score Buró</span>
                  <strong className="text-slate-900 dark:text-white">{formData.score_crediticio} pts</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Monto</span>
                  <strong className="text-slate-900 dark:text-white">${formData.monto_solicitado.toLocaleString('es-CO')}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Endeudamiento</span>
                  <strong className="text-slate-900 dark:text-white">{formData.nivel_endeudamiento_pct}%</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Mora Máxima</span>
                  <strong className="text-slate-900 dark:text-white">{formData.dias_maximo_mora} días</strong>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setPrediction(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Modificar datos actuales
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Evaluar nuevo solicitante
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Imprimir informe en PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onOpenLab}
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                <span>Ver detalles en el Laboratorio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Academic disclaimer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed text-center">
              Aviso metodológico: Este sistema es un prototipo académico basado en redes neuronales entrenadas sobre una muestra experimental balanceada (50% aptos / 50% no aptos). La predicción probabilística refleja correlaciones estadísticas multivariadas y no constituye una aprobación crediticia bancaria vinculante.
            </div>
          </div>
        ) : (
          /* Multi-Step Form */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Top Toolbar */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <span className="text-[11px] font-mono font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                  Paso {currentStep} de {TOTAL_STEPS}
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {STEP_TITLES[currentStep - 1]}
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleLoadSample}
                  disabled={loadingSample}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50"
                  title="Cargar valores de demostración"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{loadingSample ? 'Cargando...' : 'Cargar Ejemplo'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Limpiar formulario"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1">
              <div 
                className="bg-blue-600 dark:bg-blue-500 h-1 transition-all duration-300"
                style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
              />
            </div>

            {/* Form Step Contents */}
            <div className="p-6 sm:p-8">
              {/* Step 1: Información Personal y Demográfica */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Información básica del solicitante</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Edad (años) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="edad"
                        step="0.1"
                        min="18"
                        max="95"
                        value={formData.edad || ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 43.9"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Estado Civil <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="estado_civil"
                        value={formData.estado_civil}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                      >
                        <option value="Single / not married">Soltero(a) / No casado</option>
                        <option value="Married">Casado(a)</option>
                        <option value="Civil marriage">Unión libre / Matrimonio civil</option>
                        <option value="Separated">Separado(a) / Divorciado</option>
                        <option value="Widow">Viudo(a)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Personas a Cargo <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="personas_a_cargo"
                        min="0"
                        max="15"
                        value={formData.personas_a_cargo}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 1"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Tipo de Vivienda <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="tipo_vivienda"
                        value={formData.tipo_vivienda}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
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
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                    <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Ingresos, obligaciones y condiciones de la solicitud</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Ingreso Mensual ($) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="ingreso_mensual"
                        step="1000"
                        min="0"
                        value={formData.ingreso_mensual || ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 202500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Obligaciones Mensuales ($)
                      </label>
                      <input
                        type="number"
                        name="obligaciones_mensuales"
                        step="100"
                        min="0"
                        value={formData.obligaciones_mensuales || ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 153454.09"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Ingreso Disponible ($) <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleAutoDisposableIncome}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Auto-calcular
                        </button>
                      </div>
                      <input
                        type="number"
                        name="ingreso_disponible"
                        step="100"
                        value={formData.ingreso_disponible || ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 13522.91"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Nivel Endeudamiento (%) <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleAutoDebtRatio}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Auto-calcular
                        </button>
                      </div>
                      <input
                        type="number"
                        name="nivel_endeudamiento_pct"
                        step="0.01"
                        min="0"
                        value={formData.nivel_endeudamiento_pct || ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 93.32"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Monto Solicitado ($) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="monto_solicitado"
                        step="1000"
                        min="1000"
                        value={formData.monto_solicitado || ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 835380"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Plazo (meses) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="plazo_meses"
                        min="1"
                        max="120"
                        value={formData.plazo_meses || ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 48"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Tasa Interés (% E.A.) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="tasa_interes_ea"
                        step="0.01"
                        min="0"
                        max="120"
                        value={formData.tasa_interes_ea || ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 49.31"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Cuota Estimada ($) <span className="text-rose-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={handleAutoInstallment}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Auto-estimar
                        </button>
                      </div>
                      <input
                        type="number"
                        name="cuota_estimada"
                        step="100"
                        min="0"
                        value={formData.cuota_estimada || ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 35523"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Historial Crediticio y Comportamiento de Pago */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                    <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Comportamiento crediticio y reportes en buró</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-900 dark:text-white">
                          Score Crediticio (0 - 1000) <span className="text-rose-500">*</span>
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
                        className="w-full px-3.5 py-2 text-base font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 585"
                      />
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                        Puntaje oficial de riesgo crediticio. Es la variable con mayor peso predictivo en el modelo.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Créditos Activos Vigentes
                      </label>
                      <input
                        type="number"
                        name="numero_creditos_activos"
                        min="0"
                        value={formData.numero_creditos_activos ?? ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 2"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Saldo Total en Deuda ($)
                      </label>
                      <input
                        type="number"
                        name="saldo_total_creditos"
                        step="1000"
                        min="0"
                        value={formData.saldo_total_creditos ?? ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 2619045"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Cuotas en Mora Actuales
                      </label>
                      <input
                        type="number"
                        name="numero_cuotas_mora"
                        min="0"
                        value={formData.numero_cuotas_mora ?? ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 0"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Días Máximos de Mora <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="dias_maximo_mora"
                        min="0"
                        value={formData.dias_maximo_mora ?? ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 0"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Pagos Oportunos (% Cumplimiento)
                      </label>
                      <input
                        type="number"
                        name="porcentaje_pagos_oportunos"
                        step="0.1"
                        min="0"
                        max="100"
                        value={formData.porcentaje_pagos_oportunos ?? ''}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 100.0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Perfil Laboral y Relación con la Entidad */}
              {currentStep === 4 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                    <Briefcase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Estabilidad laboral y relación con la institución</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Línea de Negocio <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="linea_negocio"
                        value={formData.linea_negocio}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
                      >
                        <option value="Cash loans">Crédito Libre Inversión (Cash loans)</option>
                        <option value="Revolving loans">Crédito Rotativo / Tarjeta (Revolving loans)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Tipo de Contrato / Ocupación <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="tipo_contrato"
                        value={formData.tipo_contrato}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
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
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
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
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 7.17"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
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
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 7.74"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Índice Patrimonial (0 a 10) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="patrimonio_indice"
                        min="0"
                        max="10"
                        value={formData.patrimonio_indice}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Ej. 4"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Resumen compacto antes de ejecutar inferencia */}
              {currentStep === 5 && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Revisión compacta antes de procesar la solicitud</span>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-5 border border-slate-200 dark:border-slate-700 space-y-4 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Edad / Dependientes</span>
                        <strong className="text-slate-900 dark:text-white">{formData.edad} años ({formData.personas_a_cargo} a cargo)</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Estado Civil</span>
                        <strong className="text-slate-900 dark:text-white">{formData.estado_civil}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Ingreso Mensual</span>
                        <strong className="text-slate-900 dark:text-white font-mono">${formData.ingreso_mensual.toLocaleString('es-CO')}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Monto Solicitado</span>
                        <strong className="text-slate-900 dark:text-white font-mono">${formData.monto_solicitado.toLocaleString('es-CO')}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Plazo / Cuota</span>
                        <strong className="text-slate-900 dark:text-white font-mono">{formData.plazo_meses}m (${formData.cuota_estimada.toLocaleString('es-CO')})</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Score Buró</span>
                        <strong className="text-blue-600 dark:text-blue-400 font-mono font-bold">{formData.score_crediticio} pts</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Endeudamiento</span>
                        <strong className="text-slate-900 dark:text-white font-mono">{formData.nivel_endeudamiento_pct}%</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Mora Máxima</span>
                        <strong className="text-slate-900 dark:text-white font-mono">{formData.dias_maximo_mora} días</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Contrato</span>
                        <strong className="text-slate-900 dark:text-white">{formData.tipo_contrato}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50/60 dark:bg-blue-950/40 p-4 rounded-xl border border-blue-200/80 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-300">
                    <span className="font-semibold block mb-1">Modelo de Inferencia: Ensemble Top-3 Diverso</span>
                    <p className="text-[11px] text-blue-800 dark:text-blue-400 leading-relaxed">
                      La predicción será generada promediando las salidas de 3 redes neuronales profundas entrenadas bajo semillas y activaciones heterogéneas. Umbral operativo = 50.00%.
                    </p>
                  </div>
                </div>
              )}

              {/* Bottom Nav Buttons */}
              <div className="mt-8 pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={isLoading}
                    className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                        <span>Ejecutando Inferencia...</span>
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
      <footer className="w-full max-w-4xl mx-auto px-6 py-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 no-print">
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

import React from 'react';
import { BrandLogo } from './BrandLogo';
import type { PredictionResult, ApplicantFormData } from '../types';

interface PrintReportProps {
  result: PredictionResult;
  applicant: ApplicantFormData;
}

export const PrintReport: React.FC<PrintReportProps> = ({ result, applicant }) => {
  const isApto = result.resultado === 'APTO';

  return (
    <div className="hidden print:block p-8 bg-white text-slate-900 font-sans">
      {/* Print Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6 flex justify-between items-start">
        <div className="flex items-center space-x-3">
          <BrandLogo size="md" variant="mono" />
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
              CrediRisk — Informe de Evaluación Crediticia
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Redes Neuronales Profundas para Evaluación Crediticia
            </p>
          </div>
        </div>
        <div className="text-right text-xs">
          <div><strong>Solicitud ID:</strong> #{result.id_solicitud}</div>
          <div><strong>Fecha de Emisión:</strong> {new Date().toLocaleDateString('es-CO')}</div>
          <div><strong>Motor:</strong> {result.modelo_utilizado.nombre}</div>
        </div>
      </div>

      {/* Dictamen Box */}
      <div
        className={`p-6 rounded-lg border-2 mb-6 text-center ${
          isApto
            ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
            : 'border-rose-600 bg-rose-50 text-rose-950'
        }`}
      >
        <span className="text-xs uppercase font-bold tracking-widest block mb-1">
          Dictamen Oficial de Inferencia
        </span>
        <div className="text-3xl font-black tracking-tight mb-2">
          {result.resultado === 'APTO' ? 'APTO PARA CRÉDITO' : 'NO APTO PARA CRÉDITO'}
        </div>
        <div className="text-sm font-mono font-semibold">
          Probabilidad de Cumplimiento P(APTO) = {(result.probabilidad_apto * 100).toFixed(2)}% | Umbral = 50.00%
        </div>
      </div>

      {/* Applicant Summary */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
          1. Parámetros del Solicitante Registrados
        </h2>
        <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-xs">
          <div><strong>Edad:</strong> {applicant.edad} años</div>
          <div><strong>Estado Civil:</strong> {applicant.estado_civil}</div>
          <div><strong>Personas a Cargo:</strong> {applicant.personas_a_cargo}</div>
          <div><strong>Tipo Vivienda:</strong> {applicant.tipo_vivienda}</div>
          <div><strong>Ingreso Mensual:</strong> ${applicant.ingreso_mensual?.toLocaleString('es-CO')}</div>
          <div><strong>Obligaciones:</strong> ${applicant.obligaciones_mensuales?.toLocaleString('es-CO')}</div>
          <div><strong>Ingreso Disponible:</strong> ${applicant.ingreso_disponible?.toLocaleString('es-CO')}</div>
          <div><strong>Monto Solicitado:</strong> ${applicant.monto_solicitado?.toLocaleString('es-CO')}</div>
          <div><strong>Plazo:</strong> {applicant.plazo_meses} meses</div>
          <div><strong>Cuota Estimada:</strong> ${applicant.cuota_estimada?.toLocaleString('es-CO')}</div>
          <div><strong>Tasa EA:</strong> {applicant.tasa_interes_ea}%</div>
          <div><strong>Endeudamiento:</strong> {applicant.nivel_endeudamiento_pct}%</div>
          <div><strong>Score Crediticio:</strong> {applicant.score_crediticio} pts</div>
          <div><strong>Créditos Activos:</strong> {applicant.numero_creditos_activos}</div>
          <div><strong>Saldo Deuda Total:</strong> ${applicant.saldo_total_creditos?.toLocaleString('es-CO')}</div>
          <div><strong>Días Máx Mora:</strong> {applicant.dias_maximo_mora} días</div>
          <div><strong>Pagos Oportunos:</strong> {applicant.porcentaje_pagos_oportunos}%</div>
          <div><strong>Antigüedad Laboral:</strong> {applicant.antiguedad_laboral_anios} años</div>
          <div><strong>Antigüedad Cliente:</strong> {applicant.antiguedad_cliente_anios} años</div>
          <div><strong>Línea Negocio:</strong> {applicant.linea_negocio}</div>
          <div><strong>Tipo Contrato:</strong> {applicant.tipo_contrato}</div>
        </div>
      </div>

      {/* Factores Identificados */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
          2. Factores Determinantes de Riesgo
        </h2>
        <div className="space-y-2 text-xs">
          {result.factores_relevantes.map((f, i) => (
            <div key={i} className="flex justify-between border-b border-slate-100 pb-1">
              <div>
                <strong>{f.variable}:</strong> {f.detalle}
              </div>
              <div className="font-mono text-slate-600 font-semibold">{f.valor}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer and Signature */}
      <div className="border-t border-slate-300 pt-4 mt-8 text-xs text-slate-600 space-y-4">
        <div>
          <strong>Aviso Metodológico y Académico:</strong> {result.disclaimer_academico}
        </div>
        <div className="flex justify-between items-end pt-12">
          <div className="text-center w-64 border-t border-slate-400 pt-2">
            Firma del Analista de Crédito
          </div>
          <div className="text-center w-64 border-t border-slate-400 pt-2">
            Validación de Riesgos AI
          </div>
        </div>
      </div>
    </div>
  );
};

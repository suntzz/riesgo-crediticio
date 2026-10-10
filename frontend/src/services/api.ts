import type { ApplicantFormData, HealthStatus, PredictionResult, SystemMetrics } from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) {
    throw new Error(`Error ${res.status}: No se pudo verificar la salud del backend`);
  }
  return res.json();
}

export async function fetchSampleApplicant(): Promise<ApplicantFormData> {
  const res = await fetch(`${API_BASE}/sample`);
  if (!res.ok) {
    throw new Error(`Error ${res.status}: No se pudo cargar el solicitante de prueba`);
  }
  return res.json();
}

export async function fetchMetrics(): Promise<SystemMetrics> {
  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) {
    throw new Error(`Error ${res.status}: No se pudieron cargar las métricas`);
  }
  return res.json();
}

export async function predictApplicant(data: ApplicantFormData): Promise<PredictionResult> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Error ${res.status} al procesar la solicitud`);
  }

  return res.json();
}

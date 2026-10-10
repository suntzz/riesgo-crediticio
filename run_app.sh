#!/bin/bash
# Script de inicio para CrediRisk AI Deep Learning Platform
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "================================================================="
echo " CrediRisk AI — Sistema de Evaluación de Riesgo Crediticio"
echo " Deep Learning & Ensemble Top-3 Diverso"
echo "================================================================="
echo "1. Verificando inmutabilidad del dataset original..."
shasum -a 256 DatasetCreditoFinancieroFinalV2.csv

echo ""
echo "2. Iniciando servidor FastAPI con frontend integrado..."
echo "   -> Interfaz Web:        http://localhost:8000"
echo "   -> Documentación API:   http://localhost:8000/docs"
echo "   -> Health Check:        http://localhost:8000/api/health"
echo "================================================================="
exec .venv/bin/uvicorn src.api:app --host 0.0.0.0 --port 8000

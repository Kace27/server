#!/bin/bash

# Matar procesos anteriores en los puertos 3000 y 8080 si existen
echo "Limpiando puertos 3000 y 8080..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:8080 | xargs kill -9 2>/dev/null

echo "Iniciando Backend API (Puerto 3000)..."
(cd backend-api && npm run dev) &
BACKEND_PID=$!

echo "Iniciando Frontend estático (Puerto 8080)..."
(cd frontend && python3 -m http.server 8080) &
FRONTEND_PID=$!

echo ""
echo "==========================================================="
echo "✅ Entorno local iniciado con conexión a Supabase (Opción A)."
echo "👉 Abre tu navegador en: http://localhost:8080/?local=true"
echo "==========================================================="
echo "Presiona Ctrl+C para detener ambos servidores."

# Atrapar la señal de salida para matar ambos procesos al salir
trap "echo 'Deteniendo servidores...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM EXIT

# Esperar a que los procesos terminen
wait $BACKEND_PID $FRONTEND_PID

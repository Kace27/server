#!/bin/bash

# Port to use
PORT=3000

echo "🚀 Iniciando servidor de pruebas..."
# Run the node app in the background and save its PID
NODE_ENV=development PORT=$PORT npx ts-node src/app.ts > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 4

# Print log to see what happened
cat server.log

echo -e "\n1. 🔍 Probando Health Check..."
curl -s http://localhost:$PORT/health
echo ""

echo -e "\n2. 🔑 Probando Login de Administrador..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:$PORT/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin12345"}')

echo "Respuesta de Login: $LOGIN_RESPONSE"

# Extract token using simple grep/sed since we might not have jq
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
  echo "⚠️  No se pudo obtener el token JWT. Abortando pruebas protegidas."
else
  echo "✅ Token extraído con éxito."

  echo -e "\n3. 🔄 Probando actualización de Rankings (Cron protegido)..."
  curl -s -X POST http://localhost:$PORT/api/admin/cron/refresh-ranking \
    -H "Authorization: Bearer $TOKEN"
  echo ""
fi

echo -e "\n4. 🏆 Probando obtención de Rankings (Público)..."
curl -s http://localhost:$PORT/api/ranking
echo ""

# Stop the server
echo -e "\n🛑 Deteniendo servidor de pruebas (PID $SERVER_PID)..."
kill $SERVER_PID
wait $SERVER_PID 2>/dev/null
echo "Done!"

#!/bin/bash

# dev_all.sh - Start Backend and Frontend concurrently, ensuring ports are free

echo "Checking port 3000 (Backend)..."
PID=$(lsof -t -i:3000) || true
if [ ! -z "$PID" ]; then
    echo "Killing occupying process on 3000: $PID"
    kill -9 $PID
fi

echo "Starting Backend..."
cd backend
npm run start:dev &
BACKEND_PID=$!
cd ..

echo "Waiting for Backend (/health)..."
for i in {1..30}; do
    if curl -s http://localhost:3000/health | grep -q 'ok'; then
        echo "Backend is HEALTHY."
        break
    fi
    sleep 2
done

echo "Starting Frontend..."
npm run dev &
FRONTEND_PID=$!

echo "---"
echo "Backend running (PID: $BACKEND_PID)"
echo "Frontend running (PID: $FRONTEND_PID)"
echo "Press Ctrl+C to stop both."
echo "---"

# Wait for Ctrl+C
trap "echo 'Terminating servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM
wait

#!/bin/bash
# scripts/dev_all.sh

# Function to kill child processes on exit
cleanup() {
    echo "Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

echo "Starting Support Smiles in FULL DEV MODE..."

# Start Backend
echo "1. Starting Backend (Port 3000)..."
cd backend
npm run start:dev &
BACKEND_PID=$!
cd ..

# Wait for backend to be somewhat ready
sleep 5

# Start Frontend
echo "2. Starting Frontend..."
npm run dev &
FRONTEND_PID=$!

# Wait for both
wait $BACKEND_PID $FRONTEND_PID

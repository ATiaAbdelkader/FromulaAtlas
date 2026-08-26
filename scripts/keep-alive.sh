#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting server..."
  HOSTNAME=0.0.0.0 PORT=3000 node .next/standalone/server.js &
  SERVER_PID=$!
  echo "[$(date)] Server PID: $SERVER_PID"
  
  # Wait for it to be ready
  sleep 3
  
  # Health check loop — restart if dead
  while kill -0 $SERVER_PID 2>/dev/null; do
    sleep 5
    if ! curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
      echo "[$(date)] Server not responding, killing..."
      kill $SERVER_PID 2>/dev/null
      break
    fi
  done
  
  echo "[$(date)] Server died, restarting in 3s..."
  sleep 3
done

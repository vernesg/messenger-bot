#!/bin/bash
echo "Starting Messenger bot..."
while true; do
  node index.js
  echo "Bot crashed. Restarting in 5 seconds..."
  sleep 5
done

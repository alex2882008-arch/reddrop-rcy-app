#!/usr/bin/env bash
set -euo pipefail

echo "Stopping any existing zenoh-router..."
sudo docker rm -f zenoh-router 2>/dev/null || true

echo "Starting Zenoh router..."
sudo docker run -d \
  --name zenoh-router \
  --restart unless-stopped \
  -p 7447:7447/tcp \
  -p 8000:8000/tcp \
  eclipse/zenoh:latest

echo "Done. Verify:"
echo "  sudo docker ps | grep zenoh-router"
echo "  curl -s http://localhost:8000/@/router/local"
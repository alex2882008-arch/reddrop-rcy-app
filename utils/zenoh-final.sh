#!/usr/bin/env bash
set -euo pipefail

echo "Cleaning up..."
sudo docker rm -f zenoh-router 2>/dev/null || true

echo "Starting Zenoh router with REST plugin enabled via plugins loading..."
sudo docker run -d \
  --name zenoh-router \
  --restart unless-stopped \
  -p 7447:7447/tcp \
  -p 8000:8000/tcp \
  eclipse/zenoh:latest \
  -l /rest/plugin=http_port=8000

echo "Waiting..."
sleep 10

echo "Container status:"
sudo docker ps | grep zenoh-router

echo "Logs:"
sudo docker logs zenoh-router --tail 12

echo ""
echo "Testing REST API endpoint..."
curl -s --max-time 8 http://127.0.0.1:8000/ || echo "Port 8000 not ready yet"
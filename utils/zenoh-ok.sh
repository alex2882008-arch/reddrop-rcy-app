#!/usr/bin/env bash
set -euo pipefail

echo "Cleaning up..."
sudo docker rm -f zenoh-router 2>/dev/null || true

echo "Starting Zenoh router with REST plugin via --rest-http-port..."
sudo docker run -d \
  --name zenoh-router \
  --restart unless-stopped \
  -p 7447:7447/tcp \
  -p 8000:8000/tcp \
  eclipse/zenoh:latest \
  --rest-http-port 8000

echo "Waiting for startup..."
sleep 10

echo "Container:"
sudo docker ps | grep zenoh-router

echo "Logs:"
sudo docker logs zenoh-router --tail 10

echo ""
echo "Testing REST API..."
curl -s --max-time 8 http://127.0.0.1:8000/ && echo " SUCCESS on 8000" || echo "FAILED on 8000"
curl -s --max-time 8 http://127.0.0.1:7447/ && echo " SUCCESS on 7447" || echo "FAILED on 7447"
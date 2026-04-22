#!/usr/bin/env bash
set -euo pipefail

echo "Stopping any existing zenoh-router..."
sudo docker rm -f zenoh-router 2>/dev/null || true

echo "Creating config with REST plugin..."
cat <<'EOF' | sudo tee /opt/zenoh-config.json5
{
  plugins: {
    rest: {
      http_port: 8000,
      restake_dir: "/tmp/zenoh-admin"
    }
  }
}
EOF

echo "Starting Zenoh router with REST plugin..."
sudo docker run -d \
  --name zenoh-router \
  --restart unless-stopped \
  -p 7447:7447/tcp \
  -p 8000:8000/tcp \
  -v /opt/zenoh-config.json5:/cfg/router.json5:ro \
  eclipse/zenoh:latest \
  /cfg/router.json5

echo "Waiting for startup..."
sleep 8

echo "Checking logs..."
sudo docker logs zenoh-router --tail 8

echo ""
echo "Testing endpoints..."
echo "Port 8000:" && curl -s --max-time 5 http://127.0.0.1:8000/ || echo "Port 8000 not responding"
echo "Port 7447:" && curl -s --max-time 5 http://127.0.0.1:7447/ || echo "Port 7447 not responding"
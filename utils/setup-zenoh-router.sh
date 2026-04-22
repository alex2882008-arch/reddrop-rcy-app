#!/usr/bin/env bash
set -euo pipefail

echo "[1/5] Installing Docker (if missing)..."
if ! command -v docker >/dev/null 2>&1; then
  sudo apt-get update
  sudo apt-get install -y ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

echo "[2/5] Enabling Docker service..."
sudo systemctl enable docker
sudo systemctl restart docker

echo "[3/5] Writing Zenoh router config with REST plugin..."
cat <<'EOF' | sudo tee /opt/zenoh-router.json5 >/dev/null
{
  plugins: {
    rest: {
      http_port: 8000
    }
  }
}
EOF

echo "[4/5] Starting Zenoh router container..."
sudo docker rm -f zenoh-router >/dev/null 2>&1 || true
sudo docker run -d \
  --name zenoh-router \
  --restart unless-stopped \
  -p 7447:7447/tcp \
  -p 8000:8000/tcp \
  -v /opt/zenoh-router.json5:/etc/zenoh/router.json5:ro \
  eclipse/zenoh:latest \
  zenohd -c /etc/zenoh/router.json5

echo "[5/5] Done. Verify router status with:"
echo "  sudo docker ps | grep zenoh-router"
echo "  curl -i http://127.0.0.1:8000/@/router/local"

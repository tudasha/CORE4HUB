#!/usr/bin/env bash
set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}"
echo "  ███████╗███╗   ███╗ █████╗ ██████╗ ████████╗██╗  ██╗██╗   ██╗██████╗ "
echo "  ██╔════╝████╗ ████║██╔══██╗██╔══██╗╚══██╔══╝██║  ██║██║   ██║██╔══██╗"
echo "  ███████╗██╔████╔██║███████║██████╔╝   ██║   ███████║██║   ██║██████╔╝"
echo "  ╚════██║██║╚██╔╝██║██╔══██║██╔══██╗   ██║   ██╔══██║██║   ██║██╔══██╗"
echo "  ███████║██║ ╚═╝ ██║██║  ██║██║  ██║   ██║   ██║  ██║╚██████╔╝██████╔╝"
echo "  ╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ "
echo -e "${NC}"
echo -e "${GREEN}🏠 Smart Environment Hub — Local Dev Starter${NC}"
echo ""

# ── Check Dependencies ─────────────────────────────────────
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not found. Please install Docker Desktop."; exit 1; }
command -v node   >/dev/null 2>&1 || { echo "❌ Node.js not found. Please install Node.js 20+."; exit 1; }

# ── Clean up stray processes ───────────────────────────────
echo -e "${YELLOW}🧹 Cleaning up stray processes on ports...${NC}"
kill -9 $(lsof -t -i:3000) 2>/dev/null || true
kill -9 $(lsof -t -i:5173) 2>/dev/null || true

# ── Copy .env files if missing ─────────────────────────────
if [ ! -f hub-backend/.env ]; then
  echo -e "${YELLOW}⚙️  Creating hub-backend/.env from template...${NC}"
  cp hub-backend/.env.example hub-backend/.env
fi

if [ ! -f hub-frontend/.env ]; then
  echo -e "${YELLOW}⚙️  Creating hub-frontend/.env from template...${NC}"
  cp hub-frontend/.env.example hub-frontend/.env
fi

# ── Install dependencies ───────────────────────────────────
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd hub-backend && npm install --silent && cd ..

echo -e "${BLUE}📦 Installing frontend dependencies...${NC}"
cd hub-frontend && npm install --silent && cd ..

# ── Start Docker services (PostgreSQL) ────────────────────
echo -e "${BLUE}🐳 Starting Docker services (PostgreSQL)...${NC}"
sudo docker compose up -d hub-db
echo -e "${GREEN}✅ PostgreSQL running on port 5435${NC}"
sleep 2

# ── Start Backend ──────────────────────────────────────────
echo -e "${BLUE}🚀 Starting backend API server...${NC}"
(cd hub-backend && node index.js) &
BACKEND_PID=$!
sleep 2
echo -e "${GREEN}✅ Backend running at http://localhost:3000${NC}"

# ── Start Frontend ─────────────────────────────────────────
echo -e "${BLUE}⚡ Starting Vite frontend...${NC}"
(cd hub-frontend && npm run dev) &
FRONTEND_PID=$!
sleep 2
echo ""
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo -e "${GREEN} ✅ Smart Hub is running!${NC}"
echo -e "${GREEN}   Frontend: http://localhost:5173${NC}"
echo -e "${GREEN}   Backend:  http://localhost:3000${NC}"
echo -e "${GREEN}   Database: localhost:5435${NC}"
echo -e "${GREEN}══════════════════════════════════════════════${NC}"
echo ""
echo "Press Ctrl+C to stop all services."

cleanup() {
  echo -e "\n${YELLOW}🛑 Shutting down...${NC}"
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  sudo docker compose stop hub-db 2>/dev/null
  echo -e "${GREEN}✅ All services stopped.${NC}"
}

trap cleanup SIGINT SIGTERM
wait $FRONTEND_PID

# Smart Environment Hub

## Project Structure
```
PoliHack-v19/
├── hub-frontend/         # React + Vite + Tailwind + Capacitor
├── hub-backend/          # Node.js + Express + PostgreSQL + WebSocket
├── docker-compose.yml    # PostgreSQL container
├── start.sh              # Local dev launcher
└── .github/workflows/    # Android APK build CI/CD
```

## Quick Start

```bash
chmod +x start.sh
./start.sh
```

Open `http://localhost:5173` in your browser.

## Environment Variables

Copy and fill in values:
```bash
cp hub-backend/.env.example hub-backend/.env
cp hub-frontend/.env.example hub-frontend/.env
```

## GitHub Actions – Android APK

Set these secrets in your GitHub repo settings:
- `VITE_API_URL` – your Render backend URL (e.g. `https://smarthub-api.onrender.com`)
- `VITE_WS_URL`  – WebSocket URL (e.g. `wss://smarthub-api.onrender.com`)
- `VITE_GEMINI_API_KEY` – your Gemini API key

Push to `main`/`master` → APK is built and uploaded as a GitHub Actions artifact.  
Create a git tag (`v1.0.0`) → APK is also published as a GitHub Release.

## Render Deployment

### Backend
- **Runtime:** Node
- **Root Directory:** `hub-backend`
- **Build Command:** `npm install`
- **Start Command:** `node index.js`
- **Env:** Add `DATABASE_URL` from Render's PostgreSQL + `NODE_ENV=production`

### Frontend (optional static site)
- **Root Directory:** `hub-frontend`
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`

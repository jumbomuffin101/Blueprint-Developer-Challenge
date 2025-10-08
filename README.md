# Blueprint Crypto Challenge

Full-stack RSA encryption/decryption service with searchable logs.

## 🧩 Project Overview
SecureLog’s modernized encryption service built with:
- **React + Vite + TypeScript**
- **FastAPI + SQLAlchemy + PostgreSQL**
- **Docker Compose** for full-stack orchestration
- **GitHub Actions** for linting both frontend and backend

## 🖥️ Features
- Encrypt / decrypt messages using RSA keys
- View paginated logs of all requests
- Clear logs instantly
- Neon green cyber-themed UI

## ⚙️ Setup

### Prerequisites
- Docker Desktop
- Node.js 20+ (for local web dev)

### Local Development
```bash
# Backend
cd server
python -m venv .venv && .\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
# Web
cd ../web
npm install
npm run dev

┌──────────────┐ HTTP/JSON ┌──────────────┐ SQL ┌──────────────┐
│ React (Vite)│ ─────────────────────▶ │ FastAPI │ ───────────────▶ │ PostgreSQL │
│ Frontend │ ◀───────────────────── │ Backend │ ◀────────────── │ (Logs DB) │
└──────────────┘ └──────────────┘ └──────────────┘
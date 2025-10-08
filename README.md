# 🔐 Blueprint Crypto Challenge

A full-stack RSA encryption and decryption service with searchable, persistent logs — built for SecureLog’s Developer Challenge.

Live Demo: [https://blueprint-crypto.netlify.app](https://blueprint-crypto.netlify.app)

---

## 🧩 Overview

**Blueprint Crypto** is a modernized encryption platform built using:

- ⚛️ **React + Vite + TypeScript** (frontend)
- ⚙️ **Node.js (Netlify Functions)** backend using native **crypto**
- 🗄️ **PostgreSQL** (Neon Cloud) for logs
- 🐳 **Docker Compose** for local orchestration
- 🤖 **GitHub Actions (Ruff + ESLint)** for automated lint checks

The app allows users to:
- Encrypt data using an RSA **public key**
- Decrypt ciphertext using the corresponding **private key**
- View, paginate, and clear request logs stored in PostgreSQL
- See real-time API health status
- Enjoy a neon green cyber-styled UI

---

☁️ Production (Netlify + Neon)
Variable	Example Value	Purpose
DATABASE_URL	postgresql://...neon.tech/neondb?sslmode=require	Postgres connection
VITE_API_BASE	/.netlify/functions/api	Frontend → Functions proxy
NODE_VERSION	20	build env consistency

Deployed URLs:

Frontend: https://blueprint-crypto.netlify.app

API (Functions): /api/v1/*

Database: Neon-hosted PostgreSQL

⚙️ Local Development
Prerequisites

Docker Desktop

Node.js 20+

Python 3.12+ (for key generation tests)

1️⃣ Run locally with Docker
# from project root
docker compose up --build


React app → http://localhost:5173

FastAPI (or Netlify-style API dev server) → http://localhost:8000

PostgreSQL DB → localhost:5432

2️⃣ Run frontend manually
cd web
npm install
npm run dev

3️⃣ Backend (FastAPI/Netlify local emulation)
cd server
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

🧱 Repository Structure
📦 blueprint-crypto
├── .github/
│   └── workflows/
│       ├── web-lint.yml
│       └── server-lint.yml
├── server/
│   ├── app/
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── web/
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── netlify/functions/api.mjs
├── docker-compose.yml
└── README.md

✅ GitHub Actions (Linting)

web-lint.yml → runs ESLint on the React app

server-lint.yml → runs Ruff on the backend

Both triggered automatically on every push or PR

Author: Aryan Rawat
Institution: Stevens Institute of Technology
Submission: Blueprint Developer Challenge 2025

Architecture Diagram:
                          ┌──────────────────────────────────────────────┐
                          │         🖥️ FRONTEND (React + Vite + TS)       │
                          │----------------------------------------------│
                          │  • Encrypt Form (RSA Public Key Input)       │
                          │  • Decrypt Form (RSA Private Key Input)      │
                          │  • Logs Viewer (Paginated Request Logs)      │
                          │                                              │
                          │  Hosted on Netlify (Vite build output)       │
                          └───────────────┬──────────────────────────────┘
                                          │
                                          │ HTTPS (via Netlify Functions proxy)
                                          ▼
        ┌───────────────────────────────────────────────────────────────────────────┐
        │         ☁️ BACKEND (Serverless Node.js — netlify/functions/api.mjs)        │
        │---------------------------------------------------------------------------│
        │  • POST /api/v1/encrypt   → Encrypt payload w/ Public Key                 │
        │  • POST /api/v1/decrypt   → Decrypt ciphertext w/ Private Key             │
        │  • GET  /api/v1/logs      → Paginate and fetch log history                │
        │  • DELETE /api/v1/logs    → Clear logs                                    │
        │                                                                   🔐      │
        │  Uses Node’s native crypto (RSA-OAEP/SHA-256)                             │
        │  Connected via env vars: DATABASE_URL, VITE_API_BASE, NODE_VERSION        │
        └──────────────────────┬────────────────────────────────────────────────────┘
                               │
                               │ SQL (TLS)
                               ▼
                  ┌─────────────────────────────────────────────┐
                  │     🗄️ DATABASE (PostgreSQL via Neon Cloud)  │
                  │---------------------------------------------│
                  │  • Table: logs                              │
                  │      - id (UUID, PK)                        │
                  │      - timestamp (UNIX)                     │
                  │      - ip                                   │
                  │      - data (event summary)                 │
                  │---------------------------------------------│
                  │  Persistent, searchable request history     │
                  │  Accessed via pg driver from serverless API │
                  └─────────────────────────────────────────────┘
                               ▲
                               │
        ┌──────────────────────┴──────────────────────────────────────┐
        │         🧱 LOCAL / DEV ENV (Docker Compose)                 │
        │-------------------------------------------------------------│
        │  • web: React Dev Server → http://localhost:5173            │
        │  • api: FastAPI/Netlify local dev → http://localhost:8000   │
        │  • db: PostgreSQL → localhost:5432                          │
        │-------------------------------------------------------------│
        │  Shared Docker network & volume for persistence             │
        └─────────────────────────────────────────────────────────────┘
                               ▲
                               │ CI/CD Pipeline (GitHub Actions)
                               │
        ┌─────────────────────────────────────────────────────────────┐
        │     ⚙️ AUTOMATION (GitHub Actions)                          │
        │-------------------------------------------------------------│
        │  • web-lint.yml   → ESLint checks (frontend)                │
        │  • server-lint.yml → Ruff checks (backend)                  │
        │  • Trigger: on push or PR                                   │
        └─────────────────────────────────────────────────────────────┘

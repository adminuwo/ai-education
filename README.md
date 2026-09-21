# AI Education (Convee Education)

> **Unified Enterprise Digital Campus & AI Collaboration Operating System**  
> Tailored for K-12 Schools, Engineering & Higher Education Colleges, and National Law Universities.

---

## 📖 Documentation

Detailed architecture specifications, functional modules, REST API reference, data models, and CASA security compliance are documented in the **[`documentation/`](./documentation/)** directory:

👉 **[Master Documentation Hub (documentation/README.md)](./documentation/README.md)**  
👉 **[Full Consolidated Architecture (DOCUMENTATION.md)](./DOCUMENTATION.md)**

---

## ⚡ Quick Reference Matrix

| Component | Tech Stack | Local URL | Port |
| :--- | :--- | :--- | :--- |
| **Backend REST & Sockets API** | Node.js 20, Express, Prisma ORM | `http://localhost:8001/api/v1` | `8001` |
| **Interactive API Documentation** | Swagger OpenAPI 3.0 | `http://localhost:8001/api/docs` | `8001` |
| **LLM Bridge AI Microservice** | Python 3.11, FastAPI, Google Vertex AI | `http://localhost:8002/health` | `8002` |
| **Frontend Web App** | React 19, Tailwind CSS, Lucide Icons | `http://localhost:3000` | `3000` |
| **Mobile App (Android / iOS)** | React Native (Expo SDK 52) / Flutter | `http://localhost:8081` | `8081` |
| **Live Cloud Run Deployment** | GCP Asia-South1 Managed Containers | [Production Web Portal](https://convee-education-977864306871.asia-south1.run.app) | `443` |

---

## 📂 Project Directory Structure

```
AI - Education/
├── backend/                     # Node.js 20 + Express + Prisma (PostgreSQL) REST & Socket.IO API
│   ├── prisma/                  # Prisma schema (36 relational models) & migrations
│   ├── scripts/                 # Automated test suites, security crash audits & seed fixtures
│   └── src/
│       ├── routes/              # 21 REST API route controllers
│       ├── services/            # Tally XML sync, GCS storage, LLM quiz generator, Guardrails
│       ├── sockets/             # Real-time WebSockets event handlers
│       └── middleware/          # CASA audit logging (logsCreator), auth rate limiters, RBAC guards
├── frontend/                    # React 19 + Tailwind CSS desktop & responsive web dashboard
│   └── src/pages/               # 28 role-tailored pages (Admin, Accountant, Teacher, Student, Parent, etc.)
├── llm_bridge/                  # Python 3.11 FastAPI proxy to Google Cloud Vertex AI & OpenAI
├── mobile/                      # React Native (Expo SDK 52) cross-platform mobile application
├── mobile-flutter/              # Alternative Flutter client implementation
├── Dockerfile                   # Unified full-stack single-container deployment
├── docker-compose.yml           # Local multi-container development environment
├── deploy-cloudrun.ps1          # 1-Click GCP Cloud Run automated deployment script (PowerShell)
├── deploy-cloudrun.sh           # 1-Click GCP Cloud Run automated deployment script (Bash)
├── COMMANDS.md                  # Comprehensive build, run, and test cheat-sheet
├── DOCUMENTATION.md             # Complete enterprise architecture & technical documentation
├── GCP_DEPLOYMENT_GUIDE.md      # Google Cloud Run deployment & infrastructure runbook
└── CREDENTIALS_THREE_INSTITUTIONS.txt # Pre-seeded institutional accounts & credentials
```

---

## 🚀 Running the Platform

### Option 1: Interactive PowerShell Launcher (Windows)
```powershell
.\run.ps1
```

### Option 2: Quick Start Commands
```powershell
# 1. Start PostgreSQL (Docker)
docker compose up -d postgres

# 2. Start Backend API
cd backend
npm install
npx prisma db push
npm run dev

# 3. Start LLM Bridge Microservice
cd ../llm_bridge
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload

# 4. Start Web Dashboard
cd ../frontend
npm install
npm start
```

For complete command references and shortcuts, check **[COMMANDS.md](./COMMANDS.md)**.

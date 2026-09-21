# 💻 Convee Education — Development & Testing Guide

This guide details instructions for setting up, developing, testing, and verifying the Convee Education codebase locally.

---

## 1. Prerequisites

Ensure your development workstation has the following tools installed:
- **Node.js**: v20.x or higher (`node -v`)
- **Python**: v3.11.x or higher (`python --version`)
- **Docker & Docker Compose**: For running local PostgreSQL and test containers
- **PowerShell** (Windows) or **Bash** (Linux/macOS)
- **Git**

---

## 2. Interactive Setup via `run.ps1` (Windows)

The root directory provides a helper script `run.ps1` for local workflows:

```powershell
# Launch interactive menu
.\run.ps1

# Direct execution shortcuts
.\run.ps1 backend-dev    # Runs Backend API on :8001 with hot-reload
.\run.ps1 bridge-dev     # Runs LLM Bridge on :8002 with hot-reload
.\run.ps1 frontend-dev   # Runs React Web App on :3000
.\run.ps1 mobile-dev     # Runs Expo Mobile server on :8081
.\run.ps1 build-all      # Compiles Backend and Frontend builds
.\run.ps1 test-all       # Runs complete functional and security tests
```

---

## 3. Manual Step-by-Step Local Setup

### Step 1: Start PostgreSQL
```powershell
docker compose up -d postgres
```

### Step 2: Configure & Start Backend
```powershell
cd backend
npm install

# Push Prisma schema to PostgreSQL and generate client types
npx prisma db push
npx prisma generate

# Seed initial demo institutions and users
npm run seed

# Start development server (ts-node-dev hot reload)
npm run dev
```
Backend will be live at `http://localhost:8001` (API docs at `http://localhost:8001/api/docs`).

### Step 3: Configure & Start LLM Bridge
```powershell
cd ../llm_bridge
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```
Health check endpoint: `http://localhost:8002/health`.

### Step 4: Configure & Start Web Frontend
```powershell
cd ../frontend
npm install
npm start
```
Web dashboard opens automatically at `http://localhost:3000`.

### Step 5: Start Mobile App (Optional)
```powershell
cd ../mobile
npm install
npx expo start
```
Press `a` for Android emulator, `w` for Web preview, or scan the QR code with Expo Go.

---

## 4. Automated Testing Suites

The `/backend/scripts` directory houses comprehensive automated test suites:

```powershell
cd backend

# 1. Complete Functional Test Suite
# Tests Auth, Organizations, Tasks, Channels, Exams, Fees, and Timetables
npm test

# 2. Security, Privacy & Crash Guard Suite
# Tests RBAC authorization boundaries, BOLA/IDOR constraints, and rate limiting
npm run test:security

# 3. CASA Logger & Sensitive Data Redaction Test
# Verifies that passwords, tokens, and PII are redacted from logs
npm run test:logger

# 4. Sequential Execution of All Test Suites
npm run test:all
```

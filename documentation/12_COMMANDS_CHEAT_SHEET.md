# ⚡ Convee Education — Commands Cheat-Sheet

Quick copy-paste command references for development, testing, building, and deploying every component.

---

## 1. Quick Start Local Workflows

```powershell
# Interactive Windows launcher
.\run.ps1

# Backend Development (Port 8001)
cd backend
npm install
npx prisma db push
npx prisma generate
npm run dev

# LLM Bridge Microservice (Port 8002)
cd ../llm_bridge
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload

# Web Frontend (Port 3000)
cd ../frontend
npm install
npm start

# Mobile App (Expo on Port 8081)
cd ../mobile
npm install
npx expo start
```

---

## 2. Testing & Quality Assurance

```powershell
cd backend

# Run functional test suite
npm test

# Run security, privacy, and crash tests
npm run test:security

# Run CASA logger sanitization audit
npm run test:logger

# Run all test suites
npm run test:all
```

---

## 3. Database Management (Prisma)

```powershell
cd backend

# Push schema changes to database
npx prisma db push

# Generate Prisma client library
npx prisma generate

# Open visual database browser (Prisma Studio)
npx prisma studio

# Seed database with demo institutions
npm run seed
```

---

## 4. Cloud Build & Deployment

```powershell
# 1-Click GCP Cloud Run Deployment (Windows PowerShell)
.\deploy-cloudrun.ps1

# 1-Click GCP Cloud Run Deployment (Linux / macOS Bash)
./deploy-cloudrun.sh

# Build standalone Android APK for Firebase Distribution
cd mobile
npx eas-cli build --platform android --profile preview

# Build iOS Simulator Package for Appetize.io web testing
npx eas-cli build --platform ios --profile preview
```

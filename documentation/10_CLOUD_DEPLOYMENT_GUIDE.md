# ☁️ Convee Education — Cloud Deployment & Production Operations

This runbook describes deploying Convee Education to **Google Cloud Run (GCP)** in the `asia-south1` (Mumbai) region.

---

## 1. Production Architecture Overview

The system runs as three scalable, serverless microservices connected to managed Google Cloud infrastructure:

```
                  ┌────────────────────────┐
                  │    End User Traffic    │
                  └───────────┬────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼ (HTTPS)                       ▼ (API / WebSockets)
    ┌──────────────────────┐        ┌──────────────────────┐
    │ ai-education-frontend│        │ ai-education-backend │
    │    (React + Nginx)   │        │   (Node + Express)   │
    └──────────────────────┘        └─────────┬────────────┘
                                              │
                      ┌───────────────────────┼───────────────────────┐
                      ▼                       ▼                       ▼
             ┌─────────────────────┐ ┌─────────────────┐     ┌─────────────────┐
             │ai-education-llm-brid│ │ Cloud SQL (PG)  │     │ Cloud Storage   │
             │  (FastAPI+Vertex)   │ │   (Database)    │     │  (GCS Bucket)   │
             └─────────────────────┘ └─────────────────┘     └─────────────────┘
```

| Service Name | Container Stack | Port | Purpose |
| :--- | :--- | :--- | :--- |
| **`ai-education-frontend`** | React 19, Nginx Alpine | `80` | Static asset hosting, Gzip compression, client-side SPA routing |
| **`ai-education-backend`** | Node 20, Express, Prisma | `8001` | Core REST API, Socket.IO gateway, database operations |
| **`ai-education-llm-bridge`**| Python 3.11, FastAPI, Uvicorn | `8002` | Vertex AI Gemini 2.5 Flash proxy using ADC service account |

---

## 2. Automated 1-Click Deployment Scripts

The platform includes automated deployment scripts that handle GCP API enablement, IAM role configuration, container builds, and deployment in topological order:

### For Windows (PowerShell):
```powershell
.\deploy-cloudrun.ps1
```

### For Linux / macOS (Bash):
```bash
chmod +x deploy-cloudrun.sh
./deploy-cloudrun.sh
```

---

## 3. Manual Step-by-Step GCP Deployment

### Step 1: Set Project & Enable Required APIs
```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="asia-south1"
gcloud config set project $PROJECT_ID

gcloud services enable \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com \
    aiplatform.googleapis.com \
    storage.googleapis.com \
    secretmanager.googleapis.com \
    sqladmin.googleapis.com
```

### Step 2: Create Artifact Registry Repository
```bash
gcloud artifacts repositories create convee-docker-repo \
    --repository-format=docker \
    --location=$REGION \
    --description="Convee Platform Docker Repository"
```

### Step 3: Create Google Cloud Storage Bucket
```bash
export GCS_BUCKET="convee-objects-${PROJECT_ID}"
gsutil mb -p $PROJECT_ID -l $REGION gs://${GCS_BUCKET}
```

### Step 4: Deploy LLM Bridge Microservice
```bash
cd llm_bridge
gcloud builds submit --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/convee-docker-repo/llm-bridge:latest .

gcloud run deploy ai-education-llm-bridge \
    --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/convee-docker-repo/llm-bridge:latest \
    --region $REGION \
    --platform managed \
    --set-env-vars VERTEX_PROJECT_ID=$PROJECT_ID,VERTEX_LOCATION=$REGION,VERTEX_GEMINI_MODEL=gemini-2.5-flash \
    --allow-unauthenticated
```

### Step 5: Deploy Backend API
```bash
cd ../backend
gcloud builds submit --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/convee-docker-repo/backend:latest .

gcloud run deploy ai-education-backend \
    --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/convee-docker-repo/backend:latest \
    --region $REGION \
    --platform managed \
    --set-env-vars NODE_ENV=production,GCS_BUCKET_NAME=$GCS_BUCKET,GCS_PROJECT_ID=$PROJECT_ID \
    --allow-unauthenticated
```

### Step 6: Deploy Web Frontend
```bash
cd ../frontend
gcloud builds submit --tag ${REGION}-docker.pkg.dev/${PROJECT_ID}/convee-docker-repo/frontend:latest .

gcloud run deploy ai-education-frontend \
    --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/convee-docker-repo/frontend:latest \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated
```

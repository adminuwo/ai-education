# ⚙️ Convee Education — Environment Configuration Reference

This guide provides a comprehensive dictionary of all configuration parameters required across Backend, LLM Bridge, and Web Frontend.

---

## 1. Backend Service Configuration (`/backend/.env`)

| Variable Name | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `8001` | HTTP port for the Node.js Express server. |
| `NODE_ENV` | Yes | `development` / `production` | Runtime mode. Enforces strict secret checks in production. |
| `DATABASE_URL` | Yes | `postgresql://user:pass@localhost:5432/ai_education_db` | Connection string for PostgreSQL database. |
| `CORS_ORIGINS` | No | `*` | Comma-separated list of allowed origins or `*`. |
| `JWT_SECRET` | Yes | *(Cryptographic String)* | HMAC secret for signing short-lived access tokens. |
| `JWT_REFRESH_SECRET` | Yes | *(Cryptographic String)* | HMAC secret for signing long-lived refresh tokens. |
| `JWT_ACCESS_EXPIRES_IN` | No | `15m` | Lifetime of user access tokens. |
| `JWT_REFRESH_EXPIRES_IN` | No | `7d` | Lifetime of sliding refresh tokens. |
| `GOOGLE_CLIENT_ID` | No | `*.apps.googleusercontent.com` | Google OAuth 2.0 Web Client ID. |
| `GOOGLE_CLIENT_SECRET` | No | *(Secret String)* | Google OAuth 2.0 Client Secret. |
| `GOOGLE_REDIRECT_URI` | No | `http://localhost:8001/api/v1/auth/google/callback` | OAuth redirect callback URI. |
| `LLM_BRIDGE_URL` | Yes | `http://localhost:8002` | Endpoint of the Python FastAPI LLM Bridge service. |
| `DEFAULT_LLM_PROVIDER` | No | `openai` | Default model provider if unspecified. |
| `DEFAULT_LLM_MODEL` | No | `gpt-4o-mini` | Default model identifier. |
| `VERTEX_PROJECT_ID` | Yes | `ai-mall-484810` | Google Cloud project ID for Vertex AI Gemini calls. |
| `VERTEX_LOCATION` | No | `asia-south1` | GCP region for Vertex AI endpoints (Mumbai). |
| `VERTEX_GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model variant for student and study tasks. |
| `STUDENT_LLM_PROVIDER` | No | `vertexai` | Provider assigned to student and parent queries. |
| `STUDENT_LLM_MODEL` | No | `gemini-2.5-flash` | Model assigned to student and parent queries. |
| `FACULTY_LLM_PROVIDER` | No | `openai` | Provider assigned to faculty and admin queries. |
| `FACULTY_LLM_MODEL` | No | `gpt-4o-mini` | Model assigned to faculty and admin queries. |
| `OPENAI_API_KEY` | Conditional | `sk-proj-*` | API key required when using OpenAI models. |
| `GCS_BUCKET_NAME` | Conditional | `convee-education-assets` | Target Google Cloud Storage bucket for file uploads. |
| `GCS_PROJECT_ID` | Conditional | `ai-mall-484810` | GCP Project ID housing the Cloud Storage bucket. |
| `RESEND_API_KEY` | No | `re_*` | API key for transactional emails (verification, reset). |
| `EMAIL_FROM` | No | `notifications@convee.edu.in` | Verified sender address for transactional emails. |

---

## 2. LLM Bridge Microservice (`/llm_bridge/.env`)

| Variable Name | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `LLM_BRIDGE_PORT` | No | `8002` | Port for the Python FastAPI server. |
| `VERTEX_PROJECT_ID` | Yes | `ai-mall-484810` | GCP Project ID for Vertex AI authentication via ADC. |
| `VERTEX_LOCATION` | No | `asia-south1` | Region where Gemini endpoints are invoked. |
| `VERTEX_GEMINI_MODEL` | No | `gemini-2.5-flash` | Gemini model name. |
| `OPENAI_API_KEY` | Conditional | `sk-proj-*` | OpenAI key used for faculty requests and fallback. |

---

## 3. Web Frontend (`/frontend/.env`)

| Variable Name | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `REACT_APP_API_URL` | Yes | `http://localhost:8001/api/v1` | Base URL for REST API requests. |
| `REACT_APP_WS_URL` | Yes | `http://localhost:8001` | Socket.IO server URL for real-time messaging. |

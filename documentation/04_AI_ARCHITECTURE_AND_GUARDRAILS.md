# 🤖 Convee Education — AI Architecture, Guardrails & Telemetry

## 1. Dual-LLM Routing Strategy

Convee Education routes prompts based on the user's role to optimize pedagogical quality and operating cost:

```
                          Incoming Request
                                 │
                     User Role & Context Check
                                 │
                ┌────────────────┴────────────────┐
                ▼                                 ▼
      Student, Parent, Alumni             Faculty, Staff, Admin
                │                                 │
     Google Cloud Vertex AI                    OpenAI API
       (Gemini 2.5 Flash)                   (GPT-4o-mini)
                │                                 │
     Region: asia-south1                  Global Endpoint
     Auth: ADC Service Account            Auth: Bearer API Key
```

- **Students, Parents & Alumni**: Routed to **Google Cloud Vertex AI (Gemini 2.5 Flash)** in `asia-south1`. Provides high throughput, 1M+ token context windows for lengthy study materials, and low inference costs.
- **Faculty, Staff, Accountants & Leadership**: Routed to **OpenAI GPT-4o-mini** for lesson planning, administrative drafting, and financial analysis.
- **Automatic Fallback**: If either provider encounters rate limits or service interruptions, the LLM Bridge automatically fails over to the alternative provider.

---

## 2. Multi-Tiered Safety Guardrails (`GuardrailService`)

Every prompt is evaluated by the `GuardrailService` before being dispatched to any LLM:

### 2.1 Crisis Intervention & Self-Harm Shield (Top Priority)
- Scans for suicide, self-harm, or severe crisis signals using specialized pattern matchers.
- **Bypasses LLMs completely** and immediately returns a compassionate, localized Crisis Intervention Card with toll-free, 24/7 helplines:
  - **Tele-MANAS**: `14416` or `1800-891-4416` *(Toll-free, 24/7, multi-lingual)*
  - **Childline India**: `1098` *(24/7 emergency support)*
  - **KIRAN Mental Health Helpline**: `1800-599-0019`
  - **Vandrevala Foundation**: `+91 9999 666 555`
  - **NIMHANS Psychosocial Support**: `080-46110007`
- Logs an audit event in `AIGuardrailEvent` with severity `CRISIS`.

### 2.2 Actionable Danger & Illegal Activities
- Detects and blocks prompts requesting instructions for explosive synthesis, weapons, illicit drug manufacture, or network penetration / hacking.

### 2.3 Academic Dual-Use Protection
- Explicitly whitelists legitimate educational topics that might otherwise trigger false positives in generic safety filters (e.g., reproduction in Biology, combustion in Chemistry, World War II in History, buffer overflows in Computer Science).

### 2.4 Student PII Redaction
- Automatically detects and masks sensitive Indian and international identifiers (Aadhaar cards, PAN cards, SSNs) before prompts leave the institutional perimeter.

### 2.5 Exam Integrity Guardrails
- Detects prompts containing live exam question patterns, reframing responses to explain underlying concepts rather than providing direct answers.

---

## 3. AI Token Telemetry & Billing Accounting

Every AI transaction is logged in `AITokenUsageLog`:

```typescript
// Sample AITokenUsageLog Record
{
  id: "token-log-uuid",
  orgId: "aryabhata-engineering",
  userId: "user-kunal-sharma",
  role: "STUDENT",
  promptTokens: 420,
  completionTokens: 180,
  totalTokens: 600,
  provider: "vertexai",
  model: "gemini-2.5-flash",
  estimatedCost: 0.00018, // USD
  feature: "QUIZ",
  guardrailStatus: "PASSED",
  createdAt: "2026-09-21T10:30:00Z"
}
```

- **Usage Aggregation**: Superadmins and Directors can monitor monthly token consumption, costs per department, and feature utilization across the institution.

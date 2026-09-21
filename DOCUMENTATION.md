# 🎓 AI Education Platform (Convee Education)
## Master Enterprise Architecture, Technical Documentation & System Reference Guide

---

## 📑 Table of Contents

1. [Executive Summary & Platform Identity](#1-executive-summary--platform-identity)
2. [System Architecture & Technology Stack](#2-system-architecture--technology-stack)
3. [Multi-Tenant Campus Hierarchy & RBAC Matrix](#3-multi-tenant-campus-hierarchy--rbac-matrix)
4. [Functional Modules & Operational Workflows](#4-functional-modules--operational-workflows)
   - [4.1 Academic Operations & Timetable Management](#41-academic-operations--timetable-management)
   - [4.2 Examinations, Assessments & Automated Report Cards](#42-examinations-assessments--automated-report-cards)
   - [4.3 Homework & Assignment Lifecycle](#43-homework--assignment-lifecycle)
   - [4.4 Adaptive AI Study Buddy & Daily Quizzes](#44-adaptive-ai-study-buddy--daily-quizzes)
   - [4.5 Real-Time Communication & Collaboration](#45-real-time-communication--collaboration)
   - [4.6 Task & Project Management](#46-task--project-management)
   - [4.7 Parent Portal & Guardian Oversight](#47-parent-portal--guardian-oversight)
   - [4.8 Academic Promotion & Batch Archiving Engine](#48-academic-promotion--batch-archiving-engine)
   - [4.9 Institutional Finance & Tally ERP 9 / Prime Sync](#49-institutional-finance--tally-erp-9--prime-sync)
   - [4.10 Legal Education & Judicial / ADP Aspirant Suite](#410-legal-education--judicial--adp-aspirant-suite)
   - [4.11 In-App Bug & Crash Reporting](#411-in-app-bug--crash-reporting)
5. [AI Architecture, Guardrails & Telemetry](#5-ai-architecture-guardrails--telemetry)
6. [Database Architecture & Entity Data Models](#6-database-architecture--entity-data-models)
7. [Comprehensive REST API Reference](#7-comprehensive-rest-api-reference)
8. [Security, Privacy & CASA Compliance](#8-security-privacy--casa-compliance)
9. [Environment Configuration Reference](#9-environment-configuration-reference)
10. [Local Development, Build & Testing Workflows](#10-local-development-build--testing-workflows)
11. [Cloud Deployment & Production Operations](#11-cloud-deployment--production-operations)
12. [Pre-Configured Institutions & Credential Directory](#12-pre-configured-institutions--credential-directory)

---

## 1. Executive Summary & Platform Identity

The **AI Education Platform** (internally branded as **Convee Education**) is an enterprise-grade digital campus operating system designed for schools (K-12), higher education engineering and arts colleges, and national law universities.

Unlike fragmented educational software that treats communication, grading, and accounting as disconnected silos, Convee Education provides a unified, real-time operating ecosystem. It pairs day-to-day campus management (timetables, attendance, exams, report cards, fee collection, staff payroll) with pedagogical artificial intelligence (adaptive daily quizzes, personalized study bots, legal bare-act breakdowns) and institutional financial reconciliation (direct two-way XML sync with Tally ERP 9 and TallyPrime).

### Core Pillars

1. **Strict Multi-Tenancy**: Isolated database records per institution (`orgId`), supporting multi-campus groups, autonomous departments, class teams, and project groups.
2. **Dual-LLM Routing Strategy**:
   - **Students, Parents & Alumni**: Routed to **Google Cloud Vertex AI (Gemini 2.5 Flash)** in the `asia-south1` region for low latency, high context windows, and cost efficiency.
   - **Faculty, Staff, Accountants & Leadership**: Routed to **OpenAI GPT-4o-mini** for high-precision analytical drafting, lesson planning, and financial summarization.
3. **CASA Tier-2 Privacy & Safety Guardrails**: Hardened against PII leakage (Aadhaar, PAN, SSN), anti-cheating during exams, actionable danger blocking, and real-time crisis intervention (Tele-MANAS 14416 and Childline 1098 hotlines).
4. **Bi-Directional Financial Sync**: Out-of-the-box integration with India's standard accounting software, **Tally ERP 9** and **TallyPrime**, covering student fee receipts, staff payroll, operational expenses, bank reconciliations, society corpus funds, and fixed-asset depreciation.
5. **Multi-Platform Experience**: Responsive desktop web application (React 19 + Tailwind CSS) and companion mobile apps (React Native via Expo SDK 52 for Android/iOS, plus a Flutter implementation).

---

## 2. System Architecture & Technology Stack

```mermaid
flowchart TD
    subgraph Clients["Client Layer"]
        Browser["Desktop & Mobile Web Browser\n(React 19 + Tailwind CSS)"]
        MobileApp["Native Mobile Apps\n(React Native Expo SDK 52 / Flutter)"]
    end

    subgraph Ingress["Ingress & Gateway"]
        Nginx["Nginx Reverse Proxy / Cloud Run Router\n(HTTPS, TLS 1.3, Static Assets)"]
    end

    subgraph Microservices["Serverless Microservice Layer (GCP Cloud Run)"]
        Backend["Backend Core API Server\n(Node.js 20 + Express + TypeScript)\nPort: 8001"]
        LLMBridge["LLM Bridge Microservice\n(Python 3.11 + FastAPI + Uvicorn)\nPort: 8002"]
        SocketServer["Real-Time WebSockets Engine\n(Socket.IO 4.8)"]
    end

    subgraph DataStorage["Data & Storage Infrastructure"]
        Postgres[("Cloud SQL / PostgreSQL 15\n(Prisma ORM 5.22)")]
        GCS["Google Cloud Storage (GCS)\n(Document Assets, Payslips, Bug Screenshots)"]
        TallyLocal["Tally ERP 9 / TallyPrime\n(XML over HTTP @ localhost:9000)"]
        MongoAudit[("MongoDB Atlas\nAI-Legal Corpus & Knowledge Graphs")]
    end

    subgraph AIProviders["AI Provider Clouds"]
        VertexAI["Google Cloud Vertex AI\n(Gemini 2.5 Flash - asia-south1)"]
        OpenAI["OpenAI Cloud\n(GPT-4o-mini API)"]
        Groq["Groq Cloud LPU\n(Ultra-fast Quiz Generation)"]
    end

    Browser -->|HTTPS| Nginx
    MobileApp -->|REST & Sockets| Nginx
    Nginx -->|Proxy /api| Backend
    Backend <--> SocketServer
    Backend -->|Internal HTTP| LLMBridge
    Backend -->|Prisma Pooler| Postgres
    Backend -->|Signed URLs / Storage SDK| GCS
    Backend -->|Direct XML Sync| TallyLocal
    Backend -->|Mongoose Client| MongoAudit
    LLMBridge -->|ADC / Vertex SDK| VertexAI
    LLMBridge -->|REST API Key| OpenAI
    Backend -->|Direct LPU Call| Groq
```

### Technology Matrix

| Layer | Technologies | Key Libraries & Specifications |
| :--- | :--- | :--- |
| **Web Frontend** | React 19, Tailwind CSS 3, Vite / CRACO | `@shadcn/ui` design tokens, `lucide-react`, `axios`, `socket.io-client`, `date-fns`, `recharts` |
| **Mobile Frontend** | React Native, Expo SDK 52, TypeScript | React Navigation 6, `lucide-react-native`, Expo Camera, SecureStore, EAS Build |
| **Secondary Mobile**| Flutter 3.x, Dart | Provider, HTTP, Cupertino & Material 3 |
| **Backend REST API**| Node.js 20, Express 4.21, TypeScript 5.6 | Prisma ORM 5.22, Zod 3.23 validation, BcryptJS, JWT, Multer, Helmet, Rate-Limit, Morgan, Pino |
| **Realtime Engine** | Socket.IO 4.8 | Rooms scoped by `orgId`, `channelId`, `userId`; presence heartbeats |
| **LLM Bridge Service**| Python 3.11, FastAPI, Uvicorn | `google-genai` SDK, Pydantic, HTTP Client pool, AsyncIO thread pooling |
| **Database** | PostgreSQL 15 | Managed Cloud SQL or Docker Compose, connection pooling, prepared statements |
| **Object Storage** | Google Cloud Storage (GCS) | `@google-cloud/storage`, private buckets, 24-hour signed URLs |
| **Accounting Bridge**| Tally XML over HTTP | Custom XML builders, TDL envelopes, Tombstone synchronization |
| **CI/CD & Cloud** | Google Cloud Run, Artifact Registry, Cloud Build | Serverless auto-scaling (0-10 instances), multi-stage Docker builds |

---

## 3. Multi-Tenant Campus Hierarchy & RBAC Matrix

### 3.1 Organizational Structure

Convee Education enforces strict hierarchical boundaries. Every academic interaction, file upload, or ledger entry belongs to an Organization.

```
Organization (e.g. University or School)
 │
 ├── Departments (e.g. Dept of Law, Dept of Computer Science, Secondary Wing)
 │    │
 │    └── Teams / Classes (e.g. Class 10-A, 3rd Year CSE, Cyber Law Section 1)
 │         │
 │         ├── Projects (e.g. Science Exhibition, Moot Court Project)
 │         │    └── Project Tasks & Milestones
 │         │
 │         └── Enrolled Students & Class Teachers
 │
 └── Channels (Public, Departmental, Class-specific, Direct Messages)
```

### 3.2 System & Campus Roles

The platform defines two layers of authorization:
1. **SystemRole**: Global authorization level (`SUPER_ADMIN`, `ACCOUNTANT`, `USER`).
2. **OrgRole**: Role of the user within an institutional membership:

| OrgRole | Scope & Typical Campus Title | Core Capabilities |
| :--- | :--- | :--- |
| **`OWNER`** | Founder / Trust Chairman | Total institutional ownership, billing, domain settings, deletion |
| **`DIRECTOR`** | Managing Director / Vice Chancellor | Strategic oversight, institution-wide analytics, campus governance |
| **`PRINCIPAL`** | Head of School / College Principal | Academic policy, timetable approvals, exam publishing, proxy sign-off |
| **`DEAN`** | Dean of Faculty / Academics | Departmental oversight, curriculum planning, teacher leaves |
| **`HOD`** | Head of Department | Timetable slotting, teacher substitute assignment, departmental chat |
| **`ADMIN`** | Registrar / Campus Administrator | User provisioning, ID card generation, class allocations, promotions |
| **`ACCOUNTANT`**| Bursar / Finance Officer | Fee collection, Tally sync, payroll, fixed assets, bank ledgers |
| **`TEACHER`** | Faculty / Professor / PGT / TGT | Attendance marking, homework posting, grading, timetable view |
| **`STUDENT`** | Enrolled Pupil / College Student | Homework submission, Study Buddy AI, daily quizzes, report cards |
| **`PARENT`** | Guardian / Mother / Father | Linked student tracking, attendance view, fee payments, report cards |
| **`ALUMNI`** | Graduated Student / Ambassador | Mentorship, alumni channels, institution updates |

### 3.3 Dynamic Role Permissions Engine

In addition to static role checks, institutions can customize permissions on the fly via `/api/v1/orgs/:orgId/permissions`:
- Permissions stored as structured JSON arrays: `["manage_timetable", "view_financials", "publish_exams", "grade_homework"]`.
- Custom roles can be created per institution without modifying application code.

---

## 4. Functional Modules & Operational Workflows

### 4.1 Academic Operations & Timetable Management

The timetable engine manages the complex weekly matrix of periods, classrooms, and faculty schedules.

- **Slot Definition**: Supports 8 periods per day, Monday through Saturday.
- **Conflict Prevention**: Validates against double-booking of teachers or rooms for the same day and period.
- **Teacher Absence & Proxy Assignment Workflow**:
  1. A teacher logs planned leave or emergency absence (`TeacherAbsence`).
  2. The system scans the timetable for affected slots.
  3. The HOD or Dean views available faculty who have a free period during those slots.
  4. The HOD assigns a substitute teacher (`ProxyAssignment`).
  5. The substitute teacher receives an instant real-time notification with class section, subject, and room number.

### 4.2 Examinations, Assessments & Automated Report Cards

A complete assessment pipeline from exam scheduling to digitally sealed report cards:

1. **Exam Setup**: Admins or Principals create an `Exam` (Mid-Term, Final, Unit Test) specifying academic session, target classes, and grading mode (Numerical 0–100 or Letter Grade A+ to F).
2. **Subject Breakdown**: Each exam contains multiple `ExamSubject` records with specific maximum and passing marks, distinguishing theory vs. practical/lab tests.
3. **Score Entry**: Subject teachers enter marks, absence flags, and individual observations for each student.
4. **Automated Report Card Generation**:
   - Calculates total marks, percentages, pass/fail status, and grade rankings.
   - Computes attendance statistics from `AttendanceRecord` (total days vs. attended days).
   - Generates AI-synthesized qualitative remarks highlighting academic strengths and growth areas.
   - Embeds multi-tier digital signatures (Class Teacher, HOD, Principal) alongside the official institution seal.
   - Published report cards can be viewed by students and parents or printed for physical records.

### 4.3 Homework & Assignment Lifecycle

1. **Assignment Creation**: Teachers create assignments linked to classes or projects, attaching syllabus files, references, and grading rubrics.
2. **Student Submission**: Students submit text responses and upload PDFs/images via Google Cloud Storage.
3. **Rubric-Based Grading**: Teachers evaluate submissions with numerical scores, rubric criteria, and qualitative feedback notes.
4. **Status Lifecycle**: Tracks assignments through `PENDING` -> `ACCEPTED` -> `EXTENSION_REQUESTED` -> `SUBMITTED` -> `COMPLETED`.

### 4.4 Adaptive AI Study Buddy & Daily Quizzes

The **Study Buddy** provides an engaging, gamified learning loop for students:

- **Personalized Quizzes**: Generates 5-question daily quizzes matched to the student's enrolled subjects and grade level.
- **Adaptive Skill Tracking**: Calculates a `skillScore` (0–100) and tracks `skillLevel` across four tiers: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, and `MASTERY`.
- **Streak Counter**: Encourages daily habits with streak counters and celebratory feedback.
- **Detailed Explanations**: Instant feedback explaining why a chosen option is right or wrong, citing textbook fundamentals.

### 4.5 Real-Time Communication & Collaboration

Convee Education includes a full-featured communication system:

- **Channel Types**: `PUBLIC`, `PRIVATE`, `DIRECT`, `TEAM`, `DEPARTMENT`, `PROJECT`, `ANNOUNCEMENT`.
- **Message Capabilities**: Text, code formatting, attachments, image galleries, audio/video links.
- **Interactive Features**: Emoji reactions, threaded replies (`parentId`), message pinned notices, unread badge counters, and real-time read receipts (`MessageRead`).
- **AI Channel Summarizer**: Allows busy administrators or teachers to instantly summarize up to 100 missed messages into key bullet points and action items.

### 4.6 Task & Project Management

A unified task tracking system for student group work, administrative initiatives, and faculty committees:

- **Views**: Kanban board, list view, calendar deadlines.
- **Attributes**: Due dates, start dates, priorities (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), and estimated vs. actual hours.
- **Checklists & Dependencies**: Nested subtasks, checklist items with progress bars, and directional task dependencies (`dependsOnId`).

### 4.7 Parent Portal & Guardian Oversight

A dedicated interface for parents to stay actively connected with their child's academic journey:

- **Multi-Child Switcher**: Parents with multiple enrolled children can switch contexts with one click via `ParentStudentLink`.
- **Academic Telemetry**: Real-time attendance percentage, today's attendance status, overdue homework alerts, and timetable schedules.
- **Fee Transparency**: Outstanding tuition balances, payment due dates, and downloaded receipts.
- **Direct Faculty Communication**: Private messaging channels with class teachers.

### 4.8 Academic Promotion & Batch Archiving Engine

The promotion engine handles the annual transition from one academic year to the next:

- **Progression Mapping**: Configured via `AcademicPromotionConfig` (e.g., Grade 9-A -> Grade 10-A, Grade 12 -> Alumni Group).
- **Batch Archiving**: Preserves historical class states, student rosters, and performance metrics in `AcademicBatchArchive` as structured JSON snapshots.
- **Alumni Transition**: Graduated seniors are automatically migrated into designated `AlumniGroup` channels, preserving institutional memory while freeing up active class rosters.

### 4.9 Institutional Finance & Tally ERP 9 / Prime Sync

A comprehensive financial management suite built specifically for educational accounting standards in India:

```mermaid
sequenceDiagram
    participant Web as Web Frontend (Accountant)
    participant API as Backend Finance API
    participant DB as PostgreSQL Database
    participant Tally as Local Tally ERP / Prime (:9000)

    Note over Web,Tally: Fee Collection & Receipt Generation
    Web->>API: POST /api/v1/finance/fees (Collect Student Fee)
    API->>DB: Record StudentFeeLedger entry
    API->>Tally: POST Envelope with Fee Receipt Voucher XML
    Tally-->>API: Response (Voucher ID / Status)
    API->>DB: Update tallyVoucherId & tallySyncStatus = SYNCED_MASTER
    API-->>Web: Return confirmed fee receipt

    Note over Web,Tally: Bi-Directional Synchronization
    Web->>API: POST /api/v1/finance/tally/sync-all
    API->>Tally: Query Active Company & Master Ledgers
    API->>Tally: Push Outstanding Fees, Payroll & Expenses
    Tally-->>API: Acknowledge XML Transactions
    API-->>Web: Return Sync Summary (Created, Updated, Reconciled)
```

#### Financial Components

1. **Student Fee Ledgers**: Tracks tuition, lab, library, and transport fees. Statuses: `PAID`, `PENDING`, `PARTIAL`, `OVERDUE`. Generates Tally Receipt Vouchers under the student's ledger (Sundry Debtors).
2. **Staff Payroll**: Monthly salary calculation, basic pay, allowances, deductions (PF/ESI/TDS), net pay, and payslip generation. Syncs with Tally as Salary Payable (Sundry Creditors).
3. **Institutional Expenses**: Categories include Maintenance, Utilities, Lab Equipment, IT Software, and Events. Linked to institutional bank accounts.
4. **Society & Trust Funds**: Tracks Capital Corpus, Infrastructure Grants, and Scholarship Endowments contributed by trust societies or government bodies.
5. **Cash Registers & Petty Cash**: Tracks multiple physical cash desks (Admissions Counter, Petty Cash, Principal Office) with daily cash-in/cash-out vouchers.
6. **Fixed Asset Depreciation**: Catalogs land, buildings, IT hardware, school buses, and smart boards. Calculates straight-line or Written Down Value (WDV) depreciation.
7. **Tally Tombstone Deletion Protocol**: Ensures that if a record is deleted in Convee, a `TallyTombstone` entry is created to purge or reconcile the entry in Tally during the next sync cycle.

### 4.10 Legal Education & Judicial / ADP Aspirant Suite

A specialized vertical designed for National Law Universities and competitive judicial examination candidates (Civil Judge PCS-J, Higher Judicial Services HJS, and Assistant Public Prosecutor ADP):

- **Automated Bare Act Scraping**: Ingests and indexes acts from official government repositories (India Code, Supreme Court eSCR).
- **AI Judicial Study Assistant**: Month-by-month study blueprint generator tailored to specific state syllabi (Delhi, UP, MP, Bihar, Rajasthan).
- **Mains Answer Evaluation**: AI evaluation of subjective answers against legal rubrics, section citations, landmark precedents, and judgment writing standards.
- **Previous Year Question (PYQ) Bank**: Searchable repository of state judicial service question papers.

### 4.11 In-App Bug & Crash Reporting

An automated triage system ensuring high campus uptime:

- Users can submit bug reports directly from the interface with optional screenshot attachments.
- Automatic capture of browser metadata, user role, operating system, URL, and console stack traces.
- Screenshots are automatically uploaded to Google Cloud Storage with private signed URLs.
- Superadmins review, assign severity (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), and track resolution status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`).

---

## 5. AI Architecture, Guardrails & Telemetry

### 5.1 Dual-LLM Routing Architecture

The platform uses a role-based dispatch model to optimize pedagogical quality and operational cost:

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

### 5.2 Multi-Layered Safety Guardrail Pipeline

Every query passes through the `GuardrailService` before hitting any LLM:

1. **Crisis Intervention & Self-Harm Shield (Top Priority)**:
   - Scans for suicidal ideation, depression, or self-harm patterns.
   - **Bypasses LLM entirely** and immediately returns a localized Crisis Intervention Card with toll-free, 24/7 helplines (Tele-MANAS `14416`, Childline `1098`, KIRAN `1800-599-0019`).
   - Logs an audit event to `AIGuardrailEvent` with severity `CRISIS`.
2. **Actionable Danger & Malicious Activity**:
   - Blocks generation of weapon instructions, drug synthesis, school network hacking, and malware creation.
3. **Academic Dual-Use Protection**:
   - Explicitly whitelists legitimate scientific and historical topics (e.g., human reproduction in Biology, combustion and acids in Chemistry, World War II in History, buffer overflows in Computer Science).
4. **Student PII Sanitization**:
   - Detects and masks Aadhaar card numbers, PAN cards, and social security formats before prompts are sent to external LLMs.
5. **Exam Integrity Guardrail**:
   - Detects attempts to feed live exam questions into the bot, reframing the response to guide the student toward underlying concepts rather than direct answers.

### 5.3 Token Telemetry & Financial Cost Tracking

Every AI transaction is logged in `AITokenUsageLog`:
- Records `promptTokens`, `completionTokens`, and `totalTokens`.
- Records `provider` (`vertexai`, `openai`, `groq`) and `model`.
- Calculates `estimatedCost` in USD based on active provider pricing.
- Tracks feature source (`CHAT`, `QUIZ`, `BRIEFING`, `LESSON_PLAN`, `GRADING`, `REPORT_CARD`).
- Aggregates metrics on the Superadmin dashboard for institutional AI billing and usage auditing.

---

## 6. Database Architecture & Entity Data Models

The relational schema is managed using **Prisma ORM** against **PostgreSQL**.

### Schema Category Map

```
                    ┌─────────────────────────┐
                    │      ORGANIZATION       │
                    └────────────┬────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     CAMPUS      │     │  COMMUNICATION  │     │   ACCOUNTING    │
│   HIERARCHY     │     │ & COLLABORATION │     │   & AUDITING    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ Department      │     │ Channel         │     │ StudentFeeLedger│
│ Team (Class)    │     │ ChannelMember   │     │ PayrollRecord   │
│ Project         │     │ Message         │     │ ExpenseRecord   │
│ ProjectTeam     │     │ Reaction        │     │ BankAccount     │
│ Membership      │     │ MessageRead     │     │ SocietyFund     │
│ User            │     │ PinnedMessage   │     │ CashRegister    │
│ RefreshToken    │     │ FileAsset       │     │ CashTransaction │
│ RolePermission  │     │ Attachment      │     │ FixedAsset      │
└────────┬────────┘     │ Meeting         │     │ TallyTombstone  │
         │              │ Notification    │     └─────────────────┘
         │              └─────────────────┘              │
         ▼                                               ▼
┌─────────────────┐                             ┌─────────────────┐
│    ACADEMIC     │                             │   AI, SAFETY    │
│   OPERATIONS    │                             │  & TELEMETRY    │
├─────────────────┤                             ├─────────────────┤
│ AttendanceRecord│                             │ AIConversation  │
│ HomeworkSubmiss.│                             │ AIMessage       │
│ ParentStudentLnk│                             │ AITokenUsageLog │
│ TimetableSlot   │                             │ AIGuardrailEvent│
│ TeacherAbsence  │                             │ BugReport       │
│ ProxyAssignment │                             │ LegalDocAsset   │
│ AcadPromoConfig │                             │ LegalScraperJob │
│ AcadBatchArchive│                             │ AuditLog        │
│ AlumniGroup     │                             └─────────────────┘
│ Exam, ExamScore │
│ ExamSubject     │
│ ReportCard      │
│ StudentDailyQuiz│
└─────────────────┘
```

### Complete Model Inventory (36 Entities)

| Model Name | Purpose | Primary Relations & Keys |
| :--- | :--- | :--- |
| **`User`** | Central identity record for all personas | `id`, `email`, `googleId`, memberships, auditLogs |
| **`RefreshToken`** | Secure token rotation for JWT sessions | `userId` -> `User.id` (Cascade) |
| **`EmailVerificationToken`**| One-time verification tokens | `userId` -> `User.id` (Cascade) |
| **`Organization`** | Institution tenant boundary | `id`, `slug`, `ownerId` -> `User.id` |
| **`Department`** | Faculty / Academic Department | `orgId` -> `Organization.id`, teams, memberships |
| **`Team`** | Class Section or Working Group | `departmentId` -> `Department.id`, projects |
| **`Project`** | Collaborative academic or club project | `teamId` -> `Team.id`, tasks, channels |
| **`ProjectTeam`** | Junction for multi-team project sharing| Composite PK `[projectId, teamId]` |
| **`Membership`** | User enrollment within an institution | Composite Unique `[userId, orgId]`, role (`OrgRole`) |
| **`RolePermission`** | Fine-grained custom role override rules | Composite Unique `[orgId, role]`, permissions JSON |
| **`Channel`** | Real-time chat channel | `orgId`, `projectId`, messages, members |
| **`ChannelMember`** | User membership within a chat channel | Composite Unique `[channelId, userId]` |
| **`Message`** | Chat message entry with threaded replies| `channelId`, `senderId`, `parentId` -> `Message.id` |
| **`Reaction`** | Emoji reaction on a message | Composite Unique `[messageId, userId, emoji]` |
| **`MessageRead`** | Read receipts per message | Composite Unique `[messageId, userId]` |
| **`PinnedMessage`** | Pinned announcements inside channels | Unique `messageId`, `pinnedById` |
| **`FileAsset`** | Uploaded file stored on GCS or disk | `uploaderId`, `orgId`, storage path, mimeType |
| **`Attachment`** | Poly-relation linking files to items | Links `FileAsset` to `Message`, `Task`, or `Meeting` |
| **`Task`** | Assignment, homework, or institutional task| `orgId`, `createdById`, assignees, subtasks, checklists |
| **`TaskAssignee`** | Assigned user with workflow status | Composite Unique `[taskId, userId]`, `TaskAssigneeStatus` |
| **`TaskComment`** | Discussion thread on a specific task | `taskId`, `userId`, text content |
| **`TaskChecklist`** | Checklist items within a task | `taskId`, content, completion boolean, position |
| **`TaskDependency`**| Pre-requisite task linkages | Composite Unique `[taskId, dependsOnId]` |
| **`Meeting`** | Calendar event or live video class | `orgId`, `createdById`, start/end times, AI summary |
| **`MeetingAttendee`**| Participant list for a meeting | Composite Unique `[meetingId, userId]` |
| **`Notification`** | In-app user notification alerts | `userId`, `orgId`, type, read state |
| **`AIConversation`**| Multi-turn conversation container | `userId`, unique `sessionKey`, messages |
| **`AIMessage`** | Individual AI user or assistant turn | `conversationId` -> `AIConversation.id` |
| **`AuditLog`** | Immutable system-wide audit trail | `userId`, `orgId`, action, entity, IP, User-Agent |
| **`AttendanceRecord`**| Daily classroom attendance record | Composite Unique `[teamId, studentId, date]` |
| **`HomeworkSubmission`**| Student submitted homework with grade | Composite Unique `[taskId, studentId]`, rubric scores |
| **`ParentStudentLink`**| Links parent account to student account | Composite Unique `[orgId, parentUserId, studentUserId]` |
| **`StudentFeeLedger`**| Student billing, fee collections & Tally sync| `orgId`, `studentId`, status, `tallyVoucherId` |
| **`PayrollRecord`** | Staff monthly salary disbursements | `orgId`, `userId`, basicPay, netSalary, tally status |
| **`ExpenseRecord`** | Operational expenses and vendor payments| `orgId`, category, amount, bank account link |
| **`BankAccount`** | Institutional bank accounts | `orgId`, account number, current balance, IFSC code |
| **`SocietyFund`** | Trust corpus funds and capital grants | `orgId`, fundType, contributingBody, amount |
| **`CashRegister`** | Petty cash boxes & physical cash counters | `orgId`, registerName, custodian, currentBalance |
| **`CashTransaction`**| Cash vouchers (in, out, bank deposits) | `orgId`, `registerId`, amount, transactionType |
| **`FixedAsset`** | Capital asset register with depreciation | `orgId`, assetCode, purchasePrice, bookValue |
| **`TallyTombstone`**| Deleted records awaiting Tally purge | `orgId`, entityType, entityId, voucherNumber |
| **`TimetableSlot`** | Period schedule grid slot | `orgId`, `teamId`, dayOfWeek, periodNumber (1-8) |
| **`TeacherAbsence`**| Recorded faculty leave/absence | `orgId`, `teacherUserId`, date, reason |
| **`ProxyAssignment`**| Assigned substitute teacher for absent slot| `orgId`, `slotId`, `substituteTeacherId`, HOD status |
| **`AcademicPromotionConfig`**| Rules for grade-to-grade batch progression | `orgId`, orderIndex, fromClassName, toClassName |
| **`AcademicBatchArchive`**| JSON snapshot archive of graduated classes | `orgId`, sessionName, structureJson, studentCount |
| **`AlumniGroup`** | Designated channels for alumni cohorts | Composite Unique `[orgId, batchYear]` |
| **`Exam`** | Assessment session container | `orgId`, title, term, academicSession, status |
| **`ExamSubject`** | Individual subject paper inside an exam | `examId`, subjectName, maxMarks, passingMarks |
| **`ExamScore`** | Student marks and grades for a subject | Composite Unique `[examId, subjectId, studentId]` |
| **`ReportCard`** | Comprehensive terminal term report card | Composite Unique `[orgId, studentId, session, term]` |
| **`StudentDailyQuiz`**| Daily adaptive 5-question AI knowledge test| `orgId`, `studentId`, questionsJson, streakDays |
| **`AITokenUsageLog`**| Token accounting, model telemetry & cost | `orgId`, `userId`, tokens, provider, USD cost |
| **`AIGuardrailEvent`**| Guardrail interception audit record | `orgId`, `userId`, category, severity, actionTaken |
| **`BugReport`** | In-app user bug report with GCS screenshot| `userId`, `orgId`, severity, status, imageUrl |
| **`LegalDocumentAsset`**| Indian Bare Acts, case laws, and PYQs | `orgId`, category, targetExams, state, GCS key |
| **`LegalScraperJob`**| Web scraping job tracker for India Code | `orgId`, targetSource, status, ingestedCount |

---

## 7. Comprehensive REST API Reference

All application endpoints are mounted under `/api/v1`.

### Route Modules Summary

```
/api/v1/auth                - Authentication, JWT refresh, Google OAuth, Student Join
/api/v1/orgs                - Organization, Department, Team, Project & Member Management
/api/v1/orgs/:id/permissions- Granular Role Permissions
/api/v1/orgs/:id/promotion  - Academic Year Promotion & Batch Archiving
/api/v1/channels            - Channels, Direct Messages, Message Posting & Reactions
/api/v1/tasks               - Task Management, Subtasks, Checklists & Dependencies
/api/v1/ai                  - Study Buddy, Chat, Quiz Generation, Telemetry
/api/v1/attendance          - Daily Attendance Marking, Batch Queries & Analytics
/api/v1/homework            - Homework Assignments, Submissions & Grading
/api/v1/parent              - Parent-Student Portal & Child Linkage
/api/v1/finance             - Tally ERP Sync, Fees, Payroll, Expenses, Assets, Cash
/api/v1/timetable           - Timetable Scheduling, Absences & Proxy Assignments
/api/v1/exams               - Exams, Subject Scores, Grading & Report Cards
/api/v1/legal               - Bare Acts, Case Law Scraping, Judicial Study Assistant
/api/v1/meetings            - Video Meetings, Agendas & AI Minutes
/api/v1/files               - File Uploads & GCS Signed URLs
/api/v1/notifications       - In-App Alerts & Notification Management
/api/v1/dashboard           - Role-Specific Executive Dashboards
/api/v1/users               - User Profiles, Avatars & Status Updates
/api/v1/bugs                - Bug Reporting & Superadmin Triage
/api/v1/search              - Global Cross-Entity Search
```

### Key Endpoint Specifications

#### Authentication (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Public (Rate-limited) | Register a new user and institution |
| `POST` | `/login` | Public (Classroom-safe) | Authenticate via email & password; returns JWT tokens |
| `POST` | `/refresh` | Public | Exchange refresh token for fresh access token |
| `POST` | `/logout` | Authenticated | Revoke refresh token and terminate session |
| `GET` | `/me` | Authenticated | Get current user profile and active memberships |
| `GET` | `/google/start` | Public | Initiate Google OAuth 2.0 flow |
| `POST` | `/google/callback` | Public | Exchange Google authorization code for JWT |
| `POST` | `/forgot-password` | Public (Strict rate limit) | Request password reset email |
| `POST` | `/reset-password` | Public | Complete password reset with verification token |
| `GET` | `/student-join/verify`| Public | Verify student admission invite code |
| `POST` | `/student-join` | Public | Complete student self-registration into an assigned class |

#### Organizations & Campus Hierarchy (`/api/v1/orgs`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Authenticated | List all organizations the user is a member of |
| `POST` | `/` | Authenticated | Create a new organization (User becomes `OWNER`) |
| `GET` | `/:orgId` | Org Member | Get full organization profile and structure |
| `POST` | `/:orgId/departments` | Admin / Director | Create a new academic department |
| `POST` | `/:orgId/teams` | Admin / Dean | Create a new class section or faculty team |
| `POST` | `/:orgId/projects` | Faculty / Student | Create a collaborative project |
| `GET` | `/:orgId/members` | Org Member | List institution members with search and role filters |
| `POST` | `/:orgId/members` | Admin / Registrar | Add or enroll a new member into the organization |
| `DELETE`| `/:orgId/members/:userId`| Admin / Owner | Remove or deactivate a user's membership |

#### AI & Study Buddy (`/api/v1/ai`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/chat` | Authenticated | Multi-turn AI chat with automated routing and guardrails |
| `POST` | `/summarize-channel` | Org Member | Summarize up to 100 recent channel messages |
| `POST` | `/draft-reply` | Org Member | AI-assisted message draft generation |
| `POST` | `/daily-briefing` | Authenticated | Personalized daily briefing with tasks, classes, and notices |
| `GET` | `/student/daily-quiz`| Student | Fetch or generate today's adaptive 5-question quiz |
| `POST` | `/student/daily-quiz/generate`| Student | Force-generate a new quiz for a specific subject |
| `POST` | `/student/daily-quiz/:id/submit`| Student | Submit quiz answers; returns score, explanations & streak |
| `GET` | `/student/daily-quiz/history`| Student | Fetch historical quiz performance and streak logs |

#### Attendance (`/api/v1/attendance`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/batch` | Teacher / Admin | Batch-record daily attendance for a class (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`) |
| `GET` | `/team/:teamId` | Teacher / Admin | Fetch attendance roster for a class on a specific date |
| `GET` | `/stats` | Authenticated | Query attendance percentage for a student |
| `GET` | `/department/:id/analytics`| HOD / Dean | Department-wide attendance trends and absentee lists |

#### Examinations & Report Cards (`/api/v1/exams`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Org Member | List exams for the organization |
| `POST` | `/` | Principal / Admin | Create a new examination session |
| `POST` | `/:examId/subjects` | Admin / HOD | Add subject test papers to an exam |
| `POST` | `/:examId/scores` | Teacher / HOD | Submit student marks and grades for a subject |
| `POST` | `/:examId/generate-report-cards`| Principal / Admin | Compile scores into final report cards with AI remarks |
| `GET` | `/report-cards/:id` | Student / Parent / Staff| View digitally signed report card |
| `PATCH`| `/report-cards/:id/publish`| Principal / Dean | Publish report card for student and parent access |

#### Institutional Finance & Tally Sync (`/api/v1/finance`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/tally/status` | Accountant / Admin | Check connection status to local Tally ERP instance (:9000) |
| `POST` | `/tally/sync-all` | Accountant / Admin | Trigger full bi-directional sync (Fees, Payroll, Expenses) |
| `GET` | `/fees` | Accountant / Admin | List student fee ledgers with status and search filters |
| `POST` | `/fees` | Accountant | Record student fee collection and generate receipt voucher |
| `GET` | `/payroll` | Accountant / Admin | List staff payroll records and disbursements |
| `POST` | `/payroll/disburse`| Accountant | Record salary payment and generate Tally payment voucher |
| `GET` | `/expenses` | Accountant / Admin | View operational expenses categorized by account |
| `POST` | `/expenses` | Accountant | Record new expense with vendor and bank details |
| `GET` | `/bank-accounts` | Accountant / Admin | List institution bank accounts and balances |
| `GET` | `/society-funds` | Accountant / Admin | Manage corpus, infrastructure, and endowment funds |
| `GET` | `/cash-registers`| Accountant | View physical cash desk balances and transactions |
| `GET` | `/fixed-assets` | Accountant / Admin | Asset register with depreciation schedules |
| `GET` | `/export/tally-xml`| Accountant | Download comprehensive Tally XML master import file |

#### Timetable & Proxy Management (`/api/v1/timetable`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/class/:teamId` | Org Member | Fetch weekly 8-period timetable grid for a class |
| `POST` | `/slot` | Admin / HOD | Create or update a timetable period slot |
| `POST` | `/absences` | Teacher / Staff | Log faculty planned or emergency absence |
| `GET` | `/proxies/available`| HOD / Dean | Find free faculty available for a slot needing a substitute |
| `POST` | `/proxies/assign` | HOD / Dean | Assign substitute teacher to cover an absent slot |

---

## 8. Security, Privacy & CASA Compliance

The platform is designed to comply with the **Cloud Application Security Assessment (CASA) Tier-2** guidelines and OWASP Top 10 recommendations:

### 8.1 Protection Mechanisms

1. **Anti-BOLA / IDOR Protection**:
   - Every route validates that the requesting user belongs to the target `orgId`.
   - Data access queries consistently filter by `orgId` and verify specific entity ownership.
2. **Classroom-Friendly Authentication Rate Limiting**:
   - Standard IP-based rate limiting can mistakenly lock out an entire classroom sharing a single school NAT/Wi-Fi router.
   - Convee's `authLimiter` pairs the IP with the submitted email (`${ip}:${email}`) and skips rate consumption on successful logins (`skipSuccessfulRequests: true`).
3. **Anti-Caching of Sensitive Student Data**:
   - All `/api/v1` routes automatically send strict cache prevention headers:
     ```http
     Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
     Pragma: no-cache
     Expires: 0
     ```
4. **CASA Audit Logging (`logsCreator`)**:
   - The `logsCreatorMiddleware` captures incoming method, sanitized route, response status, and duration while systematically redacting passwords, session tokens, and Aadhaar numbers.
5. **Private Object Storage**:
   - Google Cloud Storage buckets block public read access by default.
   - Document access, payslips, and bug screenshots are delivered through time-limited (24-hour default) HMAC signed URLs generated on demand.

---

## 9. Environment Configuration Reference

### Backend (`/backend/.env`)

```ini
# Server Configuration
PORT=8001
NODE_ENV=development
CORS_ORIGINS=*
APP_URL=http://localhost:3000

# PostgreSQL Database (Prisma)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_education_db?schema=public

# Authentication Secrets (Change in Production)
JWT_SECRET=dev-local-jwt-secret-not-for-prod
JWT_REFRESH_SECRET=dev-local-jwt-refresh-secret-not-for-prod
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth 2.0
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8001/api/v1/auth/google/callback

# LLM Bridge Microservice
LLM_BRIDGE_URL=http://localhost:8002
DEFAULT_LLM_PROVIDER=openai
DEFAULT_LLM_MODEL=gpt-4o-mini

# Vertex AI (Students, Parents & Alumni)
VERTEX_PROJECT_ID=ai-mall-484810
VERTEX_LOCATION=asia-south1
VERTEX_GEMINI_MODEL=gemini-2.5-flash
STUDENT_LLM_PROVIDER=vertexai
STUDENT_LLM_MODEL=gemini-2.5-flash

# Faculty & Staff LLM (OpenAI)
FACULTY_LLM_PROVIDER=openai
FACULTY_LLM_MODEL=gpt-4o-mini
OPENAI_API_KEY=

# Google Cloud Storage (GCS)
GCS_BUCKET_NAME=convee-education-assets
GCS_PROJECT_ID=ai-mall-484810
GCS_SIGNED_URL_EXPIRY_MINUTES=1440

# Transactional Email (Resend)
RESEND_API_KEY=
EMAIL_FROM=notifications@convee.edu.in
```

### LLM Bridge (`/llm_bridge/.env`)

```ini
LLM_BRIDGE_PORT=8002
VERTEX_PROJECT_ID=ai-mall-484810
VERTEX_LOCATION=asia-south1
VERTEX_GEMINI_MODEL=gemini-2.5-flash
OPENAI_API_KEY=
```

### Frontend Web (`/frontend/.env`)

```ini
REACT_APP_API_URL=http://localhost:8001/api/v1
REACT_APP_WS_URL=http://localhost:8001
```

---

## 10. Local Development, Build & Testing Workflows

### 10.1 Quick Start (Using `run.ps1` on Windows)

The project includes an interactive PowerShell launcher in the root directory:

```powershell
# Interactive Selection Menu
.\run.ps1

# Direct Command Shortcuts
.\run.ps1 backend-dev    # Starts backend on :8001 with hot-reload
.\run.ps1 bridge-dev     # Starts LLM Bridge on :8002 with hot-reload
.\run.ps1 frontend-dev   # Starts React web app on :3000
.\run.ps1 mobile-dev     # Starts Expo mobile development server on :8081
.\run.ps1 build-all      # Compiles backend and frontend for production
.\run.ps1 test-all       # Executes complete functional & security test suites
```

### 10.2 Manual Step-by-Step Setup

#### Step 1: Start PostgreSQL
```powershell
docker compose up -d postgres
```

#### Step 2: Set Up & Seed Backend
```powershell
cd backend
npm install
npx prisma db push
npx prisma generate
npm run seed              # Seeds initial demo data
npm run dev               # Runs server on http://localhost:8001
```

#### Step 3: Set Up LLM Bridge
```powershell
cd llm_bridge
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8002 --reload
```

#### Step 4: Set Up Web Frontend
```powershell
cd frontend
npm install
npm start                 # Opens http://localhost:3000
```

#### Step 5: Set Up Mobile App (Expo)
```powershell
cd mobile
npm install
npx expo start
# Press 'a' for Android Emulator, 'w' for Web Preview, or scan QR with Expo Go
```

### 10.3 Comprehensive Test Suites

The `/backend/scripts` directory contains extensive automated verification scripts:

```powershell
cd backend

# 1. Complete functional test suite (Auth, Orgs, Tasks, Channels, Exams, Fees)
npm test

# 2. Security, Privacy, and Crash Guard Suite (RBAC, BOLA/IDOR, Rate Limiting)
npm run test:security

# 3. CASA Logger & Sensitive Data Redaction Test
npm run test:logger

# 4. Run all suites sequentially
npm run test:all
```

---

## 11. Cloud Deployment & Production Operations

### 11.1 Containerization (Docker)

The repository provides production-ready Dockerfiles for each component:

- `backend/Dockerfile`: Multi-stage Node 20 build with TypeScript compilation and Prisma client generation.
- `llm_bridge/Dockerfile`: Python 3.11 slim image running Uvicorn with async worker processes.
- `frontend/Dockerfile`: Multi-stage build producing static assets served by Nginx Alpine with gzip compression and client-side SPA routing.
- `Dockerfile` (Root): Full-stack single-container deployment mode combining backend and pre-compiled frontend assets.

### 11.2 Google Cloud Run Serverless Architecture

The platform deploys seamlessly to **Google Cloud Run** in the `asia-south1` (Mumbai) region:

```
                    ┌────────────────────────┐
                    │    End User Traffic    │
                    └───────────┬────────────┘
                                │
               ┌────────────────┴────────────────┐
               ▼ (HTTPS)                         ▼ (API / Sockets)
     ┌──────────────────────┐          ┌──────────────────────┐
     │ ai-education-frontend│          │ ai-education-backend │
     │   (React + Nginx)    │          │   (Node + Express)   │
     └──────────────────────┘          └──────────┬───────────┘
                                                  │
                       ┌──────────────────────────┼──────────────────────────┐
                       ▼                          ▼                          ▼
            ┌─────────────────────┐    ┌────────────────────┐     ┌─────────────────────┐
            │ai-education-llm-brid│    │  Cloud SQL (PG 15) │     │ Google Cloud Storage│
            │  (FastAPI + Vertex) │    │  (Managed DB Pool) │     │  (Document Buckets) │
            └─────────────────────┘    └────────────────────┘     └─────────────────────┘
```

#### Automated Deployment Scripts

- **Windows**: `.\deploy-cloudrun.ps1`
- **Linux / macOS**: `./deploy-cloudrun.sh`

The deployment scripts automatically:
1. Enable required GCP APIs (`run`, `artifactregistry`, `aiplatform`, `storage`, `secretmanager`, `sqladmin`).
2. Configure IAM roles for Vertex AI and GCS bucket access.
3. Build and push container images to Google Artifact Registry.
4. Deploy the three services in topological dependency order.
5. Wire up the environment variables and service-to-service URLs.

---

## 12. Pre-Configured Institutions & Credential Directory

The database is pre-seeded with three realistic demo institutions representing distinct educational tiers in India.

> [!NOTE]
> **Default Password for ALL Seeded Accounts**: `Demo1234!`

### Institution 1: Chanakya National Law University (CNLU), New Delhi
- **Slug**: `chanakya-national-law`
- **Domain**: `@cnlu.ac.in`
- **Focus**: National Law University, Cyber Law, Constitutional Law, Judiciary/ADP preparation.

| Role | Name | Email | Designation / Note |
| :--- | :--- | :--- | :--- |
| **DIRECTOR** | Prof. Dr. Vikramaditya Sharma | `director.chanakya@cnlu.ac.in` | Vice Chancellor |
| **DEAN** | Prof. Rajeshwari Venkatraman | `dean.law@cnlu.ac.in` | Dean of Law |
| **HOD** | Dr. Harish Salvekar | `hod.corporate@cnlu.ac.in` | HOD Corporate & IP Law |
| **ADMIN** | Harish Chandra | `admin.chanakya@cnlu.ac.in` | Registrar |
| **ACCOUNTANT**| Rameshwar Nath | `accountant.chanakya@cnlu.ac.in`| CFO & Bursar |
| **TEACHER** | Adv. Meenakshi Sundaram | `faculty.meenakshi@cnlu.ac.in`| Cyber Laws & Evidence |
| **STUDENT** | Aarav Deshmukh | `aarav.deshmukh@cnlu.ac.in` | Admission: `CNLU/2026/CYBER/01` |
| **PARENT** | Suresh Deshmukh | `parent.aarav@cnlu.ac.in` | Parent ID: `PAR-2026-0001` |

---

### Institution 2: Aryabhata Institute of Engineering & Technology, Bengaluru
- **Slug**: `aryabhata-engineering`
- **Domain**: `@aryabhata.edu.in`
- **Focus**: Engineering & Technology, Computer Science, AI, VLSI, Embedded Systems.

| Role | Name | Email | Designation / Note |
| :--- | :--- | :--- | :--- |
| **DIRECTOR** | Dr. K. Radhakrishnan Nair | `director.aryabhata@aryabhata.edu.in` | Director & Chief Academic Officer |
| **PRINCIPAL**| Dr. Anantharamu Hegde | `principal.aryabhata@aryabhata.edu.in`| Principal & Dean of Studies |
| **DEAN** | Prof. Meenakshi Sundaram | `dean.academics@aryabhata.edu.in` | Dean of Engineering Academics |
| **HOD** | Dr. B. N. Chandrashekar | `hod.cse@aryabhata.edu.in` | HOD Computer Science & AI |
| **ADMIN** | Suresh Venkatesh | `admin.aryabhata@aryabhata.edu.in` | Head of Campus Operations |
| **ACCOUNTANT**| K. S. Narayanswamy | `accountant.aryabhata@aryabhata.edu.in`| Finance Officer |
| **TEACHER** | Dr. Ashwini Bhat | `faculty.ashwini@aryabhata.edu.in` | AI & Deep Learning Faculty |
| **STUDENT** | Kunal Sharma | `kunal.sharma@aryabhata.edu.in` | Enrolment: `AIET/2026/CSE/101` |
| **PARENT** | Mahesh Sharma | `parent.kunal@aryabhata.edu.in` | Parent ID: `PAR-2026-0001` |

---

### Institution 3: Tagore International Senior Secondary School, New Delhi
- **Slug**: `tagore-international-school`
- **Domain**: `@tis.edu.in`
- **Focus**: K-12 Schooling, CBSE Board, Secondary & Senior Secondary (Science & Commerce).

| Role | Name | Email | Designation / Note |
| :--- | :--- | :--- | :--- |
| **DIRECTOR** | Dr. Rabindranath Bose | `director.tis@tis.edu.in` | Managing Director & Chairman |
| **PRINCIPAL**| Dr. Shalini Sharma | `principal.tagore@tis.edu.in` | Principal & Head of School |
| **DEAN** | Mrs. Pratibha Sinha | `dean.tagore@tis.edu.in` | Vice Principal & Academic Dean |
| **HOD** | Mr. Suresh Chand Sharma | `hod.secondary@tis.edu.in` | HOD Secondary Wing |
| **ADMIN** | Sunita Bakshi | `admin.tis@tis.edu.in` | Senior Administrative Officer |
| **ACCOUNTANT**| Manohar Lal | `accountant.tis@tis.edu.in` | Fee In-Charge |
| **TEACHER** | Mr. Rajesh Kumar Verma | `faculty.rajesh@tis.edu.in` | PGT Physics |
| **STUDENT** | Aarush Mehra | `aarush.mehra@tis.edu.in` | Roll No: `TIS/2026/11SCI/01` |
| **PARENT** | Deepak Mehra | `parent.aarush@tis.edu.in` | Parent ID: `PAR-2026-0001` |

---

*Documentation compiled and maintained for Convee AI Education Platform. For additional details, refer to `COMMANDS.md` for build shortcuts and `GCP_DEPLOYMENT_GUIDE.md` for serverless production operations.*

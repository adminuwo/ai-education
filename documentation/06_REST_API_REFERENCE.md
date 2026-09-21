# 📡 Convee Education — Comprehensive REST API Reference

All endpoints are mounted under `/api/v1` and require `Authorization: Bearer <token>` unless marked Public.

---

## 1. Authentication & Identity (`/api/v1/auth`)

| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Public (Rate-limited) | Register a new user and institution |
| `POST` | `/login` | Public (Classroom-safe) | Authenticate user; returns access and refresh tokens |
| `POST` | `/refresh` | Public | Refresh expired access token using refresh token |
| `POST` | `/logout` | Authenticated | Revoke refresh token and invalidate session |
| `GET` | `/me` | Authenticated | Fetch current user profile and active memberships |
| `GET` | `/google/start` | Public | Initiate Google OAuth 2.0 flow |
| `POST` | `/google/callback` | Public | Exchange Google auth code for JWT tokens |
| `POST` | `/forgot-password` | Public (Strict rate limit) | Send password reset email |
| `POST` | `/reset-password` | Public | Reset password using one-time token |
| `GET` | `/student-join/verify`| Public | Verify student admission invite code |
| `POST` | `/student-join` | Public | Complete student self-enrollment into assigned class |

---

## 2. Organizations & Campus Hierarchy (`/api/v1/orgs`)

| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Authenticated | List all organizations the user belongs to |
| `POST` | `/` | Authenticated | Create a new organization (user becomes `OWNER`) |
| `GET` | `/:orgId` | Member | Get organization profile, stats, and structure |
| `POST` | `/:orgId/departments` | Admin / Director | Create an academic department |
| `POST` | `/:orgId/teams` | Admin / Dean | Create a class section or faculty team |
| `POST` | `/:orgId/projects` | Teacher / Student | Create a collaborative project |
| `GET` | `/:orgId/members` | Member | List institutional members with search/role filters |
| `POST` | `/:orgId/members` | Admin / Registrar | Add or enroll a user into the institution |
| `DELETE`| `/:orgId/members/:userId`| Admin / Owner | Deactivate or remove a user's membership |

---

## 3. Real-Time Chat & Channels (`/api/v1/channels`)

| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Member | List channels accessible to the user |
| `POST` | `/` | Member | Create a public, private, or team channel |
| `POST` | `/dm` | Member | Create or fetch a direct message channel |
| `GET` | `/:channelId/messages` | Channel Member | Fetch paginated channel message history |
| `POST` | `/:channelId/messages` | Channel Member | Post message (supports rich text and attachments) |
| `POST` | `/:channelId/read` | Channel Member | Mark messages as read (updates read receipts) |
| `POST` | `/messages/:id/reactions`| Channel Member | Add emoji reaction to a message |
| `POST` | `/messages/:id/pin` | Channel Admin | Pin message to channel announcement bar |

---

## 4. AI & Study Buddy (`/api/v1/ai`)

| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/chat` | Authenticated | Multi-turn AI chat with automated persona routing and guardrails |
| `POST` | `/summarize-channel` | Member | Summarize up to 100 recent channel messages |
| `POST` | `/draft-reply` | Member | Generate AI-assisted draft response |
| `POST` | `/daily-briefing` | Authenticated | Generate morning briefing (tasks, timetable, notices) |
| `GET` | `/student/daily-quiz` | Student | Fetch today's adaptive 5-question AI quiz |
| `POST` | `/student/daily-quiz/generate`| Student | Force-generate quiz for a chosen subject |
| `POST` | `/student/daily-quiz/:id/submit`| Student | Submit answers; returns score, explanations & streak |
| `GET` | `/student/daily-quiz/history` | Student | Fetch past quiz performance logs |

---

## 5. Attendance Operations (`/api/v1/attendance`)

| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/batch` | Teacher / Admin | Batch-record daily attendance for a class |
| `GET` | `/team/:teamId` | Teacher / Admin | Fetch attendance roster for a class on a date |
| `GET` | `/stats` | Authenticated | Fetch individual student attendance statistics |
| `GET` | `/department/:id/analytics`| HOD / Dean | Department-level attendance trends and analytics |

---

## 6. Examinations & Report Cards (`/api/v1/exams`)

| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Member | List examination sessions |
| `POST` | `/` | Principal / Admin | Create a new examination session |
| `POST` | `/:examId/subjects` | Admin / HOD | Add subject papers to an exam |
| `POST` | `/:examId/scores` | Teacher / HOD | Submit student marks and grades |
| `POST` | `/:examId/generate-report-cards`| Principal / Admin | Compile marks into official report cards with AI remarks |
| `GET` | `/report-cards/:id` | Student / Parent / Staff| Fetch signed digital report card |
| `PATCH`| `/report-cards/:id/publish`| Principal / Dean | Publish report card for student/parent viewing |

---

## 7. Institutional Finance & Tally Sync (`/api/v1/finance`)

| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/tally/status` | Accountant / Admin | Check connection to local Tally ERP instance (:9000) |
| `POST` | `/tally/sync-all` | Accountant / Admin | Trigger bi-directional sync (Fees, Payroll, Expenses) |
| `GET` | `/fees` | Accountant / Admin | List student fee ledgers with status and search filters |
| `POST` | `/fees` | Accountant | Record student fee collection and create Tally receipt |
| `GET` | `/payroll` | Accountant / Admin | List staff payroll records and disbursements |
| `POST` | `/payroll/disburse`| Accountant | Disburse monthly salary and create Tally voucher |
| `GET` | `/expenses` | Accountant / Admin | View operational expenses categorized by account |
| `POST` | `/expenses` | Accountant | Record new operational expense |
| `GET` | `/bank-accounts` | Accountant / Admin | List institution bank accounts and balances |
| `GET` | `/society-funds` | Accountant / Admin | Manage corpus funds, grants, and endowments |
| `GET` | `/cash-registers`| Accountant | View physical cash desk balances and transactions |
| `GET` | `/fixed-assets` | Accountant / Admin | Capital asset register with depreciation schedules |
| `GET` | `/export/tally-xml`| Accountant | Download comprehensive Tally XML master import file |

---

## 8. Timetable & Proxy Management (`/api/v1/timetable`)

| Method | Route | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/class/:teamId` | Member | Fetch weekly 8-period timetable grid for a class |
| `POST` | `/slot` | Admin / HOD | Create or update a timetable period slot |
| `POST` | `/absences` | Teacher / Staff | Log faculty leave/absence |
| `GET` | `/proxies/available`| HOD / Dean | Find free faculty available for a slot needing a substitute |
| `POST` | `/proxies/assign` | HOD / Dean | Assign substitute teacher to cover an absent slot |

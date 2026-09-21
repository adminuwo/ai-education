# 🗄️ Convee Education — Database Schema & Prisma Data Models

Convee Education uses **Prisma ORM 5.22** on **PostgreSQL 15**. The schema defines **36 relational entities** partitioned across five functional domains.

---

## 1. Domain Entity Relationship Diagram

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

---

## 2. Complete Model Catalog (36 Entities)

### Core Auth & Organizational Hierarchy
1. **`User`**: Core identity for all users (name, email, passwordHash, googleId, systemRole, avatarUrl).
2. **`RefreshToken`**: Manages sliding JWT sessions with token rotation and revocation tracking.
3. **`EmailVerificationToken`**: Single-use verification tokens for account activation.
4. **`Organization`**: Multi-tenant boundary entity (`name`, `slug`, `ownerId`).
5. **`Department`**: Academic faculties / administrative divisions (`name`, `orgId`, `headId`).
6. **`Team`**: Classes, sections, or faculty working groups (`name`, `departmentId`, `managerId`).
7. **`Project`**: Collaborative initiatives linked to teams or departments.
8. **`ProjectTeam`**: Join table supporting multi-team project sharing.
9. **`Membership`**: User enrollment within an organization with role (`OrgRole`).
10. **`RolePermission`**: Dynamic JSON permission overrides for roles per organization.

### Communication & Collaboration
11. **`Channel`**: Multi-party chat spaces (`PUBLIC`, `PRIVATE`, `DIRECT`, `TEAM`, `ANNOUNCEMENT`).
12. **`ChannelMember`**: Membership link between users and channels with notifications flag.
13. **`Message`**: Chat messages supporting threads (`parentId`), rich types, and edits.
14. **`Reaction`**: Emoji reactions on messages.
15. **`MessageRead`**: Read receipts tracking message views per user.
16. **`PinnedMessage`**: Pinned announcements within channels.
17. **`FileAsset`**: Uploaded file metadata pointing to local disk or Google Cloud Storage.
18. **`Attachment`**: Polymorphic link attaching files to messages, tasks, or meetings.
19. **`Meeting`**: Video meetings and live classes with AI summary and action items.
20. **`MeetingAttendee`**: Meeting attendance tracking (`invited`, `attended`).
21. **`Notification`**: System and user notifications with direct link URLs.

### Academic Operations & Grading
22. **`AttendanceRecord`**: Daily student attendance (`PRESENT`, `ABSENT`, `LATE`, `EXCUSED`).
23. **`HomeworkSubmission`**: Student homework submissions, rubric scores, and teacher remarks.
24. **`ParentStudentLink`**: Links parent accounts to student accounts.
25. **`TimetableSlot`**: Weekly period scheduling grid (Periods 1–8, Monday–Saturday).
26. **`TeacherAbsence`**: Faculty planned or emergency absences.
27. **`ProxyAssignment`**: Substitute teacher assignments for absent periods with HOD approval.
28. **`AcademicPromotionConfig`**: Grade-to-grade progression mapping.
29. **`AcademicBatchArchive`**: JSON snapshots of graduated or promoted classes.
30. **`AlumniGroup`**: Designated communication groups for graduated cohorts.
31. **`Exam`**: Assessment sessions (`MID_TERM`, `FINAL`, `UNIT_TEST`, `PRACTICAL`).
32. **`ExamSubject`**: Subject papers within an exam with maximum and passing marks.
33. **`ExamScore`**: Student scores and grades for individual subjects.
34. **`ReportCard`**: Terminal report cards with AI remarks and multi-tier digital signatures.
35. **`StudentDailyQuiz`**: Daily adaptive 5-question AI quizzes with streak tracking.

### Financial Management & Tally Integration
36. **`StudentFeeLedger`**: Student fee tracking, payment status, receipts, and Tally sync.
37. **`PayrollRecord`**: Staff monthly salary disbursements and payslips.
38. **`ExpenseRecord`**: Institutional operational expenses categorized by account.
39. **`BankAccount`**: Institution bank accounts and current balances.
40. **`SocietyFund`**: Trust corpus, infrastructure grants, and scholarship endowments.
41. **`CashRegister`**: Physical cash counters and petty cash floats.
42. **`CashTransaction`**: Cash vouchers (in, out, bank deposits).
43. **`FixedAsset`**: Capital asset registers with straight-line or WDV depreciation.
44. **`TallyTombstone`**: Deletion logs to synchronize deleted records with Tally ERP.

### AI, Compliance & Diagnostics
45. **`AIConversation`**: Multi-turn AI chat sessions.
46. **`AIMessage`**: Individual user or assistant turns within a conversation.
47. **`AITokenUsageLog`**: Token counts, models, and USD cost tracking per AI call.
48. **`AIGuardrailEvent`**: Audit log of safety guardrail interventions.
49. **`BugReport`**: User crash/bug reports with GCS screenshots and stack traces.
50. **`LegalDocumentAsset`**: Parsed Indian Bare Acts, case laws, and PYQs.
51. **`LegalScraperJob`**: Background scraping jobs for India Code and Supreme Court eSCR.
52. **`AuditLog`**: Immutable audit logs of administrative actions.

# 🏛️ Convee Education — Multi-Tenant Campus Hierarchy & RBAC Matrix

## 1. Multi-Tenant Organization Model

Convee Education enforces strict organizational isolation across all database operations. Every student roster, timetable slot, fee entry, and message is linked directly to an `orgId`.

```
Organization (e.g. Chanakya National Law University)
 │
 ├── Departments (e.g. Department of Cyber Law, Secondary Wing)
 │    │
 │    └── Teams / Classes (e.g. Class 10-A, 3rd Year CSE, LL.M. Section 1)
 │         │
 │         ├── Projects (e.g. Moot Court Competition, Science Project)
 │         │    └── Project Tasks, Milestones, and Subtasks
 │         │
 │         └── Enrolled Students & Assigned Class Teachers
 │
 └── Channels (Public, Departmental, Class-specific, Direct Messages)
```

---

## 2. Two-Tier Role Architecture

Access control is evaluated across two distinct role layers:
1. **SystemRole**: Global authorization level assigned to the user identity (`SUPER_ADMIN`, `ACCOUNTANT`, `USER`).
2. **OrgRole**: Role of the user within an individual institution's `Membership` record.

### Comprehensive Matrix of Institutional Roles (11 Roles)

| OrgRole | Primary Personas | Key Permissions & Responsibilities |
| :--- | :--- | :--- |
| **`OWNER`** | Founder, Trust Chairman | Full administrative control, institutional deletion, billing, and root configurations. |
| **`DIRECTOR`** | Managing Director, Vice Chancellor | Campus-wide governance, macro-analytics, institutional reporting, strategic approvals. |
| **`PRINCIPAL`**| Head of School, College Principal | Academic policies, exam publishing, proxy sign-off, disciplinary reviews. |
| **`DEAN`** | Dean of Studies, Dean of Academics | Departmental curricula, faculty leaves, proxy allocations, cross-department scheduling. |
| **`HOD`** | Head of Department | Subject allocations, teacher timetable slotting, substitute teacher assignments. |
| **`ADMIN`** | Registrar, Operations Manager | Student admissions, staff onboarding, ID card generation, academic promotions. |
| **`ACCOUNTANT`**| Bursar, Chief Finance Officer | Fee collection, Tally ERP sync, payroll processing, fixed assets, cash desk balancing. |
| **`TEACHER`** | Faculty, Professor, PGT/TGT | Class attendance, homework assignments, rubric-based grading, timetable inspection. |
| **`STUDENT`** | Enrolled Pupil, College Undergrad | Homework submissions, daily adaptive AI quizzes, attendance view, report cards. |
| **`PARENT`** | Father, Mother, Legal Guardian | Multi-child switcher, attendance tracking, fee balances, published report cards. |
| **`ALUMNI`** | Graduated Student, Brand Ambassador| Mentorship channels, university news, career networking. |

---

## 3. Dynamic Custom Role Permissions Engine

For institutions requiring bespoke permission assignments, Convee Education provides a dynamic permissions override engine managed via the `RolePermission` entity:

```typescript
// Sample RolePermission record
{
  id: "perm-uuid-001",
  orgId: "chanakya-national-law",
  role: "EXAM_COORDINATOR",
  isSystem: false,
  permissions: [
    "exams:create",
    "exams:grade",
    "exams:publish",
    "report_cards:sign",
    "analytics:view_department"
  ]
}
```

- **Runtime Verification**: Middleware evaluates whether a user's assigned role possesses the required action string prior to handler invocation.
- **Hierarchical Fallback**: If no custom override exists for a role, the system falls back to default role permission blueprints.

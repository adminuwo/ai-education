# 🔒 Convee Education — Security, Privacy & CASA Compliance

Convee Education is engineered in accordance with the **Cloud Application Security Assessment (CASA) Tier-2** guidelines and OWASP Top 10 web application security principles.

---

## 1. Anti-BOLA & Anti-IDOR Authorization Controls

- **Broken Object Level Authorization (BOLA)** is the #1 vulnerability in multi-tenant educational platforms.
- Every endpoint validates that the target entity (e.g. `teamId`, `channelId`, `studentId`, `feeId`) belongs to the requesting user's active `orgId`.
- Direct ID lookups without an institutional tenancy constraint are strictly forbidden in repository and route layers.

---

## 2. Classroom-Friendly Authentication Rate Limiting

Standard rate limiters often lock out legitimate students when an entire classroom connects through a shared school Wi-Fi / NAT router with a single public IP.

Convee Education's `authLimiter` addresses this through two design choices:
1. **Compound Keying**: Combines IP address and normalized email (`${ip}:${email}`) so a brute-force attack on one student's account will not impact other students sharing the same network.
2. **Skip Successful Logins**: Legitimate authentications consume zero rate-limit quota (`skipSuccessfulRequests: true`), ensuring seamless morning logins for hundreds of students simultaneously.

---

## 3. Data Minimization & Anti-Caching Headers

To prevent sensitive academic records, exam marks, or financial statements from being cached on shared library or laboratory computer browsers, all authenticated `/api/v1` routes automatically emit anti-caching HTTP headers:

```http
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate
Pragma: no-cache
Expires: 0
```

---

## 4. CASA Audit Logging (`logsCreatorMiddleware`)

All inbound requests are audited via the `logsCreator` middleware:
- **Sanitization**: Systematically strips passwords, authorization bearer headers, credit card strings, Aadhaar card patterns, and session tokens before emitting log records.
- **Structured Fields**: Captures timestamp, HTTP method, route, response status, duration, IP address, and authenticated user ID.

---

## 5. Storage Security & Signed URLs

- Google Cloud Storage (GCS) buckets are configured with **Public Access Prevention** enforced.
- Student document submissions, faculty payslips, and bug screenshots are accessed exclusively through time-limited HMAC signed URLs generated on-demand (24-hour default expiration).

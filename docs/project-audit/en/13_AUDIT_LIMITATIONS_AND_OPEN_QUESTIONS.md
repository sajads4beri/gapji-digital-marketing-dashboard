# 13 — AUDIT LIMITATIONS & OPEN ARCHITECTURAL QUESTIONS
## Forensic Constraints, Specification Ambiguities, and Strategic Business Decisions

---

## 1. AUDIT LIMITATIONS & STATIC ANALYSIS BOUNDARIES

1. **Read-Only Non-Destructive Constraint**:
   - In strict compliance with the audit mandate, no database migrations, Git merges, or source code modifications were executed.
   - The NestJS API on port 3001 is currently running from `F:/marketing-platform-backend`. Database integrity assertions were verified via HTTP API queries and static inspection of `schema.prisma`.
2. **Dynamic UI Testing Limitations**:
   - Automated scripts in `apps/web/scripts/` test Node.js runtime logic, mock storages, and regex component signatures. Full visual regressions and cross-browser rendering tests require an active Playwright headless browser runner in a CI environment.

---

## 2. SPECIFICATION AMBIGUITIES REQUIRING PRODUCT DECISIONS

The following 6 areas in `marketing-platform-phase1-frontend-pages-1.pdf` contain business or technical ambiguities that must be resolved by the Product Owner:

### 1. SMS Provider Gateway Integration vs CSV Import
- **Specification (Page 17)**: Mentions SMS dispatches table, delivery logs, and CSV import.
- **Ambiguity**: Does the client intend to send SMS messages directly through an integrated Iranian SMS Provider API (e.g. Kavenegar, Faraz SMS, SMS.ir, Magfa) in Phase 1, or is the system exclusively intended to import and log SMS campaign reports generated externally via CSV?
- **Architectural Impact**: If an active API gateway is required, an SMS dispatch provider adapter with API credentials management must be built into `apps/api/src/modules/sms/`.

### 2. Webinar Platform Integration vs External Session Links
- **Specification (Page 17–18)**: Details webinar creation with a "لینک جلسه" (Session Link) field and attendee list import.
- **Ambiguity**: Will webinars be hosted externally on platforms like Skyroom (اسکای‌روم), Adobe Connect, or Google Meet (where Gapji merely stores the meeting URL), or is an embedded WebRTC/Jitsi meeting room expected inside the app?
- **Architectural Impact**: Hosting externally requires only standard URL validation; self-hosted WebRTC requires heavy media server infrastructure (Janus/Mediasoup), which is out of Phase 1 scope.

### 3. WordPress Plugin vs Standard Webhook Receiver
- **Specification (Page 24, Page 29)**: Mentions "دانلود افزونه" (Download Plugin) alongside API key generation and Gravity Forms field mapping.
- **Ambiguity**: Is there an existing WordPress PHP plugin repository maintained by Gapji, or should the platform provide a standard generic Gravity Forms / Contact Form 7 webhook integration documentation with a downloadable lightweight PHP bridge script?
- **Architectural Impact**: If a full custom WordPress plugin must be developed, that is a separate PHP/WordPress codebase outside the TypeScript monorepo.

### 4. Video Streaming for Team Learning (Page 24)
- **Specification (Page 21)**: Mentions embedded video player with playback speed and resume playback.
- **Ambiguity**: Where will training videos be hosted?
  - Option A: Self-hosted MP4/HLS files stored on MinIO / S3.
  - Option B: Embedded players from Iranian video hosts (Aparat) or YouTube / Vimeo.
- **Recommendation**: Support direct MP4 streaming from S3/MinIO with native HTML5 `<video>` controls and fallback iframe embed support for Aparat.

### 5. Multi-Tenant Organization Isolation Scope
- **Specification (Page 6, Page 23)**: Mentions switching between multiple organizations for a user.
- **Ambiguity**: Are contacts, leads, campaigns, and costs 100% strictly segregated per organization (shared nothing multi-tenancy), or can an Agency Administrator view cross-organizational aggregate dashboards?
- **Recommendation**: Strict tenant segregation by default. Every database table must have `organizationId` foreign key and row-level tenant security.

### 6. Persian Calendar Component Library Selection
- **Specification (Page 28)**: Recommends `react-day-picker` with `date-fns-jalali` or a custom component.
- **Current State**: `apps/web/src/components/ui/persian-date-picker.tsx` is an extensively customized pure React component passing leap year verification in `test-persian-date.mjs`.
- **Recommendation**: Retain the existing custom `persian-date-picker.tsx` rather than introducing third-party date-picker wrappers, as it is already battle-tested against the project's design tokens.

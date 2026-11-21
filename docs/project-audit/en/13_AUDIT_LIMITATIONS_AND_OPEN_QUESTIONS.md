# 13 — Audit Limitations and Open Questions
## Gapji Digital Marketing Platform Deep Audit

---

## 1. Audit Scope & Verification Limitations

In strict adherence to the **Read-Only Audit Policy (Part 1)**, the audit observed the following methodological boundaries:

1. **Non-Destructive Execution Policy:**
   Existing source files, configuration manifests, Git commit history, and database records remained 100% untouched.
2. **Selective Automated Test Execution:**
   - Pure algorithmic and contract tests that run entirely in-memory (`test-persian-date.mjs`, `test-permissions-matrix.mjs`, `test-permissions-hardening.mjs`, `test-data-table.mjs`, `test-filter-service.mjs`, `campaigns.service.spec.ts`) were executed and verified at 100% pass rates.
   - The 21 backend integration specs (`*.integration.spec.ts`) that execute live SQL mutations against PostgreSQL (inserting, modifying, and deleting database records) were **statically analyzed** rather than executed against the local database to guarantee zero data corruption.
3. **Absence of Running Backend Process:**
   During static audit execution, backend port 3001 and frontend port 3000 were idle; PostgreSQL service was running on port 5432. All network and API communications were validated via static contract code inspection.

---

## 2. Product Specification Ambiguities & Clarifications

The following product and business questions were identified during PDF requirements analysis and require formal determination from the Product Owner:

### Q1: Campaign Routing Standard (`/campaigns` vs `/performance/campaigns`)
- **Document Text:** The PDF page 8-10 designates routes as `/performance/campaigns`, `/performance/campaigns/new`, `/performance/campaigns/:id`. The current Next.js App Router exposes `/campaigns`, `/campaigns/new`, `/campaigns/[id]`.
- **Note in PDF (p. 6):** *"The paths are suggested and the frontend team can adjust the address structure to fit the chosen framework; however, each page must have an independent, shareable address."*
- **Question for Product Owner:** Should the platform maintain `/campaigns` with a URL rewrite alias for `/performance/campaigns`, or should the physical directory structure be migrated to `/performance/campaigns`?
- **Engineering Recommendation:** Maintain `/campaigns` and add a transparent Next.js rewrite rule in `next.config.js` to support both URLs without breaking existing links (`PHASE-001`).

### Q2: Currency Unit Switching & Historical Conversion Policy
- **Document Text:** The PDF page 4 specifies a single monetary unit (Toman or Rial) per organization, configured in Organization Settings (`/settings/organization`).
- **Approved Project Decision (docs/PROJECT-DECISIONS.md):** The system does not automatically multiply or divide existing stored monetary values by 10 when switching between Toman and Rial, preserving exact stored numbers without semantic mutation.
- **Question for Product Owner:** If an organization switches its unit from Toman to Rial, should the system display a prominent confirmation dialog stating: *"Existing historical numbers will not be converted; only the display label and future inputs will reflect Rial"*?
- **Engineering Recommendation:** Enforce the explicit confirmation dialog and prevent accidental currency switches.

### Q3: WordPress Inbound Webhook Lead Assignment Strategy
- **Document Text:** Page 29 documents WordPress webhook ingestion and form field mapping to lead fields.
- **Ambiguity:** How should incoming WordPress leads be assigned to sales agents when no specific sales agent ID is passed in the webhook payload?
- **Proposed Business Strategies:**
  - *Option A (Default):* Leave `assignedToId = null` ("بدون کارشناس"), allowing the Marketing Manager or Sales Lead to assign them manually from the Lead Inbox.
  - *Option B (Round-Robin):* Automatically distribute incoming leads evenly among active sales agents.
- **Engineering Recommendation:** Implement Option A for MVP (matching manual inbox assignment), with an optional round-robin toggle in Organization Settings.

### Q4: Meeting Minutes Email Dispatch Service
- **Document Text:** Page 22 specifies a "Send to all" button with email preview and confirmation for meeting minutes.
- **Ambiguity:** Which email transport provider should be integrated for outbound transactional emails in production?
- **Proposed Solutions:** SMTP relay, Kavenegar / Iranian transactional email provider, or AWS SES / SendGrid.
- **Question for Product Owner:** Which transactional email gateway provider is preferred for the production deployment?

---

## 3. Engineering Recommendations for Product Evolution

1. **Adopt Redis for Shared Caching & Distributed Job Queues:**
   Currently, background import jobs run in-memory within the NestJS process. Adopting Redis with BullMQ will enable reliable background processing, scheduled report delivery, and distributed locking.
2. **Implement Real-Time Push via WebSockets / Server-Sent Events (SSE):**
   Replace HTTP polling on notifications, lead inbox updates, and task changes with an authenticated WebSocket or SSE stream, reducing backend database load and improving collaborative user experience.
3. **Automate Continuous Integration & Container Security Scanning:**
   Enforce strict GitHub Actions workflows verifying linting, unit tests, integration suites, and Docker image vulnerability scanning before code merges to main branches.

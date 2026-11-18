# 08 — SECURITY & TECHNICAL QUALITY ASSESSMENT
## Static Security Audit, OWASP Top 10 Evaluation, and Code Quality Analysis

---

## 1. CODE QUALITY & MAINTAINABILITY AUDIT

### 1.1 Modularity & Separation of Concerns
- **Frontend (`apps/web`)**: Architecture follows a feature-driven layout (`src/features/<feature>/...`) separating UI components, API clients, and types. However, because mock fallbacks were added directly into services, business logic is coupled with browser `localStorage` utilities.
- **Backend (`apps/api`)**: Follows NestJS standard modular design (Controllers, Services, DTOs). In the backend branch, Prisma is utilized cleanly through `prisma.service.ts` with global exception filtering (`prisma-client-exception.filter.ts`).

### 1.2 Type Safety & Contract Integrity
- **TypeScript Strictness**: Root and app `tsconfig.json` have `strict: true` enabled.
- **DTO Validation**: Backend DTOs use `class-validator` decorators (`@IsString()`, `@IsNotEmpty()`, `@IsEnum()`, `@Min()`). Global NestJS `ValidationPipe` enforces `whitelist: true` and `forbidNonWhitelisted: true`.
- **Deficiency**: The frontend lacks Zod validation schemas. Form validation is performed through manual if/else checks or regex assertions inside React components.

---

## 2. FRONTEND QUALITY & ACCESSIBILITY AUDIT

### 2.1 Persian Localization & Typography
- **Font Implementation**: `Vazirmatn` font is properly integrated locally via `next/font/local` in `apps/web/public/fonts/vazirmatn/` avoiding external Google Fonts blocking inside Iran.
- **RTL Support**: Root layout explicitly declares `<html lang="fa" dir="rtl">`. Tailwind classes predominantly use logical properties (`start/end`, `ms/me`).
- **Persian Calendar Accuracy**: `persian-date.ts` correctly implements leap year calculations for 33-year cycles (verified by passing all tests in `test-persian-date.mjs`). Week starts strictly on Saturday (شنبه).

### 2.2 Responsive Design & Viewports
- Layouts are responsive with dedicated mobile viewports:
  - Mobile slide-over drawer (`mobile-sidebar.tsx`).
  - Mobile card views for Leads Inbox (`lead-inbox-mobile-card.tsx`).
  - Dedicated mobile card views for Tasks and Users.

---

## 3. STATIC SECURITY AUDIT & RBAC ASSESSMENT

### 3.1 Authentication & Token Lifecycle
```
[Client] --- POST /auth/login ---> [NestJS]
         <--- { accessToken (Memory) } + Set-Cookie: refresh_token (HttpOnly) ---
```
- **Access Tokens**: Stored strictly in module-scoped JavaScript memory (`memoryAccessToken` in `apps/web/src/lib/api.ts`). Never persisted to `localStorage` or `sessionStorage`, protecting against XSS token exfiltration.
- **Refresh Tokens**: Transmitted via `HttpOnly`, `SameSite: Lax` secure cookies, protecting against JavaScript access.
- **Concurrency Queueing**: Axios interceptor in `api.ts` queues parallel requests during an active token refresh operation, preventing race conditions and duplicate refresh requests.
- **Password Hashing**: Backend uses **Argon2id** (`argon2.hash()`), complying with OWASP password storage recommendations.

### 3.2 Role-Based Access Control (RBAC)
- 6 canonical roles (`admin`, `marketing_manager`, `campaign_manager`, `sales_agent`, `content_creator`, `client`).
- **Access Matrix**: Evaluated in `test-permissions-matrix.mjs` across 29 pages.
- **Critical Flaw Discovered (ITEM-08)**:
  - While route navigation correctly prevents `sales_agent` from accessing administrative routes, the mock lead data service fails to filter out leads owned by other agents if `assignedToId` is omitted from the request.
  - **Fix Required**: All database queries must enforce tenant and user boundaries on the server:
    ```typescript
    where: {
      organizationId: currentUser.organizationId,
      ...(currentUser.role === 'sales_agent' ? { assignedToId: currentUser.id } : {})
    }
    ```

### 3.3 Data Masking & PII Protection
- Mobile phone masking (`0912***4567`) is implemented in `apps/web/src/lib/permissions.ts`.
- **Limitation**: Currently performed on the frontend. A malicious user with network tools can inspect raw API JSON responses to see unmasked phone numbers.
- **Fix Required**: Masking must be performed at the API serializer / DTO interceptor level on the backend for unauthorized roles.

---

## 4. OWASP TOP 10 EVALUATION SCORECARD

| OWASP Vulnerability | Risk Level | Current Mitigation Status | Required Remediation |
| :--- | :---: | :--- | :--- |
| **A01: Broken Access Control** | **HIGH** | Role checks present in UI & routes; backend scoping needs strict multi-tenant enforcement. | Enforce `organizationId` & `assignedToId` in all Prisma queries. |
| **A02: Cryptographic Failures** | **LOW** | Passwords hashed with Argon2id; JWT secret configurable in `.env`. | Enforce HTTPS in production; rotate JWT secrets. |
| **A03: Injection (SQL/NoSQL)** | **LOW** | Prisma ORM & TypeORM parameterized queries prevent SQL injection. | Never use `prisma.$queryRawUnsafe` with user inputs. |
| **A04: Insecure Design** | **MEDIUM** | Frontend dual-layer mock architecture exposes client-side state manipulation. | Unify monorepo and transition 100% to backend database. |
| **A05: Security Misconfiguration** | **MEDIUM** | Default `.env` credentials present in repository (`gapji_password`). | Mandate production secrets via external secret manager. |
| **A06: Vulnerable Components** | **LOW** | Modern versions: Next.js 14.2.3, NestJS 10.3.0, Prisma 5.22.0. | Run continuous `pnpm audit` in CI pipeline. |
| **A07: Identification & Auth** | **LOW** | In-memory access token + HttpOnly cookie refresh pattern is robust. | Add brute-force rate-limiting (`@nestjs/throttler`) on `/login`. |
| **A08: Software & Data Integrity**| **MEDIUM** | Monorepo branches unmerged; risk of deploying stale builds. | Unify branches into single protected `main` branch. |
| **A09: Security Logging** | **HIGH** | No centralized logging in backend; console.log used ad-hoc. | Implement Winston / Pino structured JSON logging. |
| **A10: Server-Side Request Forgery**| **LOW** | No outbound webhook dispatching active in current MVP. | Validate destination URLs when WordPress integration is built. |

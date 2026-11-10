# Project Decisions Record (PDR)
## Gapji Digital Marketing Platform

This document serves as the canonical register of product, architectural, financial, and currency decisions for the Gapji Digital Marketing Platform backend.

---

## 1. Governance & Priority Rules

1. **Primary Source of Truth:** The official product document `marketing-platform-phase1-frontend-pages-1.pdf` is the primary source of truth for UI, workflows, and business definitions.
2. **Precedence Hierarchy:**
   - **Explicit User-Approved Project Decisions** take binding precedence over ambiguous or conflicting document wording.
   - **Documented Requirements** take precedence over generic conventions or assumptions.
   - Any gap not specified in the document or approved decisions is marked as `NOT SPECIFIED IN PRODUCT DOCUMENT` or `PRODUCT DECISION REQUIRED`.

### Taxonomy of Decisions
- `DOCUMENTED REQUIREMENT`: Explicitly stated in the official product document (with page citation).
- `APPROVED PROJECT DECISION`: Explicitly approved binding decision by the product owner/user.
- `IMPLEMENTATION DECISION`: Technical choice required to implement a documented or approved requirement.
- `PRODUCT DECISION REQUIRED`: Unresolved product/business question requiring product owner determination.
- `TECHNICAL RECOMMENDATION`: Engineering suggestion that does not alter documented behavior.

---

## 2. Financial Precision Policy

| Policy Element | Rule & Definition | Provenance & Source | Status |
| :--- | :--- | :--- | :---: |
| **Input Precision** | Monetary inputs in Toman or Rial must be non-negative integers (`>= 0`). Decimal monetary input is strictly rejected with HTTP 400. | `APPROVED PROJECT DECISION` & `DOCUMENTED REQUIREMENT` (p. 4, §2-1; p. 27, §5-1) | **Implemented** (`@IsInt()`, `@Min(0)`) |
| **Input Normalization** | Persian/Arabic digits (`۰-۹`, `٠-٩`) and thousands separators (`٬`, `,`) are automatically normalized to standard ASCII digits before validation. | `APPROVED PROJECT DECISION` & `DOCUMENTED REQUIREMENT` (p. 27, §5-1) | **Implemented** (`@Transform`) |
| **Database Storage** | Monetary fields (`budget`, `spend`) preserve `Decimal(12, 2)` in PostgreSQL via Prisma. No precision or scale changes or migrations in this phase. | `APPROVED PROJECT DECISION` | **Implemented** (`schema.prisma`) |
| **API Serialization** | `budget` and `spend` are returned as integer JSON numbers (e.g. `50000000`) for all application-created records, matching `@gapji/shared` interface. | `APPROVED PROJECT DECISION` & `IMPLEMENTATION DECISION` | **Implemented** (`serializeCampaign`) |
| **Fractional Stored Values** | If a fractional value exists in storage, the API returns the exact numeric value without silent rounding or truncation. | `APPROVED PROJECT DECISION` | **Implemented** (No silent rounding) |
| **Operational Data Context** | There is currently no operational business data in the database. Historical fractional records are not an existing migration problem. | `APPROVED PROJECT DECISION` | **Acknowledged** |
| **Full Display Format** | Full monetary amounts are displayed with thousands separators, Persian digits, and without decimal places (e.g. `۱۲٬۵۰۰٬۰۰۰ تومان`). | `DOCUMENTED REQUIREMENT` (p. 4, §2-1) | **Implemented in UI** |
| **KPI Card Display** | Large KPI numbers may be abbreviated with 1 decimal place (e.g. `۱۲٫۵ میلیون تومان`), with the full exact integer amount in a tooltip. | `DOCUMENTED REQUIREMENT` (p. 4, §2-1) | **Implemented in UI** |
| **Percentage Display** | Percentages must be displayed with exactly 1 decimal place (e.g. `۲۳٫۵٪`). | `DOCUMENTED REQUIREMENT` (p. 4, §2-1) | **Implemented in UI** |
| **Rounding Policy** | No arbitrary or unapproved rounding rule (such as banker's rounding, floor, or ceil) is authorized or introduced in this phase. | `APPROVED PROJECT DECISION` | **Enforced** |

---

## 3. Currency Scope Policy

| Policy Element | Rule & Definition | Provenance & Source | Status |
| :--- | :--- | :--- | :---: |
| **Scope of Currency** | Currency is independently configured for each Organization under Organization Settings (`/settings/organization/`). There is no global override. | `APPROVED PROJECT DECISION` (Reconciles p. 4 §1-2 and p. 24 §28) | **Deferred** (Awaiting Multi-tenancy) |
| **Permitted MVP Units** | The permitted currency units for MVP are **Toman** and **Rial**. | `APPROVED PROJECT DECISION` & `DOCUMENTED REQUIREMENT` (p. 4, §1-2) | **Documented** |
| **No Automatic 10x Conversion** | The platform does NOT automatically multiply or divide existing monetary values by 10 when switching between Toman and Rial. | `APPROVED PROJECT DECISION` | **Enforced** |
| **No Semantic Mutation** | Changing an organization's currency setting must not silently alter the stored numeric amounts of existing campaign or cost records. | `APPROVED PROJECT DECISION` | **Enforced** |
| **Currency Switching After Data Exists** | The exact business workflow when an organization changes currency after monetary records exist is currently unresolved. | `PRODUCT DECISION REQUIRED` | **Open Item** |
| **Foreign Currencies** | Currencies such as USD, EUR, or AED are outside the approved Phase 1 MVP scope. | `APPROVED PROJECT DECISION` | **Out of Scope** |

### Product Document Reconciliation Note
- **Document Text on Page 4 (§1-2):** Mentions `نمایش با واحد (تومان یا ریال، یک واحد برای کل سیستم)` (display with unit: Toman or Rial, one unit for the entire system).
- **Document Text on Page 24 (§28):** Explicitly locates `واحد پول` (Currency) inside `تنظیمات سازمان` (`/settings/organization/`).
- **Binding Resolution:** The user's explicit decision resolves this: currency is configured independently per organization. The reference to "یک واحد برای کل سیستم" on page 4 describes a single unified unit being active within an organization's workspace, rather than a single platform-wide hardcoded currency.

---

## 4. Implementation Boundary & Deferred Architecture

Because the backend repository currently contains only the `Campaign` domain model and does not yet have a multi-tenant Organization entity, the implementation of organization-scoped currency is **deliberately deferred**:

1. **No Mock or Partial Organization Model:** We do not invent an incomplete `Organization` model solely to store a currency string.
2. **No Global Currency Workaround:** We do not add a global environment variable or hardcoded system setting that would violate organization independence.
3. **Target Multi-Tenancy Architecture (To be implemented in Organization Foundation Phase):**
   - **Prisma Model:**
     ```prisma
     enum Currency {
       TOMAN @map("toman")
       RIAL  @map("rial")
     }

     model Organization {
       id        String     @id @default(uuid()) @db.Uuid
       name      String     @db.VarChar(255)
       currency  Currency   @default(TOMAN)
       timezone  String     @default("Asia/Tehran") @db.VarChar(50)
       campaigns Campaign[]
       createdAt DateTime   @default(now())
       updatedAt DateTime   @updatedAt

       @@map("organizations")
     }
     ```
   - **Campaign Foreign Key:** `organizationId String @db.Uuid` on `Campaign` model.
   - **Tenant Context Interceptor:** NestJS execution context extracts `activeOrganization` and resolves its configured currency.

---

## 5. Open Items & Unresolved Product Decisions

1. **Post-Creation Currency Mutation Workflow (`PRODUCT DECISION REQUIRED`):**
   What should occur if an organization with active campaigns switches its currency from Toman to Rial in Organization Settings?
   - *Option A:* Warning dialog stating historical figures remain unchanged in numeric value, now labeled with the new unit.
   - *Option B:* Disallow currency changes once campaigns or cost transactions exist.
   - *Option C:* Prompt user with an explicit historical migration/conversion wizard.
2. **Lead Deduplication Policy on Import/Create (`PRODUCT DECISION REQUIRED`):**
   When leads are created manually or imported via CSV/Excel, what is the deduplication key within an organization?
   - *Option A:* Mobile number is unique within organization.
   - *Option B:* Email address is unique within organization.
   - *Option C:* Duplicate leads allowed with warning.
3. **Database Integer Migration Timing (`TECHNICAL RECOMMENDATION`):**
   In a future phase after Organization foundation is established, consider migrating `budget` and `spend` from `Decimal(12, 2)` to `Decimal(15, 0)` or `BigInt` to enforce the non-fractional Toman/Rial rule at the database storage layer.

---

## 6. Authentication, Authorization & Tenancy Decisions (Phase B2.3.0.1)

The following binding decisions govern the MVP identity, authorization, user management, and tenant architecture for the Gapji Digital Marketing Platform, approved by the project owner in Phase B2.3.0.1.

### 6.1 Decision Summary Register

| Decision ID | Decision Title | Scope | Category | Status | Summary of Approved Decision |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **DEC-ORG-01** | Single-Organization MVP UX with Backend Tenancy | MVP | `USER-APPROVED PRODUCT DECISION` | **APPROVED** | Product experience features exactly 1 active organization in MVP. Multi-org selection at login is removed; login routes to `/`. Backend retains `organizationId` scoping, compound foreign keys, and multi-tenant schema compatibility for future expansion. |
| **DEC-AUTH-01** | Token Lifetimes Policy | MVP | `USER-APPROVED PRODUCT DECISION` | **APPROVED** | Access Token lifetime is strictly **15 minutes**. Refresh Token lifetime is strictly **7 days** (sliding window with family rotation). Refresh token stored in secure, `HttpOnly`, `SameSite=Strict` cookie. |
| **DEC-AUTH-02** | Email-Based Invitation Workflow | MVP | `USER-APPROVED PRODUCT DECISION` | **APPROVED** | User onboarding is conducted via an email invitation workflow containing a cryptographic one-time invitation token with expiration. Self-registration and public sign-ups are omitted from MVP. |
| **DEC-AUTH-03** | Deferral of Global Admin & Root Organization | Future | `USER-APPROVED PRODUCT DECISION` | **APPROVED (DEFERRED)** | Global Admin (`isGlobalAdmin`) and System Root Organization concepts are deferred to future enterprise phases. Administrative authority in MVP is strictly the Organization Admin (`admin` role). |
| **DEC-AUTH-04** | Latest Invitation Configuration Snapshot | MVP | `USER-APPROVED PRODUCT DECISION` | **APPROVED** | If an invitation's role, custom profile, or permission configuration is updated before acceptance, the latest approved configuration snapshot applies atomically at acceptance. Previous configuration states are superseded. |
| **DEC-AUTH-05** | Reuse Existing User Account for Invited Email | MVP | `USER-APPROVED PRODUCT DECISION` | **APPROVED** | If an invited email already exists in the system, no duplicate `User` record is created. The system reuses the existing global account, creates/activates the `OrganizationMembership`, and assigns the approved configuration without modifying user credentials. |
| **DEC-AUTH-06** | Preservation of Individual Overrides Across Profile Updates | MVP | `USER-APPROVED PRODUCT DECISION` | **APPROVED** | Personal permission overrides (`MembershipPermissionOverride`) survive subsequent updates to an assigned custom permission profile. Updating a shared profile never erases explicit individual grants or denies. |
| **DEC-AUTH-07** | Exactly-One Organization Admin & Zero-Admin Protection | MVP | `USER-APPROVED PRODUCT DECISION` | **APPROVED** | Exactly one active organization membership may hold the `admin` role in MVP. Multiple admins are prohibited. An admin cannot deactivate their account or remove administrative authority without an atomic, audited transfer to a designated replacement. |
| **DEC-AUTH-08** | Fixed Operational Roles Catalog (5 Roles) + Custom Profiles | MVP | `USER-APPROVED PRODUCT DECISION` | **APPROVED** | Exactly 5 operational roles are fixed system roles (`marketing_manager`, `campaign_manager`, `sales_agent`, `content_creator`, `client`) plus Organization Admin (`admin`). Fixed roles cannot be deleted or redefined. Users may be assigned fixed role defaults, customized with individual overrides, or assigned reusable Custom Permission Profiles. |
| **DEC-AUTH-09** | Custom Permission Profile Draft, Diff Preview & Atomic Confirmation | MVP | `USER-APPROVED PRODUCT DECISION` | **APPROVED** | Profile modifications create pending drafts without altering active user permissions. The UI presents added/removed/modified permissions and lists all affected users. The Organization Admin must explicitly confirm the change, which activates atomically across all linked users with full audit logging. |
| **DEC-AUTH-10** | Login Redirection to `/` with Role-Specific Home | MVP | `USER-APPROVED PRODUCT DECISION` | **APPROVED** | Successful authentication redirects to `/`. Home `/` renders a modular, role-specific dashboard grid tailored to each of the 6 system roles. Blind redirects to sub-routes (e.g. `/leads` or `/campaigns`) are prohibited. |
| **DEC-AUTH-11** | Non-Bypassable System-Enforced Baseline Policies | MVP | `USER-APPROVED PRODUCT DECISION` | **APPROVED** | System-enforced baseline restrictions cannot be bypassed by custom profiles or individual grants: `campaign_manager` denied Leads; `sales_agent` limited to `assignedToId === user.id`; `client` strictly read-only for Campaigns/Costs; SOP editing limited to `marketing_manager`/`admin`; Idea status limited to `marketing_manager`/`admin`. |
| **DEC-AUTH-12** | Independent Mutually Exclusive Authorization Paths | MVP | `USER-APPROVED PRODUCT DECISION` | **APPROVED** | Path A (Fixed Role: `Role Defaults + Personal Overrides`) and Path B (Custom Profile: `Profile Permissions + Personal Overrides`) are mutually exclusive for an individual user. A user cannot inherit both simultaneously. Both paths are subject to system policies ($\cap$). |
| **DEC-AUTH-13** | Mutable Fixed-Role Defaults | MVP / Future | `USER-APPROVED PRODUCT DECISION` | **APPROVED** | The permission defaults of the 5 predefined operational roles are not immutable hardcodes; they can be configured and updated by the Organization Admin. Updates affect all users in that role, require diff preview and explicit confirmation, preserve personal overrides, and allow source distinguishability. |

---

### 6.2 Detailed Architectural Specifications of Approved Decisions

#### DEC-ORG-01: Single-Organization MVP UX with Multi-Tenant Backend Compatibility
- **Rationale & Scope:** In MVP, end-users belong to and interact with a single active organization workspace. The multi-organization switcher in the top navigation shell and the organization selector step during login (p. 6 §1) are disabled in the MVP user interface.
- **Backend Preservation:** The backend architecture strictly preserves organization-scoped data isolation (`organizationId` on all tenant-owned models), composite foreign keys, and query filtering. This guarantees that upgrading to multi-organization support in future phases requires zero schema refactoring.

#### DEC-AUTH-01: Token Lifetimes Policy
- **Access Token:** 15 minutes (`900` seconds). Cryptographically signed JWT transmitted via `Authorization: Bearer <token>`.
- **Refresh Token:** 7 days (`604800` seconds). High-entropy cryptographic token with SHA-256 hash stored in `Session.tokenHash`. Delivered via `HttpOnly`, `Secure`, `SameSite=Strict` cookie.
- **Token Rotation:** On refresh, old refresh token is invalidated and a new pair is issued. Presentation of an already-used refresh token revokes all active sessions for that user family.

#### DEC-AUTH-04 & DEC-AUTH-05: Invitation Lifecycle & Account Reuse
- **Lifecycle:** Admin dispatches invitation with initial configuration (Role, Custom Profile, Permission Overrides). If Admin edits the pending invite before the invitee accepts, the database updates the pending invitation snapshot.
- **Acceptance:** When the invitee clicks the cryptographic link and creates their credentials, the membership is initialized using the latest snapshot atomically.
- **Existing Users:** If `email` already exists in `users`, `user.id` is linked to a new `OrganizationMembership` with `status: active`. The user's password, mobile number, and other profile attributes are untouched.

#### DEC-AUTH-06, DEC-AUTH-08 & DEC-AUTH-09: Hybrid Permission Model & Override Preservation
- **Hybrid Model Formula:**
  $$	ext{Effective Permissions} = \left(	ext{Role Defaults} + 	ext{Profile Permissions} + 	ext{Explicit Grants} - 	ext{Explicit Denies}
ight) \cap 	ext{System-Enforced Policies}$$
- **Override Persistence:**
  - If a user has Custom Profile P1 granting `[campaign.view, campaign.create]` and Admin grants personal override `+cost.view`, the user has `[campaign.view, campaign.create, cost.view]`.
  - When Admin subsequently edits Profile P1 to remove `campaign.create`, the user's effective permissions become `[campaign.view, cost.view]`. The personal override `+cost.view` is completely preserved.
- **Atomic Profile Updates:** Profile drafts remain inactive until Admin reviews the diff dialog (`Added: 0, Removed: 1, Modified: 0; Affected Users: 4`) and clicks Confirm. The transaction updates all 4 memberships atomically in PostgreSQL.

#### DEC-AUTH-07: Exactly-One Organization Admin & Safe Transfer
- **Rule:** An organization in MVP must have exactly one active member with `role = admin`.
- **Protection:**
  - Prevent self-deactivation: Admin calling `PATCH /api/users/me/deactivate` or `DELETE /api/organizations/current/members/admin-id` is rejected with HTTP 400 (`ORGANIZATION_REQUIRES_ACTIVE_ADMIN`).
  - Prevent self-demotion: Admin changing their own role to `marketing_manager` is rejected unless a new admin is designated simultaneously.
- **Transfer Workflow:** To transfer administrative authority:
  1. Admin selects an existing active member (e.g. User B).
  2. Admin enters password / re-authenticates.
  3. Single atomic database transaction: `User A.role -> marketing_manager` (or specified role), `User B.role -> admin`.
  4. Audit log entry written to `UserActivityLog` recording `ADMIN_TRANSFER_EXECUTED`.

#### DEC-AUTH-11: Non-Bypassable System-Enforced Baseline Policies
- System policies act as an immutable mathematical intersection ($\cap$). No permission grant, custom profile, or individual override can confer the following:
  1. `campaign_manager` can never receive access to `/leads` or any Lead API endpoint.
  2. `sales_agent` can never access leads where `assignedToId !== user.id`.
  3. `client` can never execute POST/PATCH/DELETE on `/campaigns` or `/costs` or access import wizards.
  4. Non-leadership roles cannot approve SOPs or alter Idea statuses.
  5. Executive Dashboard (`/performance/dashboard`) remains restricted to `admin`, `marketing_manager`, and `client` (restricted view).

#### DEC-AUTH-12: Independent Mutually Exclusive Authorization Paths
- **Mutually Exclusive Architecture:** The platform guarantees that an individual user belongs to exactly one authorization path:
  - **Path A — Fixed Role:** User is assigned one of the 5 predefined operational roles.
    $$\text{Effective Permissions} = (\text{Current Role Defaults} + \text{Explicit Personal Grants} - \text{Explicit Personal Denies}) \cap \text{System-Enforced Policies}$$
  - **Path B — Custom Permission Profile:** User is assigned a reusable Custom Permission Profile without a fixed operational role.
    $$\text{Effective Permissions} = (\text{Custom Profile Permissions} + \text{Explicit Personal Grants} - \text{Explicit Personal Denies}) \cap \text{System-Enforced Policies}$$
- **Mutual Exclusivity Enforcement:** A user assigned to Path A does not receive custom profile permissions. A user assigned to Path B does not inherit fixed role defaults. Neither path allows simultaneous inheritance of both baselines.
- **Personal Overrides:** Both paths fully support individual membership-level permission overrides (`MembershipPermissionOverride`) without altering shared role defaults or shared profiles.

#### DEC-AUTH-13: Mutable Fixed-Role Defaults
- **Configurable Defaults:** The default permission sets of the 5 predefined operational roles (`marketing_manager`, `campaign_manager`, `sales_agent`, `content_creator`, `client`) are not static constants hardcoded in source code. They are stored configurably (e.g. in `RolePermission`) and can be modified by the Organization Admin.
- **Cascading Role Impact:** Changing the defaults of a predefined role immediately cascades to all users assigned to that role who do not have an explicit personal override for the affected permissions.
- **Update & Confirmation Workflow:**
  1. The Organization Admin navigates to Role Settings and edits the role's default permission set.
  2. The system calculates and displays a structured diff modal:
     - Previous permissions.
     - Proposed new permissions.
     - Exact differences (added, removed, modified permissions).
     - Number of active users assigned to this role who will be affected.
  3. The Organization Admin must explicitly confirm the change.
- **Preservation of Personal Overrides:** If a user assigned to `campaign_manager` has an individual grant `+cost.export`, changing the defaults for `campaign_manager` (e.g. adding `webinar.view`) does not touch or erase `+cost.export`. Personal overrides remain completely intact.
- **Permission Source Distinguishability:**
  The system must enable the Organization Admin to inspect any user's effective permissions and clearly distinguish the provenance of each permission:
  - Inherited from current role defaults.
  - Granted by explicit personal override (`GRANT`).
  - Denied by explicit personal override (`DENY`).
- **Subordination to System Policies:** Modifying a role's defaults can never bypass or violate non-bypassable system-enforced baseline policies (`DEC-AUTH-11`). For example, the Organization Admin cannot configure the defaults of `campaign_manager` to grant access to `/leads`, as this is prohibited by system policy.

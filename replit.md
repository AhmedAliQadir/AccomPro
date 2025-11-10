# AccommodateME - Multi-Tenant SaaS Platform for UK Supported Housing

## Overview
AccommodateME is a multi-tenant SaaS platform for UK supported housing and social care providers. It enables organizations to manage Residents, Staff, Incidents, Compliance, Properties, and Documents within isolated workspaces. The platform provides a unified system for various care organizations to independently manage their operations, ensuring data segregation through a shared database with row-level isolation via `organizationId` foreign keys. Its purpose is to offer enterprise-grade tools with complete data isolation for UK housing associations, social services, and supported living providers.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, Wouter for routing, TanStack Query for server state.
- **UI Framework**: shadcn/ui (Radix UI, Tailwind CSS) following Material Design 3 for data-dense enterprise interfaces.
- **Design Rationale**: Prioritizes robust patterns for tables, forms, and navigation, offering accessible and customizable components.
- **Theme System**: Dual light/dark mode with CSS custom properties and HSL-based color definitions.
- **Key UI Patterns**: Card-based layouts, dialog/modal patterns, role-aware navigation, toast notifications, and role-based dashboard routing.
- **Dashboard System**: Role-specific dashboards with reusable components (StatCard, QuickActionCard, ActivityFeed, AlertBanner) designed for mobile-first, touch-optimized experiences.

### Backend Architecture
- **Framework**: Express.js with TypeScript.
- **Database ORM**: Drizzle ORM (transitioning from Prisma) with Neon PostgreSQL.
- **Authentication**: JWT-based with HTTP-only cookies, rate limiting, and database-backed `isPlatformAdmin` flag for privilege escalation prevention.
- **File Storage**: Encrypted document storage using AES-256-GCM.
- **API Design**: RESTful endpoints organized by domain with role-specific dashboard endpoints.
- **Architectural Decisions**:
    - **Dual ORM Strategy**: Primarily Drizzle ORM, with Prisma client present.
    - **Document Security**: Multi-layer encryption (AES-256-GCM), SHA-256 hashing, and time-limited download tokens.
    - **Audit Trail**: Middleware-based logging of user actions.
    - **Role-Based Access Control (RBAC)**: Four roles (ADMIN, OPS, SUPPORT, VIEWER) with middleware-enforced permissions and role-specific dashboard views.
    - **Multi-tenancy**: Achieved through `organizationId` foreign keys on all relevant models.
    - **Room Allocation Validation**: Prevents double-booking of occupied rooms.
    - **Organization Onboarding**: Atomic transaction-based creation of organization and initial admin user.
    - **Database Connection Resilience**: Retry logic with automatic reconnection for Neon serverless PostgreSQL connection timeouts.

### Data Architecture
- **Core Entities**: User, Property, Room, Tenant (Resident), Tenancy, Document, Assignment, AuditLog, Organization, Staff, Incident, Compliance, SupportNote.
- **Key Relationships**: Hierarchical relationships (properties, rooms, tenancies), tenant-document associations, staff assignments.
- **Validation and Data Integrity**: Zod schemas for API input validation, file upload constraints (10MB max, PDF/JPG/PNG), and document verification.

### Security Architecture
- **Encryption**: Server-side AES-256-GCM encryption for files.
- **Token Strategy**: Long-lived session tokens (7 days) and short-lived download tokens (15 minutes).
- **Security Headers**: Helmet.js middleware.

### Key Features
- **Organization Onboarding Workflow**: Multi-step wizard for Platform Admins to create new organizations with initial admin users, including subscription tier selection and billing info.
- **Organization Management**: Platform Admins can view, edit, and manage organizations via a searchable list and detailed views with real-time statistics.
- **Resident Onboarding Features**: A 10-step onboarding wizard for residents, capturing 80+ data points across various categories (Identity, Finance, Property, Risk, Health, Legal, Emergency). Features include autosave, Zod validation, `react-hook-form` integration, and digital signature capture.
- **Age Validation**: Enhanced age verification for tenant eligibility (18+) with a non-blocking warning dialog for users under 18.
- **Checkbox Interaction Fix**: Critical fix for `react-hook-form` and Radix UI Checkbox components, ensuring proper form state updates using `setValue()` and FormControl wrapper for label association.

### Checkbox Interaction Fix Details
**Latest Update (November 10, 2025):** Fixed critical checkbox interaction issues in tenant onboarding form.

**Problem:** All 22 checkboxes throughout the tenant onboarding wizard were completely unresponsive to user clicks, preventing users from selecting or deselecting options like Emergency Admission, Eligibility Confirmed, and all Risk & Safeguarding checkboxes.

**Root Cause:** React-hook-form's `field.onChange()` method was not updating form state when called from Radix UI Checkbox's `onCheckedChange` event handler, even with proper boolean coercion.

**Solution:** 
Use the form's `setValue()` method directly instead of `field.onChange()`, while keeping the FormControl wrapper for proper label association and accessibility:
```tsx
<FormControl>
  <Checkbox
    checked={field.value}
    onCheckedChange={(checked) => {
      const boolValue = checked === true;
      formName.setValue('fieldName', boolValue, { shouldValidate: true, shouldDirty: true });
    }}
  />
</FormControl>
```

**Technical Details:**
- Changed from: `field.onChange(checked === true)` ❌ (doesn't update form state)
- Changed to: `formName.setValue('fieldName', checked === true, { shouldValidate: true, shouldDirty: true })` ✅ (works correctly)
- Kept: `<FormControl>` wrapper for ALL form elements including Checkboxes (provides ID for label association and accessibility)

**Why Both Are Needed:**
- **setValue()**: Makes the checkbox actually toggle and update form state
- **FormControl**: Provides generated ID so clicking label text also toggles checkbox

**Affected Components (22 checkboxes across all steps):**
- Step 1 Pre-Intake: isEmergencyAdmission, eligibilityConfirmed (2)
- Step 4 Health: hasMentalHealth (1)
- Step 5 Risk & Safeguarding: hasCriminalRecord, hasDrugUse, hasAlcoholIssue, hasSuicidalThoughts, hasSelfHarmHistory, hasSocialWorker, hasProbationOfficer (7)
- Step 6 Financial: hasNilIncome, councilAuthorizationAgreed (2)
- Step 8 Support Framework: budgetPlanAgreed, employmentSupport, lifeSkillsSupport, healthSupport (4)
- Step 9 Legal Agreements: authorizationFormSigned, confidentialityWaiverSigned, fireEvacuationAcknowledged, licenceAgreementSigned, serviceChargeAgreementSigned, supportAgreementSigned (6)

**Testing:**
- End-to-end Playwright test validates checkboxes across Steps 1 and 5
- Confirms both direct checkbox clicks AND label text clicks toggle correctly
- Verifies conditional textareas appear/disappear based on checkbox state
- Validates independent checkbox operation
- Form state updates properly with validation and dirty tracking
- Accessibility attributes (aria-labelledby) work correctly

**Pattern Established:**
For Radix UI Checkbox components with react-hook-form:
1. Use `setValue()` directly, NOT `field.onChange()`
2. Keep FormControl wrapper around Checkbox for label association
3. Include `shouldValidate: true` and `shouldDirty: true` options
4. Always coerce to boolean: `checked === true`

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL.
- **Drizzle Kit**: Schema migration tool.

### Authentication & Security
- **bcryptjs**: Password hashing.
- **jsonwebtoken**: JWT handling.
- **helmet**: Security headers.
- **express-rate-limit**: Rate limiting middleware.

### UI Component Libraries
- **Radix UI**: Headless accessible components.
- **Lucide React**: Icon library.
- **Tailwind CSS**: Utility-first CSS framework.
- **class-variance-authority**: Type-safe component variants.

### File Handling
- **multer**: Multipart form data parsing.
- **Node.js crypto**: Encryption and hashing.
- **PDFKit**: Server-side PDF generation.
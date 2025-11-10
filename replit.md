# AccommodateME - Multi-Tenant SaaS Platform for UK Supported Housing

## Overview

AccommodateME is a multi-tenant SaaS platform designed for UK supported housing and social care providers. It enables organizations to manage Residents, Staff, Incidents, Compliance, Properties, and Documents within isolated workspaces. The platform's core purpose is to provide a unified system for various care organizations to independently manage their operations, from property and resident management to staff, incident tracking, and regulatory compliance. It targets UK housing associations, social services, and supported living providers requiring enterprise-grade tools with complete data isolation. The multi-tenancy model utilizes a shared database with row-level isolation via `organizationId` foreign keys, ensuring data segregation with automatic middleware filtering.

**Latest Update (October 30, 2025):** Complete 10-step tenant onboarding wizard implementation capturing 80+ data points across Personal Identity, Benefits & Finance, Property Allocation, Risk & Safeguarding, Health & Support, Legal Consents, and Emergency Planning. Features react-hook-form integration, Zod validation, API persistence, autosave functionality, and digital signatures for regulatory compliance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, utilizing Wouter for routing and TanStack Query for server state management.
**UI Framework**: shadcn/ui, built on Radix UI primitives, styled with Tailwind CSS following Material Design 3 principles for data-dense enterprise interfaces.
**Design Rationale**: Prioritizes robust patterns for tables, forms, and navigation, offering accessible and customizable components.
**Theme System**: Dual light/dark mode with CSS custom properties and HSL-based color definitions.
**Key UI Patterns**: Card-based layouts, dialog/modal patterns, role-aware navigation, toast notifications, and role-based dashboard routing.
**Dashboard System**: Role-specific dashboards with reusable components (StatCard, QuickActionCard, ActivityFeed, AlertBanner) designed for mobile-first, touch-optimized experiences.
**Organization Management**: Multi-step wizard for organization onboarding with validation, detail view with inline editing, and comprehensive statistics display.

### Backend Architecture

**Framework**: Express.js with TypeScript.
**Database ORM**: Drizzle ORM with Neon PostgreSQL, transitioning from Prisma.
**Authentication**: JWT-based with HTTP-only cookies and rate limiting on login. Database-backed `isPlatformAdmin` flag with JWT enforcement prevents privilege escalation.
**File Storage**: Encrypted document storage using AES-256-GCM.
**API Design**: RESTful endpoints organized by domain with role-specific dashboard endpoints (`/api/admin/dashboard`, `/api/support/dashboard`).
**Organization API Endpoints**:
- `POST /api/organizations` - Create organization with initial admin user (Platform Admin only, transactional)
- `GET /api/organizations/:id` - Fetch organization details with statistics (Platform Admin only)
- `PUT /api/organizations/:id` - Update organization details (Platform Admin only)
**Architectural Decisions**:
- **Dual ORM Strategy**: Primarily Drizzle ORM, with Prisma client present, indicating a transition.
- **Authentication Flow**: JWT in HTTP-only cookies for security, with rate limiting.
- **Document Security**: Multi-layer encryption (AES-256-GCM), SHA-256 hashing, and time-limited download tokens.
- **Audit Trail**: Middleware-based logging of user actions and system changes, including organization creation and updates.
- **Role-Based Access Control (RBAC)**: Four roles (ADMIN, OPS, SUPPORT, VIEWER) with middleware-enforced permissions and role-specific dashboard views. Examples include specific access for Platform Admin (cross-organization command center) and Support Worker (mobile-first task cockpit).
- **Multi-tenancy**: Achieved through `organizationId` foreign keys on all relevant models, ensuring data isolation.
- **Room Allocation Validation**: Enhanced system prevents double-booking of occupied rooms by validating against active tenancies and room capacity.
- **Organization Onboarding**: Atomic transaction-based creation ensures both organization and initial admin user are created together or not at all, preventing orphaned records.
- **Database Connection Resilience**: Retry logic with automatic reconnection handles Neon serverless PostgreSQL connection timeouts (P1017 errors). Up to 3 retries with exponential backoff (100ms, 200ms, 300ms) ensures tenant onboarding operations complete successfully even when idle connections are closed.

### Data Architecture

**Core Entities**: User, Property, Room, Tenant (referred to as Resident), Tenancy, Document, Assignment, AuditLog, Organization, Staff, Incident, Compliance, SupportNote.
**Key Relationships**: Hierarchical relationships between properties, rooms, and tenancies; tenant-document associations; staff assignments to properties.
**Schema Strategy**: `shared/schema.ts` defines core entities, with the full schema evolving to support multi-tenancy and new features.
**Validation and Data Integrity**: Zod schemas for API input validation, file upload constraints (10MB max, PDF/JPG/PNG), and a document verification workflow.

### Security Architecture

**Encryption**: Server-side AES-256-GCM encryption for files using Node.js crypto.
**Token Strategy**: Long-lived session tokens (7 days) and short-lived download tokens (15 minutes).
**Security Headers**: Helmet.js middleware.

### Development Workflow

**Build System**: Vite for frontend, esbuild for backend.
**Database Management**: Drizzle Kit for migrations.

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

### Development Tools
- **tsx**: TypeScript execution.
- **ws**: WebSocket library.

## Platform Admin Features

### Organization Onboarding Workflow
Platform Admins can onboard new customer organizations through a multi-step wizard:

**Step 1: Organization Details**
- Organization name and subdomain (unique identifier)
- Contact information (email, phone, address, postcode)
- Subscription tier selection (FREE, BASIC, PROFESSIONAL, ENTERPRISE)
- Optional billing information (contact, email, address, payment method)

**Step 2: Initial Administrator**
- Administrator name and email (becomes organization admin login)
- Secure password setup (minimum 8 characters, bcrypt hashed)
- Automatic role assignment as Organization Admin (not Platform Admin)

**Step 3: Review & Confirmation**
- Summary review of all entered information
- Validation before submission
- Atomic database transaction ensures both organization and admin user are created together

**Post-Creation:**
- Organization appears immediately in Organizations list
- Audit log entry created tracking who created the organization
- Initial admin can log in immediately with provided credentials
- Toast notification confirms successful creation with admin email

### Organization Management
Platform Admins have comprehensive organization management capabilities:

**View Organizations List:**
- Searchable/filterable table of all organizations
- Quick stats: Total organizations, active organizations, total users
- Per-organization data: Name, subdomain, contact info, subscription tier, status, user count, property count

**View Organization Details:**
- Click any organization row to open detail panel (Sheet component)
- Real-time statistics: users, properties, residents, documents, staff, incidents, compliance records
- Full organization information display
- Edit mode toggle for making changes

**Edit Organization:**
- Inline editing within detail panel
- Update organization details (name, subdomain, contact info)
- Change subscription tier
- Modify billing information
- Subdomain uniqueness validation
- Audit log entry created for all updates

**Security:**
- All organization management endpoints protected by `authorizePlatformAdmin` middleware
- Only users with `isPlatformAdmin: true` database flag can access
- Prevents unauthorized cross-organization access

## Resident Onboarding Features

### 10-Step Onboarding Wizard
Organizations can onboard new residents through a comprehensive multi-step wizard capturing 80+ data points across:
- Pre-Intake screening and referral information
- Personal Identity and diversity information
- Benefits & Finance details
- Property Allocation and room assignment
- Risk & Safeguarding assessments
- Health & Support needs
- Legal Consents and digital signatures
- Emergency Planning and contacts

**Key Features:**
- Autosave functionality preserves progress in localStorage
- Zod validation ensures data quality at each step
- react-hook-form integration for performant form handling
- Digital signature capture for regulatory compliance
- Real-time field validation with helpful error messages

### Age Validation Enhancement
**Latest Update (November 10, 2025):** Enhanced age verification for tenant eligibility compliance.

**Purpose:** Ensures compliance with UK supported housing regulations requiring tenants to be 18 or older for room allocation.

**Implementation:**
- **Automatic Age Calculation**: System calculates age from date of birth input in real-time using local timezone parsing
- **Warning Dialog**: Appears immediately when user enters a DOB resulting in age < 18
- **Clear Messaging**: Dialog states "Tenants under 18 are not eligible for room allocation in supported housing"
- **Verification Prompt**: Asks user to "verify the date of birth is correct before proceeding with the onboarding process"
- **Soft Validation**: Informative warning that allows user to acknowledge and proceed (button: "I Understand") rather than blocking submission
- **UX Rationale**: Provides guidance while allowing flexibility for edge cases (e.g., tenants turning 18 soon, data entry for review)

**Bug Fixes:**
- Fixed validation condition from `age > 0 && age < 18` to `age < 18` to correctly include age 0 and invalid future dates
- Fixed date parsing to use local timezone instead of UTC to prevent off-by-one errors on exact 18th birthday dates
- Age calculation now manually parses "YYYY-MM-DD" format to avoid timezone interpretation issues

**Testing:**
- End-to-end Playwright test validates warning appears for age < 18 (including age 0)
- Confirms no warning for age 18+ (validated with exact 18th birthday edge case)
- Verifies dialog message content and acknowledgment flow
- Validates autosave and form progression after acknowledgment
- Tested edge cases: age 0 (today's date), age 17, and exact 18th birthday

### Checkbox Interaction Fix
**Latest Update (November 10, 2025):** Fixed checkbox interaction issues in tenant onboarding form.

**Problem:** All 22 checkboxes throughout the tenant onboarding wizard were not responding to user clicks, preventing users from selecting or deselecting options like Emergency Admission and Eligibility Confirmed.

**Root Cause:** Checkboxes were using `onCheckedChange={field.onChange}` which directly passed Radix UI's tri-state value (`true`, `false`, or `"indeterminate"`) to react-hook-form, causing type handling issues.

**Solution:** 
Changed all checkbox handlers to explicitly convert to boolean:
```tsx
onCheckedChange={(checked) => field.onChange(checked === true)}
```

**Affected Components:**
- Emergency Admission checkbox (Pre-Intake step)
- Eligibility Confirmed checkbox (Pre-Intake step)  
- Mental Health checkbox (Health & Support step)
- Criminal Record checkbox (Risk Assessment step)
- All other boolean checkboxes throughout the 10-step wizard (22 total)

**Testing:**
- End-to-end test confirms all checkboxes now toggle correctly
- Visual state updates properly when clicked
- Form state updates and persists correctly
- Independent checkbox operation verified

**Pattern Established:**
This checkbox handler pattern should be used consistently for all future Radix UI checkbox implementations with react-hook-form to ensure proper boolean coercion.
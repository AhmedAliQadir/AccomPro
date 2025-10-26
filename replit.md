# AccommodateME - Multi-Tenant SaaS Platform for UK Supported Housing

## Overview

AccommodateME is a multi-tenant SaaS platform designed for UK supported housing and social care providers. It enables organizations to manage Residents, Staff, Incidents, Compliance, Properties, and Documents within isolated workspaces. The platform's core purpose is to provide a unified system for various care organizations to independently manage their operations, from property and resident management to staff, incident tracking, and regulatory compliance. It targets UK housing associations, social services, and supported living providers requiring enterprise-grade tools with complete data isolation. The multi-tenancy model utilizes a shared database with row-level isolation via `organizationId` foreign keys, ensuring data segregation with automatic middleware filtering.

## Test Login Credentials

All test accounts are for the **Saif Care Services** organization:

- **Platform Admin (Cross-Organization)**: `superadmin@accommodateme.com` / `superadmin123`
  - Full platform access with cross-organization command center
- **Organization Admin**: `admin@saifcare.com` / `admin123`
  - Full access to Saif Care Services organization
- **Operations Manager**: `ops@saifcare.com` / `ops123`
  - Operations-level access to organization data
- **Support Worker**: `support@saifcare.com` / `support123`
  - Mobile-first task cockpit for assigned property caseload

## Recent Changes (October 26, 2025)

### Weekly Support Session Notes Feature ✅
Implemented comprehensive weekly support notes system for documenting resident support sessions:

**Database Schema** (Prisma):
- Added `SupportNote` model with 5 support criteria categories (Economic Wellbeing, Enjoy & Achieve, Be Healthy, Stay Safe, Positive Contribution)
- Added `ContactType` enum (IN_PERSON, PHONE_CALL)
- Added `AttendanceStatus` enum (PRESENT, AUTHORISED_NON_ATTENDANCE, DID_NOT_ATTEND)
- Multi-tenant isolation via `organizationId` foreign key
- Relations to Organization, Tenant, and User (support worker)

**Backend API** (server/routes/support-notes.ts):
- Full CRUD operations: GET (list/detail), POST (create), PATCH (update), DELETE (delete)
- **Security Features**:
  - Zod validation on all mutations (POST/PATCH)
  - Property-scoped access for SUPPORT role (can only access notes for assigned properties)
  - Requires active tenancy for SUPPORT role operations
  - Blocks `tenantId` mutation in updates (prevents privilege escalation)
  - Organization-level filtering on all routes
- Architect-approved with no security bypasses

**Frontend** (client/src/pages/support-notes.tsx):
- Comprehensive table view with search functionality
- Multi-section form with all 5 support criteria categories
- View dialog for full note details
- Role-based access control (ADMIN, OPS, SUPPORT can create/edit; ADMIN/OPS can delete)
- Mobile-friendly responsive design

**PDF Download Feature** (server/lib/pdf-generator.ts + server/routes/support-notes.ts):
- Server-side PDF generation using PDFKit library
- GET /api/support-notes/:id/download endpoint with same security controls as view
- Comprehensive PDF includes: organization header, resident/session info, all 5 support criteria, signatures, metadata footer
- **Security hardening**: Filename sanitization prevents header injection attacks (strips CR/LF, quotes, special chars)
- Download buttons in table (icon-only) and view dialog with proper error handling
- Generated filename format: `support-note-{firstName}-{lastName}-{sessionDate}.pdf`

**Navigation**: Added "Support Notes" with ClipboardList icon to sidebar

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

### Backend Architecture

**Framework**: Express.js with TypeScript.
**Database ORM**: Drizzle ORM with Neon PostgreSQL, transitioning from Prisma.
**Authentication**: JWT-based with HTTP-only cookies and rate limiting on login.
**File Storage**: Encrypted document storage using AES-256-GCM.
**API Design**: RESTful endpoints organized by domain with role-specific dashboard endpoints (`/api/admin/dashboard`, `/api/support/dashboard`).
**Architectural Decisions**:
- **Dual ORM Strategy**: Primarily Drizzle ORM, with Prisma client present, indicating a transition.
- **Authentication Flow**: JWT in HTTP-only cookies for security, with rate limiting.
- **Document Security**: Multi-layer encryption (AES-256-GCM), SHA-256 hashing, and time-limited download tokens.
- **Audit Trail**: Middleware-based logging of user actions and system changes.
- **Role-Based Access Control (RBAC)**: Four roles (ADMIN, OPS, SUPPORT, VIEWER) with middleware-enforced permissions and role-specific dashboard views:
  - **ADMIN (Platform Admin)**: Cross-organization command center with portfolio overview, system-wide KPIs, organization management, and critical alerts.
  - **SUPPORT (Support Worker)**: Mobile-first task cockpit with assigned property caseload, resident alerts, quick actions, and incident tracking scoped to their assignments.
  - **OPS/VIEWER**: Default dashboard with organization-level statistics.

### Data Architecture

**Core Entities**: User, Property, Room, Tenant (referred to as Resident), Tenancy, Document, Assignment, AuditLog, Organization, Staff, Incident, Compliance, SupportNote.
**Key Relationships**: Hierarchical relationships between properties, rooms, and tenancies; tenant-document associations; staff assignments to properties.
**Schema Strategy**: `shared/schema.ts` defines core entities, with the full schema evolving to support multi-tenancy and new features like Staff, Incident, and Compliance management, including `organizationId` foreign keys on all relevant models.
**Validation and Data Integrity**: Zod schemas for API input validation, file upload constraints (10MB max, PDF/JPG/PNG), and a document verification workflow (PENDING -> VERIFIED/REJECTED).

### Security Architecture

**Encryption**: Server-side AES-256-GCM encryption for files using Node.js crypto, with `ENCRYPTION_KEY` from environment variables.
**Token Strategy**: Long-lived session tokens (7 days) and short-lived download tokens (15 minutes).
**Security Headers**: Helmet.js middleware.

### Development Workflow

**Build System**: Vite for frontend, esbuild for backend, with concurrent dev servers for development and static frontend serving by Express in production.
**Database Management**: Drizzle Kit for migrations and `db:push` for schema synchronization.
**Path Aliases**: `@/` (client/src), `@shared/` (shared), `@assets/` (attached_assets).

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

### Development Tools
- **Replit-specific plugins**: Runtime error overlay, Cartographer, Dev banner.
- **tsx**: TypeScript execution.
- **ws**: WebSocket library.
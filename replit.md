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
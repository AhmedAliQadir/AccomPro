# AccomPro - Supported Accommodation Management System

## Overview

AccomPro is a comprehensive SaaS platform for social housing associations managing supported accommodation. The system handles property management, tenant lifecycle (from onboarding to tenancy), document verification, case management, maintenance tracking, and financial operations. Built as a production-ready MVP, it provides role-based access control for administrators, operations managers, support workers, and viewers.

**Core Purpose**: Streamline the complete workflow of managing supported accommodation facilities, from property and room inventory through tenant intake and document verification to ongoing case management and compliance tracking.

**Target Users**: Housing associations, social services organizations, and supported living providers managing multiple properties with vulnerable tenant populations requiring varying levels of support.

## Recent Changes

**October 21, 2025**: Completed comprehensive tenant onboarding redesign
- Replaced basic 4-step onboarding with complete 6-step intake process matching paper form requirements
- **Step 1 (Personal Details)**: Title, name, DOB, NI number, nationality, contact info, previous address, languages spoken/written
- **Step 2 (Room Assignment)**: Property selection, room selection, move-in date, service charges
- **Step 3 (Financial Information)**: Benefit type (Universal Credit, JSA, etc.), payment frequency, benefit amount
- **Step 4 (Emergency & Professional Contacts)**: Next of kin details, doctor information, probation officer details (optional)
- **Step 5 (Document Upload)**: Mandatory documents (Proof of ID, Proof of Income), optional documents (Reference Letter, Medical Report, Other)
- **Step 6 (Review & Submit)**: Complete summary of all collected information organized by category before final submission
- Extended database schema: Added `doctorName`, `doctorPhone`, `probationOfficerName`, `probationOfficerPhone` to TenantRiskAssessment model
- Implemented nested record creation: Single tenant submission now creates records in Tenant, TenantProfile, TenantFinance, TenantEmergencyContact, and TenantRiskAssessment tables
- Added empty-string sanitization to prevent partial/invalid data persistence
- Fixed tenant detail page to handle null service charges gracefully

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system based on Material Design 3 principles

**Design Rationale**: The application requires data-dense interfaces for enterprise use. Material Design 3 provides robust patterns for tables, forms, and complex navigation. The component library (shadcn/ui) offers accessible, customizable components that maintain consistency while allowing fine-grained control.

**Theme System**: Dual light/dark mode with CSS custom properties for easy theme switching. Colors defined using HSL values for mathematical consistency and maintainability.

**Key UI Patterns**:
- Card-based layouts for information hierarchy
- Dialog/modal patterns for data entry and confirmations
- Role-aware navigation and action visibility
- Toast notifications for user feedback

### Backend Architecture

**Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with Neon PostgreSQL (serverless)
- **Authentication**: JWT-based with HTTP-only cookies
- **File Storage**: Encrypted document storage using AES-256-GCM
- **API Design**: RESTful endpoints organized by domain

**Architectural Decisions**:

1. **Dual ORM Strategy**: The codebase references both Prisma and Drizzle. Drizzle is configured as the primary ORM (via `drizzle.config.ts`) but Prisma client is imported in some files, suggesting a migration or transition period. Drizzle was chosen for better TypeScript inference and lightweight runtime.

2. **Authentication Flow**: JWT tokens stored in HTTP-only cookies prevent XSS attacks while maintaining stateless authentication. Rate limiting on login endpoint (5 attempts per 15 minutes) prevents brute force attacks.

3. **Document Security**: Multi-layer approach:
   - Files encrypted at rest using AES-256-GCM
   - SHA-256 hashing for deduplication and integrity
   - Time-limited download tokens (15 minutes)
   - Metadata stored separately from encrypted content

4. **Audit Trail**: Middleware-based audit logging captures user actions, entity changes, IP addresses, and user agents for compliance and security investigation.

5. **Role-Based Access Control (RBAC)**: Four roles (ADMIN, OPS, SUPPORT, VIEWER) with middleware-enforced permissions at the route level. Support workers see filtered data (only assigned properties/tenants).

### Data Architecture

**Core Entities**:
- **User**: Authentication and authorization (role-based)
- **Property**: Physical buildings/facilities
- **Room**: Individual units within properties
- **Tenant**: Individuals receiving supported accommodation
- **Tenancy**: Relationship between tenant and room (time-bound)
- **Document**: Encrypted file storage with verification workflow
- **Assignment**: Support worker assignments to properties
- **AuditLog**: Immutable event trail

**Key Relationships**:
- Properties contain multiple Rooms
- Rooms can have multiple Tenancies (time-sequenced)
- Tenants can have multiple Tenancies (move between rooms)
- Support workers assigned to Properties (not individual tenants)
- Documents belong to Tenants with mandatory/optional flags

**Schema Strategy**: The schema file (`shared/schema.ts`) currently shows minimal user table definition, suggesting the full schema is either in Prisma schema files or pending migration to Drizzle. The application logic in routes references entities not yet defined in the Drizzle schema.

### Validation and Data Integrity

**Input Validation**: Zod schemas for all API inputs with type inference
- `loginSchema`, `registerSchema` for authentication
- `createPropertySchema`, `updatePropertySchema` for properties
- `createTenantSchema`, `createTenancySchema` for tenant management

**File Upload Constraints**:
- Maximum file size: 10MB (configurable via `MAX_UPLOAD_MB`)
- Allowed types: PDF, JPG, PNG
- Rate limiting: 10 uploads per 15 minutes per user

**Document Verification Workflow**:
1. Upload → PENDING status
2. Manual review → VERIFIED or REJECTED
3. Tenancy creation requires verified mandatory documents (Proof of ID, Proof of Income)

### Security Architecture

**Encryption**: Server-side file encryption using Node.js crypto module
- Algorithm: AES-256-GCM (authenticated encryption)
- Key management: Environment variable `ENCRYPTION_KEY` (32-byte hex)
- IV and auth tag stored per file for decryption

**Token Strategy**:
- Long-lived session tokens: 7 days
- Short-lived download tokens: 15 minutes (prevents link sharing)
- JWT_SECRET required in production

**Security Headers**: Helmet.js middleware with CSP disabled in development for Vite HMR compatibility.

### Development Workflow

**Build System**: Vite for frontend, esbuild for backend
- Development: Concurrent dev servers (Vite middleware mode)
- Production: Static frontend build served by Express
- Type checking: Separate `tsc` step (no emit)

**Database Management**:
- Drizzle Kit for schema migrations
- `db:push` command for schema synchronization
- Seed script for initial admin/ops users

**Path Aliases**:
- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `attached_assets/`

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless Postgres with WebSocket connection pooling
- **Migration Tool**: Drizzle Kit for schema versioning

### Authentication & Security
- **bcryptjs**: Password hashing (10 rounds)
- **jsonwebtoken**: JWT signing and verification
- **helmet**: Security headers
- **express-rate-limit**: Brute force protection

### UI Component Libraries
- **Radix UI**: 25+ headless accessible components (@radix-ui/react-*)
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first styling
- **class-variance-authority**: Type-safe component variants

### File Handling
- **multer**: Multipart form data parsing for file uploads
- **Node.js crypto**: Encryption, hashing, and random generation

### Development Tools
- **Replit-specific plugins**: 
  - Runtime error overlay
  - Cartographer (code intelligence)
  - Dev banner
- **tsx**: TypeScript execution for development server
- **ws**: WebSocket library for Neon database connection

### Missing/Pending Integrations
Based on the functional blueprint in attached assets, these features are planned but not yet implemented:
- Email/notification service (for alerts, dunning letters)
- Payment gateway integration (for rent collection)
- E-signature service (for tenancy agreements)
- SMS gateway (for appointment reminders)
- KYC/identity verification API
- Mapping/geocoding service (for property locations)
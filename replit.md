# AccommodateME - Multi-Tenant SaaS Platform for UK Supported Housing

## Overview
AccommodateME is a multi-tenant SaaS platform designed for UK supported housing and social care providers. Its primary purpose is to enable organizations to manage Residents, Staff, Incidents, Compliance, Properties, and Documents within isolated workspaces. The platform ensures complete data segregation through a shared database utilizing row-level isolation via `organizationId` foreign keys. This offers a unified, enterprise-grade system for various care organizations to independently manage their operations.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, Wouter for routing, TanStack Query for server state.
- **UI Framework**: shadcn/ui (Radix UI, Tailwind CSS) adhering to Material Design 3 principles for data-dense enterprise interfaces.
- **Theme System**: Dual light/dark mode with CSS custom properties and HSL-based color definitions.
- **Key UI Patterns**: Card-based layouts, dialog/modal patterns, role-aware navigation, and toast notifications.
- **Dashboard System**: Role-specific dashboards featuring reusable components like StatCard, QuickActionCard, ActivityFeed, and AlertBanner, optimized for mobile-first, touch-enabled experiences.

### Backend Architecture
- **Framework**: Express.js with TypeScript.
- **Database ORM**: Drizzle ORM (transitioning from Prisma) with Neon PostgreSQL.
- **Authentication**: JWT-based with HTTP-only cookies, rate limiting, and database-backed `isPlatformAdmin` flag.
- **File Storage**: Encrypted document storage using AES-256-GCM.
- **API Design**: RESTful endpoints organized by domain with role-specific dashboard endpoints.
- **Architectural Decisions**:
    - **Document Security**: Multi-layer encryption, SHA-256 hashing, and time-limited download tokens.
    - **Audit Trail**: Middleware-based logging of user actions.
    - **Role-Based Access Control (RBAC)**: Four roles (ADMIN, OPS, SUPPORT, VIEWER) with middleware-enforced permissions.
    - **Multi-tenancy**: Achieved through `organizationId` foreign keys on all relevant models.
    - **Room Allocation Validation**: Prevents double-booking of occupied rooms.
    - **Organization Onboarding**: Atomic transaction-based creation of organization and initial admin user.
    - **Database Connection Resilience**: Retry logic for Neon serverless PostgreSQL connection timeouts.

### Data Architecture
- **Core Entities**: User, Property, Room, Tenant (Resident), Tenancy, Document, Assignment, AuditLog, Organization, Staff, Incident, Compliance, SupportNote.
- **Data Integrity**: Zod schemas for API input validation, file upload constraints (10MB max, PDF/JPG/PNG), and document verification.

### Security Architecture
- **Encryption**: Server-side AES-256-GCM encryption for files.
- **Token Strategy**: Long-lived session tokens (7 days) and short-lived download tokens (15 minutes).
- **Security Headers**: Helmet.js middleware.

### Key Features
- **Organization Onboarding Workflow**: Multi-step wizard for Platform Admins to create new organizations, including subscription tier selection and billing.
- **Resident Onboarding Features**: A 10-step wizard capturing extensive data across various categories. Includes intelligent autosave with draft validation, automatic form reset on invalid drafts, Zod validation, `react-hook-form` integration, and digital signature capture.
- **Age Validation**: Enhanced age verification (18+) with non-blocking warnings for ineligible users.
- **Form Interaction Fixes**: Implemented robust solutions for `react-hook-form` and Radix UI components (Checkbox, Select) using `setValue()` for correct form state updates and `FormControl` for accessibility.
- **Draft Validation & Auto-Reset System**: Intelligent system for `localStorage` drafts, validating tenant existence before restoration. Clears invalid drafts (e.g., deleted tenants) while preserving data for transient errors. Autosave starts only after hydration completes.

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
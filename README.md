# AccommodateME - Supported Housing Management Platform

A comprehensive multi-tenant SaaS platform designed for UK supported housing and social care providers. AccommodateME enables organizations to manage residents, staff, incidents, compliance, properties, and documents within secure, isolated workspaces.

## 🌟 Key Features

### Multi-Tenant Architecture
- **Complete Data Isolation**: Row-level security using `organizationId` foreign keys
- **Scalable Design**: Single database with logical separation per organization
- **Enterprise-Grade Security**: AES-256-GCM encryption for documents, TLS 1.3 for data in transit

### Core Modules
- **Resident Management**: Comprehensive 11-step onboarding wizard with autosave and validation
- **Property & Room Management**: Track properties, rooms, and allocations
- **Staff Management**: Role-based access control (Admin, Operations, Support Worker, Viewer)
- **Document Management**: Encrypted storage with SHA-256 hashing and time-limited download tokens
- **Incident Tracking**: Log and monitor incidents with full audit trails
- **Compliance Tracking**: Ensure regulatory compliance across all operations
- **Support Notes**: Weekly session notes with PDF export capabilities
- **Reporting & Analytics**: Advanced reports and dashboards

### Security & Compliance
- **UK GDPR Compliant**: Full data protection compliance
- **JWT Authentication**: HTTP-only cookies with session management
- **Audit Logging**: Complete trail of all user actions
- **Role-Based Permissions**: Four-tier access control system
- **99.5% Uptime SLA**: Enterprise-grade reliability

## 🚀 Tech Stack

### Frontend
- **React** with TypeScript
- **Wouter** for routing
- **TanStack Query** for server state management
- **shadcn/ui** (Radix UI + Tailwind CSS)
- **Vite** for build tooling

### Backend
- **Node.js** with Express
- **TypeScript**
- **Prisma ORM** (migrating to Drizzle)
- **PostgreSQL** (Neon serverless)
- **JWT** for authentication
- **Helmet.js** for security headers

### Infrastructure
- **Neon Database**: Serverless PostgreSQL
- **Cloud Hosting**: UK/EU data centers
- **AES-256-GCM**: Document encryption
- **TLS 1.3**: Transport encryption

## 📦 Installation

### Prerequisites
- Node.js 18+ (LTS recommended)
- PostgreSQL database (or Neon account)
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd accommodateme
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and set the following:
```env
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=<generate-with-openssl-rand-base64-32>
ENCRYPTION_KEY=<generate-with-openssl-rand-hex-32>
MAX_UPLOAD_MB=10
NODE_ENV=development
```

Generate secure secrets:
```bash
# Generate JWT secret
openssl rand -base64 32

# Generate encryption key
openssl rand -hex 32
```

4. **Set up the database**

Run Prisma migrations:
```bash
npx prisma migrate dev
```

Seed initial data (optional):
```bash
npx prisma db seed
```

5. **Start the development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🔧 Development

### Project Structure
```
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── lib/         # Utilities and helpers
│   │   └── hooks/       # Custom React hooks
├── server/              # Backend Express application
│   ├── routes/          # API route handlers
│   ├── middleware/      # Express middleware
│   ├── schemas/         # Zod validation schemas
│   └── lib/             # Backend utilities
├── prisma/              # Database schema and migrations
├── shared/              # Shared types between frontend/backend
└── attached_assets/     # Static assets
```

### Available Scripts

- `npm run dev` - Start development server (frontend + backend)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npx prisma studio` - Open Prisma Studio database GUI
- `npx prisma migrate dev` - Run database migrations

### Database Management

View database in GUI:
```bash
npx prisma studio
```

Create a new migration:
```bash
npx prisma migrate dev --name your_migration_name
```

Reset database (WARNING: deletes all data):
```bash
npx prisma migrate reset
```

## 🏢 For Housing Associations

### Subscription Tiers

**Starter** - £199/month
- Up to 5 users
- Up to 50 residents
- 25GB storage

**Professional** - £399/month
- Up to 15 users
- Unlimited residents
- 100GB storage
- API access

**Enterprise** - £799/month
- Unlimited users
- Unlimited residents
- 500GB storage
- Dedicated support
- Custom integrations

### Implementation Timeline
- **Week 1-2**: Data migration and user training
- **Week 3**: Pilot rollout
- **Week 4**: Full deployment

## 🔒 Security

- **Encryption at Rest**: AES-256-GCM for all documents
- **Encryption in Transit**: TLS 1.3
- **Authentication**: JWT with HTTP-only cookies
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Protection against brute force
- **Audit Logging**: Complete action history
- **Multi-tenant Isolation**: Row-level security

## 📄 License

Proprietary - All rights reserved by Orbixio LTD

## 🤝 Support

For support inquiries:
- Email: support@orbixio.co.uk
- Documentation: docs.accommodateme.co.uk
- Support Portal: support.accommodateme.co.uk

## 🛠️ Contributing

This is a proprietary commercial application. For feature requests or bug reports, please contact the development team.

---

**Built with ❤️ by Orbixio LTD for UK Supported Housing Providers**

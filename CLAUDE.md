# AccommodateME — Project Context for Claude

## What This Is

Multi-tenant SaaS platform for UK supported-housing and social-care providers.
Manages residents, staff, incidents, compliance, properties, and documents in
isolated per-organisation workspaces. Built by Orbixio Ltd.

Status: pilot-ready, zero paying customers.

## Tech Stack

| Layer | Tech | Notes |
|-------|------|-------|
| Frontend | React 18, TypeScript, Vite | SPA with client-side routing (Wouter) |
| UI | shadcn/ui (Radix + Tailwind CSS) | Component library in `client/src/components/ui/` |
| State | TanStack Query | Server state; no Redux/Zustand |
| Backend | Node.js, Express, TypeScript | Entry: `server/index.ts`, run via tsx |
| ORM | Prisma (primary) + Drizzle (migration target) | Prisma for DB ops; Drizzle schema in `shared/schema.ts` |
| Database | PostgreSQL (Neon serverless) | Connection via `DATABASE_URL` env var |
| Auth | JWT in HTTP-only cookies | Middleware: `server/middleware/auth.ts` |
| Validation | Zod | Shared schemas; Drizzle-Zod for insert schemas |
| Security | Helmet.js, AES-256-GCM (docs), bcrypt, rate limiting | |

## Folder Layout

```
├── client/src/
│   ├── components/    # Reusable UI (shadcn + custom)
│   ├── pages/         # Route-level page components
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utils, API client, helpers
│   ├── App.tsx        # Root component + routing
│   └── main.tsx       # Entry point
├── server/
│   ├── index.ts       # Express app entry
│   ├── routes.ts      # Route registration
│   ├── routes/        # Feature route handlers (one file per module)
│   ├── middleware/     # auth, tenantContext, audit, validation
│   ├── schemas/       # Zod request validation schemas
│   ├── lib/           # Backend utilities (encryption, tokens)
│   ├── db.ts          # Database connection
│   ├── prisma.ts      # Prisma client instance
│   └── storage.ts     # File/document storage layer
├── shared/
│   └── schema.ts      # Drizzle schema + Zod insert schemas (shared types)
├── prisma/
│   ├── schema.prisma  # Prisma schema (source of truth for now)
│   ├── migrations/    # Prisma migrations
│   ├── seed.ts        # Production seed
│   └── seed-demo.ts   # Demo data seed
├── drizzle.config.ts  # Drizzle Kit config
├── vite.config.ts     # Vite config (frontend build)
└── tailwind.config.ts # Tailwind config
```

## Commands

```bash
npm run dev          # Start dev server (frontend + backend on :5000)
npm run build        # Production build (Vite + esbuild)
npm run start        # Run production build
npm run check        # TypeScript type check
npm run db:push      # Push Prisma schema to DB (no migration)
npx prisma migrate dev --name <name>   # Create + apply migration
npx prisma studio    # Database GUI
npx prisma db seed   # Run seed script
```

## Key Conventions

1. **Multi-tenancy**: Every data table has an `organizationId` FK. All queries
   MUST filter by the authenticated user's org. Middleware in
   `server/middleware/tenantContext.ts` injects the org context.

2. **4-tier RBAC**: Admin > Operations > Support Worker > Viewer. Checked in
   route handlers. Never trust client-side role checks alone.

3. **Document encryption**: Files encrypted with AES-256-GCM before storage.
   SHA-256 hash stored for integrity. Time-limited signed download tokens.

4. **Validation**: All request bodies validated with Zod schemas in
   `server/schemas/`. Frontend forms also use Zod via react-hook-form.

5. **TypeScript-first**: No `any` unless absolutely necessary. Shared types
   live in `shared/schema.ts`.

6. **API pattern**: REST routes in `server/routes/<module>.ts`. Each file
   exports a router registered in `server/routes.ts`.

7. **Error handling**: Express error middleware catches thrown errors. Use
   standard HTTP status codes. Never leak stack traces in production.

## Gotchas

- **Prisma → Drizzle migration**: Both ORMs coexist. Prisma is still used for
  most DB operations. `shared/schema.ts` is the Drizzle schema but Prisma
  `schema.prisma` remains the migration source of truth.
- **Single-port dev server**: Vite is served through Express in dev mode
  (`server/vite.ts`). No separate frontend port.
- **Neon cold starts**: First DB query after idle may be slow (~1-2s).
  Connection pooling is on by default.
- **Env vars required**: `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY` must
  be set. See README for generation commands.
- **No test suite yet**: Tests are planned but not implemented.

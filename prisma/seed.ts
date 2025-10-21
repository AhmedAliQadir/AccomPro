import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding multi-tenant database...\n');

  // Create demo organizations
  console.log('Creating organizations...');
  
  const saifCare = await prisma.organization.upsert({
    where: { subdomain: 'saifcare' },
    update: {},
    create: {
      name: 'Saif Care Services',
      subdomain: 'saifcare',
      contactEmail: 'admin@saifcare.com',
      contactPhone: '020 7123 4567',
      address: '123 High Street, London, UK',
      subscriptionTier: 'PROFESSIONAL',
      isActive: true,
      settings: {
        branding: {
          primaryColor: '#2563eb',
          logo: null
        },
        features: {
          staffManagement: true,
          incidentTracking: true,
          complianceAudits: true
        }
      }
    },
  });

  console.log(`✓ Created organization: ${saifCare.name} (${saifCare.subdomain})`);

  const hopeTrust = await prisma.organization.upsert({
    where: { subdomain: 'hopetrust' },
    update: {},
    create: {
      name: 'Hope Trust Housing',
      subdomain: 'hopetrust',
      contactEmail: 'contact@hopetrust.org.uk',
      contactPhone: '0161 456 7890',
      address: '45 Market Square, Manchester, UK',
      subscriptionTier: 'BASIC',
      isActive: true,
      settings: {
        branding: {
          primaryColor: '#059669',
          logo: null
        },
        features: {
          staffManagement: true,
          incidentTracking: true,
          complianceAudits: false
        }
      }
    },
  });

  console.log(`✓ Created organization: ${hopeTrust.name} (${hopeTrust.subdomain})\n`);

  // Create users for Saif Care Services
  console.log('Creating users for Saif Care Services...');
  
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@saifcare.com' },
    update: {},
    create: {
      email: 'admin@saifcare.com',
      password: adminPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'ORG_ADMIN',
      organizationId: saifCare.id,
    },
  });

  console.log(`✓ Created admin: ${admin.email}`);

  const opsPassword = await bcrypt.hash('ops123', 10);
  const ops = await prisma.user.upsert({
    where: { email: 'ops@saifcare.com' },
    update: {},
    create: {
      email: 'ops@saifcare.com',
      password: opsPassword,
      firstName: 'Michael',
      lastName: 'Chen',
      role: 'OPS',
      organizationId: saifCare.id,
    },
  });

  console.log(`✓ Created ops manager: ${ops.email}`);

  const supportPassword = await bcrypt.hash('support123', 10);
  const support = await prisma.user.upsert({
    where: { email: 'support@saifcare.com' },
    update: {},
    create: {
      email: 'support@saifcare.com',
      password: supportPassword,
      firstName: 'Emily',
      lastName: 'Williams',
      role: 'SUPPORT',
      organizationId: saifCare.id,
    },
  });

  console.log(`✓ Created support worker: ${support.email}\n`);

  // Create super admin (cross-organization access for platform management)
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@accommodateme.com' },
    update: {},
    create: {
      email: 'superadmin@accommodateme.com',
      password: superAdminPassword,
      firstName: 'Platform',
      lastName: 'Admin',
      role: 'ADMIN',
      organizationId: saifCare.id, // Link to an org for now
    },
  });

  console.log(`✓ Created platform super admin: ${superAdmin.email}\n`);

  console.log('✅ Database seeded successfully!\n');
  console.log('═══════════════════════════════════════════════════');
  console.log('📋 LOGIN CREDENTIALS');
  console.log('═══════════════════════════════════════════════════');
  console.log('\n🏢 SAIF CARE SERVICES');
  console.log('   Admin:   admin@saifcare.com / admin123');
  console.log('   Ops:     ops@saifcare.com / ops123');
  console.log('   Support: support@saifcare.com / support123');
  console.log('\n🔧 PLATFORM ADMIN (Cross-Organization)');
  console.log('   Super:   superadmin@accommodateme.com / superadmin123');
  console.log('\n═══════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

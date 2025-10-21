import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@accompro.com' },
    update: {},
    create: {
      email: 'admin@accompro.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  console.log('Created admin user:', admin.email);

  const opsPassword = await bcrypt.hash('ops123', 10);
  
  const ops = await prisma.user.upsert({
    where: { email: 'ops@accompro.com' },
    update: {},
    create: {
      email: 'ops@accompro.com',
      password: opsPassword,
      firstName: 'Operations',
      lastName: 'Manager',
      role: 'OPS',
    },
  });

  console.log('Created ops user:', ops.email);

  console.log('Database seeded successfully!');
  console.log('\nLogin credentials:');
  console.log('Admin: admin@accompro.com / admin123');
  console.log('Ops: ops@accompro.com / ops123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

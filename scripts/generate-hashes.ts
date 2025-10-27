import bcrypt from 'bcryptjs';

const passwords = {
  superadmin: 'superadmin123',
  admin: 'admin123',
  ops: 'ops123',
  support: 'support123'
};

async function generateHashes() {
  for (const [user, password] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`${user}: ${hash}`);
  }
}

generateHashes();

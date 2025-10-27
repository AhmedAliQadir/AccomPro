import bcrypt from 'bcryptjs';

const storedHash = '$2b$10$WXVSjnAriBuFaW75b94aBebhxFqh0Db1T7lXsKwfjcvJEa7JwpWpG';
const password = 'superadmin123';

async function verify() {
  const isValid = await bcrypt.compare(password, storedHash);
  console.log(`Password "superadmin123" matches hash: ${isValid}`);
  
  // Also test generating a new hash and comparing
  const newHash = await bcrypt.hash(password, 10);
  console.log(`New hash generated: ${newHash}`);
  const newMatch = await bcrypt.compare(password, newHash);
  console.log(`New hash matches password: ${newMatch}`);
}

verify();

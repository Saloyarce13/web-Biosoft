require('dotenv').config();
const prisma = require('./src/lib/prisma');
const bcrypt = require('bcryptjs');

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@biosoft.local' },
    select: { id: true, name: true, email: true, isActive: true, emailVerified: true, roleId: true }
  });
  console.log('Admin user:', JSON.stringify(user, null, 2));

  if (user && (!user.isActive || !user.emailVerified)) {
    await prisma.user.update({
      where: { email: 'admin@biosoft.local' },
      data: { isActive: true, emailVerified: true }
    });
    console.log('Admin fixed: isActive=true, emailVerified=true');
  } else if (!user) {
    const hash = await bcrypt.hash('Admin123!', 10);
    const role = await prisma.role.findFirst({ where: { name: 'admin' } });
    if (!role) { console.log('No admin role found!'); return; }
    await prisma.user.create({
      data: { name: 'Administrador', email: 'admin@biosoft.local', passwordHash: hash, roleId: role.id, isActive: true, emailVerified: true }
    });
    console.log('Admin created!');
  } else {
    console.log('Admin OK - isActive:', user.isActive, '| emailVerified:', user.emailVerified);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());

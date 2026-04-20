const prisma = require('./src/lib/prisma');

(async () => {
  try {
    console.log('Verificando usuarios en BD...\n');
    
    const users = await prisma.user.findMany({ 
      take: 5,
      select: { id: true, email: true, name: true, isActive: true, emailVerified: true, createdAt: true }
    });
    
    console.log(`✓ Total de usuarios: ${users.length}\n`);
    users.forEach(u => {
      console.log(`  Email: ${u.email}`);
      console.log(`  Nombre: ${u.name}`);
      console.log(`  Activo: ${u.isActive}, Verified: ${u.emailVerified}`);
      console.log(`  Creado: ${u.createdAt.toISOString()}`);
      console.log('  ---');
    });
  } catch (e) {
    console.log('✗ Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();

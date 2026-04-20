const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

// Usar la misma configuración que el proyecto
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
  log: process.env.PRISMA_LOG === 'true' ? ['query', 'error', 'warn'] : ['error'],
});

async function checkAdminUser() {
  try {
    console.log('🔍 Verificando usuario administrador...');

    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@biosoft.local' },
      include: { role: true }
    });

    if (adminUser) {
      console.log('✅ Usuario administrador encontrado:');
      console.log('   📧 Email:', adminUser.email);
      console.log('   👤 Nombre:', adminUser.name);
      console.log('   🔒 Rol:', adminUser.role.name);
      console.log('   ✅ Activo:', adminUser.isActive);
      console.log('   📧 Email verificado:', adminUser.emailVerified);
    } else {
      console.log('❌ Usuario administrador no encontrado, creando...');

      const adminRole = await prisma.role.upsert({
        where: { name: 'admin' },
        update: { description: 'Rol administrador completo' },
        create: { name: 'admin', description: 'Rol administrador completo' }
      });

      const passwordHash = await bcrypt.hash('Admin123!', 10);
      const newAdmin = await prisma.user.create({
        data: {
          name: 'Administrador',
          email: 'admin@biosoft.local',
          passwordHash,
          roleId: adminRole.id,
          isActive: true,
          emailVerified: true
        },
        include: { role: true }
      });

      console.log('✅ Usuario administrador creado exitosamente:');
      console.log('   📧 Email:', newAdmin.email);
      console.log('   👤 Nombre:', newAdmin.name);
      console.log('   🔒 Rol:', newAdmin.role.name);
    }

    console.log('');
    console.log('🚀 Credenciales de acceso:');
    console.log('   📧 Email: admin@biosoft.local');
    console.log('   🔑 Contraseña: Admin123!');
    console.log('');
    console.log('💡 Puedes usar estas credenciales para iniciar sesión en la aplicación.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();
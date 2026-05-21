// src/lib/initialData.js
const prisma = require('./prisma');
const bcrypt = require('bcryptjs');

const ensureInitialData = async () => {
  try {
    // Crear categorías iniciales
    const categories = [
      { name: 'Suplementos', description: 'Suplementos naturales y vitaminas' },
      { name: 'Cuidado Personal', description: 'Productos de cuidado personal orgánicos' },
      { name: 'Alimentación', description: 'Alimentos orgánicos y naturales' },
      { name: 'Bebidas', description: 'Bebidas naturales y tés' },
      { name: 'Aceites Esenciales', description: 'Aceites esenciales puros' }
    ];

    for (const category of categories) {
      await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: {
          name: category.name,
          description: category.description,
          isActive: true
        }
      });
    }

    // Crear roles iniciales
    const roles = [
      { name: 'Administrador', description: 'Acceso completo al sistema' },
      { name: 'Cliente', description: 'Cliente del sistema' },
      { name: 'Empleado', description: 'Empleado de la empresa' }
    ];

    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role.name },
        update: {},
        create: {
          name: role.name,
          description: role.description,
          isActive: true
        }
      });
    }

    // Crear productos de ejemplo
    const sampleProducts = [
      {
        name: 'Vitamina C Natural',
        description: 'Vitamina C extraída de acerola orgánica, 1000mg por cápsula',
        price: 45000,
        stock: 50,
        minStock: 10,
        sku: 'VIT-C-1000',
        categoryName: 'Suplementos'
      },
      {
        name: 'Aceite de Coco Orgánico',
        description: 'Aceite de coco virgen extra, prensado en frío, 500ml',
        price: 32000,
        stock: 30,
        minStock: 5,
        sku: 'ACE-COCO-500',
        categoryName: 'Cuidado Personal'
      },
      {
        name: 'Té Verde Matcha',
        description: 'Té verde matcha premium japonés, 100g',
        price: 55000,
        stock: 25,
        minStock: 8,
        sku: 'TE-MATCHA-100',
        categoryName: 'Bebidas'
      },
      {
        name: 'Quinoa Orgánica',
        description: 'Quinoa orgánica boliviana, 500g',
        price: 28000,
        stock: 40,
        minStock: 10,
        sku: 'QUINOA-500',
        categoryName: 'Alimentación'
      },
      {
        name: 'Aceite Esencial Lavanda',
        description: 'Aceite esencial de lavanda puro, 15ml',
        price: 38000,
        stock: 20,
        minStock: 5,
        sku: 'AE-LAVANDA-15',
        categoryName: 'Aceites Esenciales'
      },
      {
        name: 'Proteína Vegetal',
        description: 'Proteína vegetal de guisante y arroz, sabor vainilla, 1kg',
        price: 85000,
        stock: 15,
        minStock: 3,
        sku: 'PROT-VEG-1KG',
        categoryName: 'Suplementos'
      },
      {
        name: 'Champú Natural',
        description: 'Champú natural sin sulfatos con aceite de argán, 300ml',
        price: 42000,
        stock: 35,
        minStock: 8,
        sku: 'CHAMP-NAT-300',
        categoryName: 'Cuidado Personal'
      },
      {
        name: 'Miel de Manuka',
        description: 'Miel de Manuka UMF 15+, 250g',
        price: 95000,
        stock: 12,
        minStock: 3,
        sku: 'MIEL-MANUKA-250',
        categoryName: 'Alimentación'
      }
    ];

    for (const product of sampleProducts) {
      const category = await prisma.category.findFirst({
        where: { name: product.categoryName }
      });

      if (category) {
        await prisma.product.upsert({
          where: { sku: product.sku },
          update: {},
          create: {
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            minStock: product.minStock,
            sku: product.sku,
            categoryId: category.id,
            isActive: true
          }
        });
      }
    }

    console.log('✅ Initial data created successfully');
  } catch (error) {
    console.error('❌ Error creating initial data:', error);
    throw error;
  }
};

module.exports = { ensureInitialData };
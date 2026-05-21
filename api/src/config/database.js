// src/config/database.js

// Importamos Sequelize y las variables de entorno
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Creamos la instancia de Sequelize con los datos de la BD
const sequelize = new Sequelize(
  process.env.DB_NAME,       // nombre de la base de datos
  process.env.DB_USER,       // usuario de Postgres (usualmente 'postgres')
  process.env.DB_PASSWORD,   // contraseña de Postgres
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT, // Debería ser 5432
    dialect: 'postgres',     // ¡Aquí está el cambio principal!
    logging: false,          // cambia a true si quieres ver las queries SQL en consola
    pool: {
      max: 5,                // máximo de conexiones simultáneas
      min: 0,
      acquire: 30000,        // tiempo máximo para obtener conexión (ms)
      idle: 10000            // tiempo antes de liberar conexión inactiva (ms)
    }
  }
);

// Función para probar la conexión (la usaremos en index.js)
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error.message);
    process.exit(1); // detenemos el servidor si no hay conexión
  }
};

module.exports = { sequelize, testConnection };
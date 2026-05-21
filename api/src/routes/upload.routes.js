// src/routes/upload.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { authenticateToken } = require('../middleware/auth');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer en memoria (no guarda en disco)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  },
});

// POST /api/upload/product-image
router.post('/product-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se envió ninguna imagen' });
    }

    // Subir a Cloudinary desde buffer
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'bionatural/products',
          transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    return res.status(200).json({
      success: true,
      message: 'Imagen subida correctamente',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || 'Error al subir imagen' });
  }
});

// GET /api/upload/test — verificar conexión con Cloudinary
router.get('/test', authenticateToken, async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    return res.status(200).json({ success: true, message: 'Cloudinary conectado', data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error conectando a Cloudinary: ' + error.message });
  }
});

module.exports = router;

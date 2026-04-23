const router = require('express').Router();
const { uploadProduct } = require('../services/cloudinary.service');
const { verifyToken } = require('../middlewares/auth.middleware');

// POST /api/upload/product-image
// Sube una imagen a Cloudinary y devuelve la URL
router.post(
  '/product-image',
  verifyToken,
  uploadProduct.single('image'),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se recibió ninguna imagen' });
    }
    return res.status(200).json({
      success: true,
      message: 'Imagen subida correctamente',
      data: {
        url:       req.file.path,
        publicId:  req.file.filename,
      },
    });
  }
);

module.exports = router;

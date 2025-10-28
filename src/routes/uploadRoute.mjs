// uploadRoute.js
import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer-storage-cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'tindalog_uploads', // folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg'],
  },
});

const upload = multer({ storage });

// Endpoint for upload
router.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: 'No file uploaded' });
  }

  res.json({
    success: true,
    image_url: req.file.path, // Cloudinary URL
  });
});

export default router;

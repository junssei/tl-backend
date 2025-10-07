import express from 'express';
import upload from '../config/multer.js';

const router = express.Router();

// Single file upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // Cloudinary returns file info automatically
    res.json({
      message: 'File uploaded successfully!',
      fileUrl: req.file.path, // Cloudinary public URL
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Upload failed.' });
  }
});

export default router;

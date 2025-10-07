import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from './cloudinary.js';

// Configure storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads', // Folder name in your Cloudinary dashboard
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'], // Allowed file types
  },
});

const upload = multer({ storage });

export default upload;

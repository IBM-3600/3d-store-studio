// backend/src/middleware/upload.middleware.ts
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/env';


// Use memory storage so the file is available as a Buffer in req.file.buffer
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'model/gltf-binary', // GLB
    'model/gltf+json',   // GLTF
    'image/jpeg',
    'image/png',
    'image/webp',
    'audio/mpeg',
    'audio/wav',
    'video/mp4'
  ];

  // Fallback: check extension for files that might have generic MIME types (like .hdr or .fbx)
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.glb', '.gltf', '.fbx', '.obj', '.hdr', '.jpg', '.jpeg', '.png', '.webp', '.mp3', '.wav', '.mp4'];

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} (${ext}) not allowed`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max
  }
});

















// // Ensure upload directory exists
// const uploadDir = path.resolve(config.uploadDir);
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
// }

// // Use memory storage - we'll handle file saving in the controller
// const storage = multer.memoryStorage();

// const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
//   const allowedTypes = [
//     // 3D Models
//     'model/gltf-binary',      // .glb
//     'model/gltf+json',        // .gltf
//     'application/octet-stream', // .fbx, .obj (often sent as octet-stream)
    
//     // Images
//     'image/jpeg',
//     'image/png',
//     'image/webp',
//     'image/gif',
    
//     // HDR/Environment
//     'application/octet-stream', // .hdr
    
//     // Audio
//     'audio/mpeg',
//     'audio/wav',
//     'audio/ogg',
    
//     // Video
//     'video/mp4',
//     'video/webm'
//   ];

//   // Also check by extension for files that may have wrong MIME types
//   const ext = path.extname(file.originalname).toLowerCase();
//   const allowedExtensions = [
//     '.glb', '.gltf', '.fbx', '.obj',
//     '.jpg', '.jpeg', '.png', '.webp', '.gif',
//     '.hdr',
//     '.mp3', '.wav', '.ogg',
//     '.mp4', '.webm'
//   ];

//   if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
//     cb(null, true);
//   } else {
//     cb(new Error(`File type ${file.mimetype} (${ext}) not allowed`));
//   }
// };

// export const upload = multer({
//   storage,
//   fileFilter,
//   limits: {
//     fileSize: config.maxFileSize || 500 * 1024 * 1024 // 500MB default
//   }
// });
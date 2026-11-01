// backend/src/controllers/upload-simple.controller.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import { prisma } from '../config/database';



const router: Router = Router();
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

router.post('/upload', 
  authenticate, 
  requireRole('ADMIN', 'EDITOR'),
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Save to database
      const asset = await prisma.asset.create({
        data: {
          name: req.file.originalname,
          type: 'MODEL',
          url: `/uploads/${req.file.filename}`,
          size: req.file.size
        }
      });

      res.json({ asset });
    } catch (error) {
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);
// mate 관련 router
import express from 'express';
import multer from 'multer';
import { verifyTokenMiddleware } from '../middlewares/authMiddleware.js';
import { s3ImageUploadController } from '../controllers/awsController.js';

const awsRouter = express.Router({ mergeParams: true });
const upload = multer({ storage: multer.memoryStorage() });

// POST api/aws/images, 이미지 업로드 요청 routing
awsRouter.post(
  '/images',
  verifyTokenMiddleware,
  upload.array('images'),
  s3ImageUploadController
);

export default awsRouter;

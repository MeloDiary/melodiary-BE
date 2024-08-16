// mate 관련 router
import express from 'express';
import { verifyTokenMiddleware } from '../middlewares/authMiddleware.js';
import { presignedUrlController } from '../controllers/awsController.js';

const awsRouter = express.Router({ mergeParams: true });

// POST api/aws/presigned-url, 프리사인드 url 요청 routing
awsRouter.post('/presigned-url', verifyTokenMiddleware, presignedUrlController);

export default awsRouter;

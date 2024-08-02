// API 명세서 router
import express from 'express';
import {
  serveSwaggerUi,
  setupSwaggerUi
} from '../controllers/apiSpecController.js';

/**
 * API 명세서를 Swagger UI로 제공하기 위해 사용되는 router입니다.
 * /api 경로로 접근했을때 Swagger UI를 사용해 src/docs/의 API 명세서를 보여줍니다.
 */
const apiSpecRouter = express.Router();

apiSpecRouter.use('/', serveSwaggerUi, setupSwaggerUi);

export default apiSpecRouter;

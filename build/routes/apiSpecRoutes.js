import express from 'express';
import { serveSwaggerUi, setupSwaggerUi } from '../controllers/apiSpecController.js';
const apiSpecRouter = express.Router();
apiSpecRouter.use('/', serveSwaggerUi, setupSwaggerUi);
export default apiSpecRouter;

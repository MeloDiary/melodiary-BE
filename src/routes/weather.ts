import express from 'express';
import { getTodayWeather } from '../controllers/weatherController.js';
import { verifyTokenMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', verifyTokenMiddleware, getTodayWeather);

const weatherRouter = router;
export default weatherRouter;

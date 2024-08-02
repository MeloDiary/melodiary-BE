// 유저 관련 router
import express from 'express';
import { signUpController } from '../controllers/userController.js';

const userRouter = express.Router();

// api/users로 온 post 요청을 signUpController 모듈로 routing
userRouter.post('/', signUpController);

export default userRouter;

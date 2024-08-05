// 유저 관련 router
import express from 'express';
import {
  loginController,
  signUpController
} from '../controllers/userController.js';

const userRouter = express.Router();

// POST api/users 회원가입 요청을 routing
userRouter.post('/', signUpController);
// POST api/users/login  로그인 요청을 routing
userRouter.post('/login', loginController);

export default userRouter;

// 유저 관련 router
import express from 'express';
import {
  loginController,
  nicknameController,
  signUpController
} from '../controllers/userController.js';
import { verifyTokenMiddleware } from '../middlewares/authMiddleware.js';

const userRouter = express.Router();

// POST api/users 회원가입 요청을 routing
userRouter.post('/', signUpController);
// POST api/users/login 로그인 요청을 routing
userRouter.post('/login', loginController);
// GET api/users/nicknames 닉네임 중복확인 요청을 routing
userRouter.get('/nicknames', nicknameController.check);
// POST api/users/{userID}/nickname 닉네임 등록 요청을 routing
userRouter.post(
  '/:userID/nickname',
  verifyTokenMiddleware,
  nicknameController.register
);
// PUT api/users/{userID}/nickname 닉네임 변경 요청을 routing
userRouter.put(
  '/:userID/nickname',
  verifyTokenMiddleware,
  nicknameController.update
);

export default userRouter;

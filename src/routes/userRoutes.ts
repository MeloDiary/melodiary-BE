// 유저 관련 router
import express from 'express';
import {
  backgroundImgController,
  checkNicknameController,
  deleteUserController,
  loginController,
  logoutController,
  nicknameController,
  profileImgController,
  searchUserController,
  signUpController,
  tokenRefreshController,
  userInfoController
} from '../controllers/userController.js';
import { verifyTokenMiddleware } from '../middlewares/authMiddleware.js';

const userRouter = express.Router();
// GET api/users, 사용자 검색 요청 routing
userRouter.get('/', searchUserController);

// POST api/users, 회원가입 요청 routing
userRouter.post('/', signUpController);

// GET api/users/nicknames, 닉네임 중복확인 요청 routing
userRouter.get('/nicknames', checkNicknameController);

// POST api/users/login, 로그인 요청 routing
userRouter.post('/login', loginController);

// POST api/users/token-refresh, Access token 재발급 요청 routing
userRouter.post('/:userID/token-refresh', tokenRefreshController);

// GET api/users/{userID}, 사용자 정보 확인 요청 routing
userRouter.get('/:userID', verifyTokenMiddleware, userInfoController);

// DELETE api/users/{userID}, 회원 탈퇴 요청 routing
userRouter.delete('/:userID', verifyTokenMiddleware, deleteUserController);

// POST api/users/{userID}/nickname, 닉네임 등록 요청 routing
userRouter.post(
  '/:userID/nickname',
  verifyTokenMiddleware,
  nicknameController.register
);

// PUT api/users/{userID}/nickname, 닉네임 변경 요청 routing
userRouter.put(
  '/:userID/nickname',
  verifyTokenMiddleware,
  nicknameController.update
);

// POST api/users/{userID}/profile-image, 프로필 사진 등록 요청 routing
userRouter.post(
  '/:userID/profile-image',
  verifyTokenMiddleware,
  profileImgController.register
);

// PUT api/users/{userID}/profile-image, 프로필 사진 변경 요청 routing
userRouter.put(
  '/:userID/profile-image',
  verifyTokenMiddleware,
  profileImgController.update
);

// POST api/users/{userID}/background-image, 마이페이지 배경 사진 등록 요청 routing
userRouter.post(
  '/:userID/background-image',
  verifyTokenMiddleware,
  backgroundImgController.register
);

// PUT api/users/{userID}/profile-image, 마이페이지 배경 사진 변경 요청 routing
userRouter.put(
  '/:userID/background-image',
  verifyTokenMiddleware,
  backgroundImgController.update
);

// POST api/users/{userID}/logout, 로그아웃 요청 routing
userRouter.post('/:userID/logout', verifyTokenMiddleware, logoutController);

export default userRouter;

// 사용자 관련 요청을 처리하는 controller
import { Request, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import {
  googleSignUpService,
  googleLoginService,
  naverSignUpService,
  naverLoginService,
  checkNicknameService,
  checkUserService,
  registerNicknameService,
  searchUserService,
  userInfoService,
  deleteUserService,
  registerProfileImgService,
  registerBackgroundImgService,
  logoutService,
  tokenRefreshService
} from '../services/userService.js';

//회원가입 controller
export const signUpController = async (req: Request, res: Response) => {
  try {
    const {
      service_provider: serviceProvider,
      authorization_code: authorizationCode,
      state
    } = req.body;
    const validProviders: string[] = ['google', 'naver', 'kakao'];

    // 요청 구문이 잘못된 경우 400 코드 리턴함
    if (!validProviders.includes(serviceProvider))
      return res.status(400).json({ message: 'Bad request' });

    // Google 회원가입 service 호출
    if (serviceProvider === 'google') {
      const result = await googleSignUpService({
        serviceProvider,
        authorizationCode,
        state
      });

      // 회원가입 성공한 경우 201 코드와 id, access token, refresh token 리턴함
      return res.status(201).json({
        user_id: result.userId,
        access_token: result.accessToken,
        refresh_token: result.refreshToken
      });
    }

    // Naver 회원가입 service 호출
    if (serviceProvider === 'naver') {
      const result = await naverSignUpService({
        serviceProvider,
        authorizationCode,
        state
      });

      return res.status(201).json({
        user_id: result.userId,
        access_token: result.accessToken,
        refresh_token: result.refreshToken
      });
    }

    // Kakao 회원가입 service 호출
    if (serviceProvider === 'kakao') {
    }
  } catch (error) {
    // 이미 존재하는 사용자인 경우 409 코드 리턴함
    if (error.message === 'The user already exists') {
      return res.status(409).json({ message: 'The user already exists' });
    }
    console.error('Error in signUp controller');

    // 서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 로그인 controller
export const loginController = async (req: Request, res: Response) => {
  try {
    const {
      service_provider: serviceProvider,
      authorization_code: authorizationCode,
      state
    } = req.body;
    const validProviders: string[] = ['google', 'naver', 'kakao'];

    // 요청 구문이 잘못된 경우 400 코드 리턴함
    if (!validProviders.includes(serviceProvider))
      return res.status(400).json({ message: 'Bad request' });

    // Google 로그인 service 호출
    if (serviceProvider === 'google') {
      const result = await googleLoginService({
        serviceProvider,
        authorizationCode,
        state
      });

      // 로그인 성공한 경우 200 코드와 id, access token, refresh token 리턴함
      return res.status(200).json({
        user_id: result.userId,
        access_token: result.accessToken,
        refresh_token: result.refreshToken
      });
    }

    // Naver 로그인 service 호출
    if (serviceProvider === 'naver') {
      const result = await naverLoginService({
        serviceProvider,
        authorizationCode,
        state
      });

      // 로그인 성공한 경우 200 코드와 id, access token, refresh token 리턴함
      return res.status(200).json({
        user_id: result.userId,
        access_token: result.accessToken,
        refresh_token: result.refreshToken
      });
    }

    // Kakao 로그인 service 호출
    if (serviceProvider === 'kakao') {
    }
  } catch (error) {
    // 가입되지 않은 사용자인 경우 404 코드 리턴함
    if (error.message === 'Cannot find user account') {
      return res.status(404).json({ message: 'Cannot find user account' });
    }
    // 서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 닉네임 중복확인 controller
export const checkNicknameController = async (req: Request, res: Response) => {
  try {
    const { nickname } = req.query;

    // 요청 구문이 잘못된 경우 400 코드 리턴함
    if (typeof nickname !== 'string' || !nickname) {
      return res.status(400).json({ message: 'Bad request' });
    }

    // 해당 닉네임을 쓰고 있는 사용자가 있는지 확인함
    const nicknameUserID = await checkNicknameService(nickname);
    console.log(nicknameUserID);

    if (nicknameUserID === null) {
      // 해당 닉네임을 쓰고 있는 사용자가 없는 경우 200 코드 리턴함
      return res.status(200).json({ message: 'The nickname is valid' });
    } else {
      // 해당 닉네임을 쓰고 있는 사용자가 있는 경우 409 코드 리턴함
      return res.status(409).json({ message: 'The nickname is duplicated' });
    }
  } catch (error) {
    // 서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 닉네임 관련 controller
export const nicknameController = {
  // 닉네임 등록 controller
  register: async (req: Request, res: Response) => {
    try {
      const { userID } = req.params;
      const tokenUserID = (req.user as JwtPayload).userId;
      const { nickname } = req.body;
      const parsedUserID = parseInt(userID, 10);

      // 요청 구문이 잘못된 경우 400 코드 리턴함
      if (isNaN(parsedUserID) || typeof nickname !== 'string' || !nickname) {
        return res.status(400).json({ message: 'Bad request' });
      }

      // 접근권한이 없는 경우 403 코드 리턴함
      if (parsedUserID !== Number(tokenUserID)) {
        return res.status(403).json({ message: 'Forbidden: User ID mismatch' });
      }

      // 해당 닉네임을 쓰고 있는 사용자가 있는지 확인함
      const nicknameUserID = await checkNicknameService(nickname);

      // 해당 닉네임을 쓰고 있는 사용자가 있는 경우 409 코드 리턴함
      if (nicknameUserID !== null) {
        return res.status(409).json({ message: 'The nickname is duplicated' });
      }

      // 해당 유저가 가입된 사용자인지 확인함
      const signedUserID = await checkUserService(parsedUserID);

      // 존재하지 않는 사용자일 경우 404 코드 리턴함
      if (signedUserID === null) {
        return res.status(404).json({ message: 'Not found such user' });
      }

      const affectedRows = await registerNicknameService(
        parsedUserID,
        nickname
      );

      // 닉네임 등록에 성공한 경우 201 코드 리턴함
      if (affectedRows > 0) {
        return res
          .status(201)
          .json({ message: 'Successfully posted the nickname' });
      } else {
        return res.status(500).json({ message: 'Internal server error' });
      }
    } catch (error) {
      // 닉네임이 2~14자가 아닐 경우 400 코드 리턴함
      if (error.message === 'The nickname is invalid') {
        return res.status(400).json({ message: 'Bad request' });
      }
      // 서버 내부 오류인 경우 500 코드 리턴함
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  // 닉네임 변경 controller
  update: async (req: Request, res: Response) => {
    try {
      const { userID } = req.params;
      const tokenUserID = (req.user as JwtPayload).userId;
      const { nickname } = req.body;
      const parsedUserID = parseInt(userID, 10);

      // 요청 구문이 잘못된 경우 400 코드 리턴함
      if (isNaN(parsedUserID) || typeof nickname !== 'string' || !nickname) {
        return res.status(400).json({ message: 'Bad request' });
      }

      // 접근권한이 없는 경우 403 코드 리턴함
      if (parsedUserID !== Number(tokenUserID)) {
        return res.status(403).json({ message: 'Forbidden: User ID mismatch' });
      }

      // 해당 닉네임을 쓰고 있는 사용자가 있는지 확인함
      const nicknameUserID = await checkNicknameService(nickname);

      // 해당 닉네임을 쓰고 있는 사용자가 있는 경우 409 코드 리턴함
      if (nicknameUserID !== null) {
        return res.status(409).json({ message: 'The nickname is duplicated' });
      }

      // 해당 유저가 가입된 사용자인지 확인함
      const signedUserID = await checkUserService(parsedUserID);

      // 존재하지 않는 사용자일 경우 404 코드 리턴함
      if (signedUserID === null) {
        return res.status(404).json({ message: 'Not found such user' });
      }

      const affectedRows = await registerNicknameService(
        parsedUserID,
        nickname
      );

      // 닉네임 변경에 성공한 경우 200 코드 리턴함
      if (affectedRows > 0) {
        return res
          .status(200)
          .json({ message: 'Successfully changed the nickname' });
      } else {
        return res.status(500).json({ message: 'Internal server error' });
      }
    } catch (error) {
      // 닉네임이 2~14자가 아닐 경우 400 코드 리턴함
      if (error.message === 'The nickname is invalid') {
        return res.status(400).json({ message: 'Bad request' });
      }
      // 서버 내부 오류인 경우 500 코드 리턴함
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
};

// 사용자 검색 controller
export const searchUserController = async (req: Request, res: Response) => {
  try {
    const { nickname: nicknameQuery, email: emailQuery } = req.query;

    if (
      (typeof nicknameQuery !== 'string' || !nicknameQuery.trim()) &&
      (typeof emailQuery !== 'string' || !emailQuery.trim())
    ) {
      // 요청 구문이 잘못된 경우 400 코드 리턴함
      return res.status(400).json({ message: 'Bad request' });
    }

    const result = await searchUserService(
      nicknameQuery as string,
      emailQuery as string
    );

    // 사용자 검색에 성공한 경우 200 코드와 사용자 정보 리턴함
    return res.status(200).json(result);
  } catch (error) {
    // 존재하지 않는 사용자인 경우 404 코드 리턴함
    if (error.message === 'Not found such user') {
      return res.status(404).json({ message: 'Not found such user' });
    }
    // 서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 사용자 정보 확인 controller
export const userInfoController = async (req: Request, res: Response) => {
  try {
    const { userID } = req.params;
    const tokenUserID = (req.user as JwtPayload).userId;
    const parsedUserID = parseInt(userID, 10);

    // 요청 구문이 잘못된 경우 400 코드 리턴함
    if (isNaN(parsedUserID)) {
      return res.status(400).json({ message: 'Bad request' });
    }

    // 접근권한이 없는 경우 403 코드 리턴함
    if (parsedUserID !== Number(tokenUserID)) {
      return res.status(403).json({ message: 'Forbidden: User ID mismatch' });
    }

    const result = await userInfoService(parsedUserID);

    // 사용자 정보를 가져오는데 성공한 경우 200 코드와 사용자 정보 리턴함
    return res.status(200).json(result);
  } catch (error) {
    // 존재하지 않는 사용자인 경우 404 코드 리턴함
    if (error.message === 'Not found such user') {
      return res.status(404).json({ message: 'Not found such user' });
    }
    // 서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 회원 탈퇴 controller
export const deleteUserController = async (req: Request, res: Response) => {
  try {
    const { userID } = req.params;
    const tokenUserID = (req.user as JwtPayload).userId;
    const parsedUserID = parseInt(userID, 10);

    // 요청 구문이 잘못된 경우 400 코드 리턴함
    if (isNaN(parsedUserID)) {
      return res.status(400).json({ message: 'Bad request' });
    }

    // 접근권한이 없는 경우 403 코드 리턴함
    if (parsedUserID !== Number(tokenUserID)) {
      return res.status(403).json({ message: 'Forbidden: User ID mismatch' });
    }

    const affectedRows = await deleteUserService(parsedUserID);

    // 회원 탈퇴 및 사용자 삭제에 성공한 경우 200 코드 리턴함
    if (affectedRows > 0) {
      return res.status(200).json({ message: 'The user has deleted' });
    } else {
      return res.status(500).json({ message: 'Internal server error' });
    }
  } catch (error) {
    // 존재하지 않는 사용자인 경우 404 코드 리턴함
    if (error.message === 'Not found such user') {
      return res.status(404).json({ message: 'Not found such user' });
    }
    // 서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 프로필 사진 관련 controller
export const profileImgController = {
  // 메인 controller
  handleProfileImg: async (
    req: Request,
    res: Response,
    action: 'register' | 'update'
  ) => {
    try {
      const { userID } = req.params;
      const tokenUserID = (req.user as JwtPayload).userId;
      const { img_url: imgURL } = req.body;
      const parsedUserID = parseInt(userID, 10);

      // 요청 구문이 잘못된 경우 400 코드 리턴함
      if (isNaN(parsedUserID) || typeof imgURL !== 'string' || !imgURL) {
        return res.status(400).json({ message: 'Bad request' });
      }

      // 접근권한이 없는 경우 403 코드 리턴함
      if (parsedUserID !== Number(tokenUserID)) {
        return res.status(403).json({ message: 'Forbidden: User ID mismatch' });
      }

      const affectedRows = await registerProfileImgService(
        parsedUserID,
        imgURL
      );

      // 프로필 사진 등록에 성공한 경우 201 코드, 프로필 사진 변경에 성공한 경우 200 코드 리턴함
      if (affectedRows > 0) {
        const successMessage =
          action === 'register'
            ? 'Successfully posted the profile image'
            : 'Successfully changed the profile image';

        return res
          .status(action === 'register' ? 201 : 200)
          .json({ message: successMessage });
      } else {
        return res.status(500).json({ message: 'Internal server error' });
      }
    } catch (error) {
      // 존재하지 않는 사용자인 경우 404 코드 리턴함
      if (error.message === 'Not found such user') {
        return res.status(404).json({ message: 'Not found such user' });
      }
      // 서버 내부 오류인 경우 500 코드 리턴함
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // 프로필 사진 등록 controller
  register: async (req: Request, res: Response) => {
    return profileImgController.handleProfileImg(req, res, 'register');
  },

  // 프로필 사진 변경 controller
  update: async (req: Request, res: Response) => {
    return profileImgController.handleProfileImg(req, res, 'update');
  }
};

// 마이페이지 배경 사진 관련 controller
export const backgroundImgController = {
  // 메인 controller
  handleBackgroundImg: async (
    req: Request,
    res: Response,
    action: 'register' | 'update'
  ) => {
    try {
      const { userID } = req.params;
      const tokenUserID = (req.user as JwtPayload).userId;
      const { img_url: imgURL } = req.body;
      const parsedUserID = parseInt(userID, 10);

      // 요청 구문이 잘못된 경우 400 코드 리턴함
      if (isNaN(parsedUserID) || typeof imgURL !== 'string' || !imgURL) {
        return res.status(400).json({ message: 'Bad request' });
      }

      // 접근권한이 없는 경우 403 코드 리턴함
      if (parsedUserID !== Number(tokenUserID)) {
        return res.status(403).json({ message: 'Forbidden: User ID mismatch' });
      }

      const affectedRows = await registerBackgroundImgService(
        parsedUserID,
        imgURL
      );

      // 마이페이지 배경 사진 등록에 성공한 경우 201 코드, 프로필 사진 변경에 성공한 경우 200 코드 리턴함
      if (affectedRows > 0) {
        const successMessage =
          action === 'register'
            ? 'Successfully posted the profile background image'
            : 'Successfully changed the profile background image';

        return res
          .status(action === 'register' ? 201 : 200)
          .json({ message: successMessage });
      } else {
        return res.status(500).json({ message: 'Internal server error' });
      }
    } catch (error) {
      // 존재하지 않는 사용자인 경우 404 코드 리턴함
      if (error.message === 'Not found such user') {
        return res.status(404).json({ message: 'Not found such user' });
      }
      // 서버 내부 오류인 경우 500 코드 리턴함
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  // 마이페이지 배경 사진 등록 controller
  register: async (req: Request, res: Response) => {
    return backgroundImgController.handleBackgroundImg(req, res, 'register');
  },

  // 마이페이지 배경 사진 변경 controller
  update: async (req: Request, res: Response) => {
    return backgroundImgController.handleBackgroundImg(req, res, 'update');
  }
};

// 로그아웃 controller
export const logoutController = async (req: Request, res: Response) => {
  try {
    const { userID } = req.params;
    const tokenUserID = (req.user as JwtPayload).userId;
    const parsedUserID = parseInt(userID, 10);

    // 요청 구문이 잘못된 경우 400 코드 리턴함
    if (isNaN(parsedUserID)) {
      return res.status(400).json({ message: 'Bad request' });
    }

    // 접근권한이 없는 경우 403 코드 리턴함
    if (parsedUserID !== Number(tokenUserID)) {
      return res.status(403).json({ message: 'Forbidden: User ID mismatch' });
    }

    await logoutService(parsedUserID);

    // 로그아웃에 성공한 경우 200 코드 리턴함
    return res.status(200).json({ message: 'Successfully log out' });
  } catch (error) {
    // 존재하지 않는 사용자인 경우 404 코드 리턴함
    if (error.message === 'Not found such user') {
      return res.status(404).json({ message: 'Not found such user' });
    }
    // 서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Access token 재발급 controller
export const tokenRefreshController = async (req: Request, res: Response) => {
  try {
    const { userID } = req.params;
    const parsedUserID = parseInt(userID, 10);
    const { refresh_token: refreshToken } = req.body;

    // 요청 구문이 잘못된 경우 400 코드 리턴함
    if (!refreshToken) {
      return res.status(400).json({ message: 'Bad request' });
    }

    const result = await tokenRefreshService(parsedUserID, refreshToken);

    // Access token 재발급에 성공한 경우 200 코드와 재발급된 JWT 리턴함
    return res.status(200).json(result);
  } catch (error) {
    // Refresh token이 만료된 경우 401 코드 리턴함
    if (error.message === 'Invalid or expired refresh token') {
      return res
        .status(401)
        .json({ message: 'Invalid or expired refresh token' });
    }
    // 존재하지 않는 사용자인 경우 404 코드 리턴함
    if (error.message === 'Not found such user') {
      return res.status(404).json({ message: 'Not found such user' });
    }

    // 서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};

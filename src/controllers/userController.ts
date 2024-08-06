// 사용자 관련 요청을 처리하는 controller
import { Request, Response } from 'express';
import {
  googleSignUpService,
  googleLoginService,
  naverSignUpService,
  naverLoginService,
  checkNicknameService,
  checkUserService,
  registerNicknameService
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
      return res.status(201).json(result);
    }

    // Naver 회원가입 service 호출
    if (serviceProvider === 'naver') {
      const result = await naverSignUpService({
        serviceProvider,
        authorizationCode,
        state
      });

      return res.status(201).json(result);
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
      return res.status(200).json(result);
    }

    // Naver 로그인 service 호출
    if (serviceProvider === 'naver') {
      const result = await naverLoginService({
        serviceProvider,
        authorizationCode,
        state
      });

      // 로그인 성공한 경우 200 코드와 id, access token, refresh token 리턴함
      return res.status(200).json(result);
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

// 닉네임 관련 controller
export const nicknameController = {
  // 닉네임 중복확인 controller
  check: async (req: Request, res: Response) => {
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
  },
  // 닉네임 등록 controller
  register: async (req: Request, res: Response) => {
    try {
      const { userID } = req.params;
      const { nickname } = req.body;

      const parsedUserID = parseInt(userID, 10);

      // 요청 구문이 잘못된 경우 400 코드 리턴함
      if (isNaN(parsedUserID) || typeof nickname !== 'string' || !nickname) {
        return res.status(400).json({ message: 'Bad request' });
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
      // 서버 내부 오류인 경우 500 코드 리턴함
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
  // 닉네임 변경 controller
  update: async (req: Request, res: Response) => {
    try {
      const { userID } = req.params;
      const { nickname } = req.body;

      const parsedUserID = parseInt(userID, 10);

      // 요청 구문이 잘못된 경우 400 코드 리턴함
      if (isNaN(parsedUserID) || typeof nickname !== 'string' || !nickname) {
        return res.status(400).json({ message: 'Bad request' });
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
      // 서버 내부 오류인 경우 500 코드 리턴함
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
};

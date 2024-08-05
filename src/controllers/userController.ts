// 사용자 관련 요청을 처리하는 controller
import { Request, Response } from 'express';
import {
  googleSignUpService,
  googleLoginService
} from '../services/userService.js';

//회원가입 controller
export const signUpController = async (req: Request, res: Response) => {
  try {
    const {
      service_provider: serviceProvider,
      authorization_code: authorizationCode
    } = req.body;
    const validProviders: string[] = ['google', 'naver', 'kakao'];

    // 요청 구문이 잘못된 경우 400 코드 리턴함
    if (!validProviders.includes(serviceProvider))
      return res.status(400).json({ message: 'Bad request' });

    // Google 회원가입 service 호출
    if (serviceProvider === 'google') {
      const result = await googleSignUpService({
        serviceProvider,
        authorizationCode
      });

      // 회원가입 성공한 경우 201 코드와 id, access token, refresh token 리턴함
      return res.status(201).json(result);
    }

    // Naver 회원가입 service 호출
    if (serviceProvider === 'naver') {
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

    //서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 로그인 controller
export const loginController = async (req: Request, res: Response) => {
  try {
    const {
      service_provider: serviceProvider,
      authorization_code: authorizationCode
    } = req.body;
    const validProviders: string[] = ['google', 'naver', 'kakao'];

    // 요청 구문이 잘못된 경우 400 코드 리턴함
    if (!validProviders.includes(serviceProvider))
      return res.status(400).json({ message: 'Bad request' });

    // Google 로그인 service 호출
    if (serviceProvider === 'google') {
      const result = await googleLoginService({
        serviceProvider,
        authorizationCode
      });

      // 로그인 성공한 경우 200 코드와 id, access token, refresh token 리턴함
      return res.status(200).json(result);
    }

    // Naver 로그인 service 호출
    if (serviceProvider === 'naver') {
    }

    // Kakao 로그인 service 호출
    if (serviceProvider === 'kakao') {
    }
  } catch (error) {
    // 가입되지 않은 사용자인 경우 404 코드 리턴함
    if (error.message === 'Cannot find user account') {
      return res.status(404).json({ message: 'Cannot find user account' });
    }
    //서버 내부 오류인 경우 500 코드 리턴함
    return res.status(500).json({ message: 'Internal server error' });
  }
};

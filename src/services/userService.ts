// 사용자 관련 service
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { IAuthRequest } from '../types/user';
import {
  deleteJWTInRedis,
  generateAccessToken,
  generateRefreshToken,
  storeJWTInRedis
} from './jwtService.js';
import User from '../models/user.js';

// Google 회원가입 service
export const googleSignUpService = async (
  authRequest: IAuthRequest
): Promise<{ userId: number; accessToken: string; refreshToken: string }> => {
  try {
    const { authorizationCode } = authRequest;

    // Google로 부터 access token을 받아옴
    const googleResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        code: authorizationCode,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      }
    );
    const { id_token } = googleResponse.data;

    // access token과 같이 받은 id_token을 디코딩해서 이메일 부분만 사용
    const { email: userEmail } = jwt.decode(id_token) as { [key: string]: any };

    // 이미 존재하는 사용자인지 확인
    const isUserExists = await User.isUserExists(userEmail);

    if (isUserExists !== null) {
      throw new Error('The user already exists');
    }

    // 닉네임 중복 방지를 위해 초기 닉네임을 uuid로 설정
    const randomNickname = uuidv4();
    const userId = await User.createUser(userEmail, randomNickname);

    if (userId === null) {
      throw new Error('Database insert failed');
    }

    // 사용자의 ID와 email 주소를 payload에 넣어서 JWT 발급
    const accessToken = generateAccessToken({
      userId: userId,
      email: userEmail
    });
    const refreshToken = generateRefreshToken({
      userId: userId,
      email: userEmail
    });

    // 사용자의 ID와 새로 발급된 JWT를 Redis에 저장
    await storeJWTInRedis(userId, accessToken, refreshToken);

    return { userId, accessToken, refreshToken };
  } catch (error) {
    console.error('Error in googleSignUp service', error.message);
    throw error;
  }
};

// Google 로그인 service
export const googleLoginService = async (
  authRequest: IAuthRequest
): Promise<{ userId: number; accessToken: string; refreshToken: string }> => {
  try {
    const { authorizationCode } = authRequest;

    // Google로 부터 access token을 받아옴
    const googleResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        code: authorizationCode,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      }
    );
    const { id_token } = googleResponse.data;

    // access token과 같이 받은 id_token을 디코딩해서 이메일 부분만 사용
    const { email: userEmail } = jwt.decode(id_token) as { [key: string]: any };

    // 회원가입되지 않은 사용자인지 확인
    const userId = await User.isUserExists(userEmail);

    if (userId === null) {
      throw new Error('Cannot find user account');
    }

    // 사용자의 ID와 email 주소를 payload에 넣어서 JWT 발급
    const accessToken = generateAccessToken({
      userId: userId,
      email: userEmail
    });
    const refreshToken = generateRefreshToken({
      userId: userId,
      email: userEmail
    });

    // 사용자의 기존 JWT 삭제
    await deleteJWTInRedis(userId);
    // 사용자의 ID와 새로 발급된 JWT를 Redis에 저장
    await storeJWTInRedis(userId, accessToken, refreshToken);

    return { userId, accessToken, refreshToken };
  } catch (error) {
    console.error('Error in googleLogin service', error.message);
    throw error;
  }
};

// Naver 회원가입 service
export const naverSignUpService = async () => {};

// Kakao 회원가입 service
export const kakaoSignUpService = async () => {};

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
import User from '../models/userModel.js';

// Google 회원가입 service
export const googleSignUpService = async (
  authRequest: IAuthRequest
): Promise<{ userId: number; accessToken: string; refreshToken: string }> => {
  try {
    const { authorizationCode } = authRequest;

    // 환경 변수에서 필요한 값을 가져옵니다.
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    // 필수 환경 변수가 없는 경우 오류 처리
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(
        'Missing necessary environment variables for Google OAuth'
      );
    }

    // Google로 부터 access token을 받아옴
    const googleResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        code: authorizationCode,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }
    );
    const { id_token } = googleResponse.data;

    // access token과 같이 받은 id_token을 디코딩해서 이메일 부분만 사용
    const { email: userEmail } = jwt.decode(id_token) as { [key: string]: any };

    // 이미 존재하는 사용자인지 확인
    const isUserExists = await User.isUserExistsByEmail(userEmail);

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

    // 환경 변수에서 필요한 값을 가져옵니다.
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    // 필수 환경 변수가 없는 경우 오류 처리
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(
        'Missing necessary environment variables for Google OAuth'
      );
    }

    // Google로 부터 access token을 받아옴
    const googleResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        code: authorizationCode,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }
    );
    const { id_token } = googleResponse.data;

    // access token과 같이 받은 id_token을 디코딩해서 이메일 부분만 사용
    const { email: userEmail } = jwt.decode(id_token) as { [key: string]: any };

    // 회원가입되지 않은 사용자인지 확인
    const userId = await User.isUserExistsByEmail(userEmail);

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
export const naverSignUpService = async (
  authRequest: IAuthRequest
): Promise<{ userId: number; accessToken: string; refreshToken: string }> => {
  try {
    const { authorizationCode, state } = authRequest;

    // 환경 변수에서 필요한 값을 가져옵니다.
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    const redirectUri = process.env.NAVER_REDIRECT_URI;

    // 필수 환경 변수가 없는 경우 오류 처리
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(
        'Missing necessary environment variables for Naver OAuth'
      );
    }

    // Naver로 부터 access token을 받아옴
    const naverResponse = await axios.post(
      'https://nid.naver.com/oauth2.0/token',
      new URLSearchParams({
        code: authorizationCode,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        state: state
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // access token만 추출하여 사용
    const { access_token: naverAccessToken } = naverResponse.data;

    // 사용자 이메일을 가져오기 위해 네이버 프로필 API 호출
    const profileResponse = await axios.get(
      'https://openapi.naver.com/v1/nid/me',
      {
        headers: {
          Authorization: `Bearer ${naverAccessToken}`
        }
      }
    );

    const userEmail = profileResponse.data.response.email;

    // 이미 존재하는 사용자인지 확인
    const isUserExists = await User.isUserExistsByEmail(userEmail);

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
    console.error('Error in naverSignUp service', error.message);
    throw error;
  }
};

// Naver 로그인 service
export const naverLoginService = async (
  authRequest: IAuthRequest
): Promise<{ userId: number; accessToken: string; refreshToken: string }> => {
  try {
    const { authorizationCode, state } = authRequest;

    // 환경 변수에서 필요한 값을 가져옵니다.
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    const redirectUri = process.env.NAVER_REDIRECT_URI;

    // 필수 환경 변수가 없는 경우 오류 처리
    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(
        'Missing necessary environment variables for Naver OAuth'
      );
    }

    // Naver로 부터 access token을 받아옴
    const naverResponse = await axios.post(
      'https://nid.naver.com/oauth2.0/token',
      new URLSearchParams({
        code: authorizationCode,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
        state: state
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // access token만 추출하여 사용
    const { access_token: naverAccessToken } = naverResponse.data;

    // 사용자 이메일을 가져오기 위해 네이버 프로필 API 호출
    const profileResponse = await axios.get(
      'https://openapi.naver.com/v1/nid/me',
      {
        headers: {
          Authorization: `Bearer ${naverAccessToken}`
        }
      }
    );

    const userEmail = profileResponse.data.response.email;

    // 회원가입되지 않은 사용자인지 확인
    const userId = await User.isUserExistsByEmail(userEmail);

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
    console.error('Error in naverLogin service', error.message);
    throw error;
  }
};

// 닉네임 중복확인 service
export const checkNicknameService = async (
  nickname: string
): Promise<number | null> => {
  const result: number | null = await User.isNicknameExists(nickname);

  return result;
};

// 사용자 가입여부 확인 service
export const checkUserService = async (
  userID: number
): Promise<number | null> => {
  const result: number | null = await User.isUserExistsById(userID);

  return result;
};

// 닉네임 등록 service
export const registerNicknameService = async (
  userID: number,
  nickname: string
): Promise<number> => {
  const result: number = await User.updateUserNickname(userID, nickname);

  return result;
};

// // Kakao 회원가입 service
// export const kakaoSignUpService = async (
//   authRequest: IAuthRequest
// ): Promise<{ userId: number; accessToken: string; refreshToken: string }> => {};

// // Kakao 로그인 service
// export const kakaoLoginService = async (
//   authRequest: IAuthRequest
// ): Promise<{ userId: number; accessToken: string; refreshToken: string }> => {};

// 사용자 관련 service
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { IAuthRequest } from '../types/user';
import {
  deleteJWTInRedis,
  generateAccessToken,
  generateRefreshToken,
  storeJWTInRedis,
  verifyRefreshToken
} from './jwtService.js';
import User from '../models/userModel.js';
import redisClient from '../config/redisConfig.js';
import { generateGetPresignedUrl } from '../utils/s3Utils.js';
import { generateUniqueRandomNickname } from '../utils/randomNickname.js';

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

    // 닉네임 중복 방지를 위해 초기 닉네임을 랜덤 동물 닉네임으로 설정
    const randomNickname = await generateUniqueRandomNickname();

    const userId = await User.createUser(userEmail, randomNickname);

    if (userId === null) {
      throw new Error('Database insert failed');
    }

    // 사용자의 ID와 email 주소를 payload에 넣어서 JWT 발급
    const accessToken = await generateAccessToken({
      userId: userId,
      email: userEmail
    });
    const refreshToken = await generateRefreshToken({
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
    const accessToken = await generateAccessToken({
      userId: userId,
      email: userEmail
    });
    const refreshToken = await generateRefreshToken({
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

    // 닉네임 중복 방지를 위해 초기 닉네임을 랜덤 동물 닉네임으로 설정
    const randomNickname = await generateUniqueRandomNickname();

    const userId = await User.createUser(userEmail, randomNickname);

    if (userId === null) {
      throw new Error('Database insert failed');
    }

    // 사용자의 ID와 email 주소를 payload에 넣어서 JWT 발급
    const accessToken = await generateAccessToken({
      userId: userId,
      email: userEmail
    });
    const refreshToken = await generateRefreshToken({
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
    const accessToken = await generateAccessToken({
      userId: userId,
      email: userEmail
    });
    const refreshToken = await generateRefreshToken({
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
  try {
    const result: number | null = await User.isUserExistsByNickname(nickname);

    return result;
  } catch (error) {
    console.error('Error in checkNicknameService', error.message);
    throw error;
  }
};

// 사용자 가입여부 확인 service
export const checkUserService = async (
  userID: number
): Promise<number | null> => {
  try {
    const result: number | null = await User.isUserExistsById(userID);

    return result;
  } catch (error) {
    console.error('Error in checkUserService', error.message);
    throw error;
  }
};

// 닉네임 등록, 변경 service
export const registerNicknameService = async (
  userID: number,
  nickname: string
): Promise<number> => {
  try {
    if (nickname.length < 2 || nickname.length > 14) {
      throw new Error('The nickname is invalid');
    }

    const result: number = await User.updateUserNickname(userID, nickname);

    return result;
  } catch (error) {
    console.error('Error in registerNicknameService', error.message);
    throw error;
  }
};

// 사용자 검색 service
export const searchUserService = async (
  nickname: string,
  email: string
): Promise<object> => {
  try {
    let userID: number | null;

    if (!nickname) {
      userID = await User.isUserExistsByEmail(email);
    } else {
      userID = await User.isUserExistsByNickname(nickname);
    }

    if (!userID) {
      throw new Error('Not found such user');
    }

    const searchedUserInfo = await User.getUserById(userID);

    if (!searchedUserInfo) {
      throw new Error('Not found such user');
    }

    const profileImgURL = searchedUserInfo.profile_img_url
      ? await generateGetPresignedUrl(searchedUserInfo.profile_img_url)
      : null;

    const result = {
      user_id: searchedUserInfo.id,
      nickname: searchedUserInfo.nickname,
      profile_img_url: profileImgURL
    };

    return result;
  } catch (error) {
    console.error('Error in searchUserService', error.message);
    throw error;
  }
};

// 사용자 정보 확인 service
export const userInfoService = async (userID: number): Promise<object> => {
  try {
    const result = await User.getUserInfoById(userID);

    if (!result) {
      throw new Error('Not found such user');
    }

    const profileImgURL = result.profile_img_url
      ? await generateGetPresignedUrl(result.profile_img_url)
      : null;
    const profileBackgroundImgURL = result.profile_background_img_url
      ? await generateGetPresignedUrl(result.profile_background_img_url)
      : null;

    const userInfo = {
      id: result.id,
      profile_img_url: profileImgURL,
      profile_background_img_url: profileBackgroundImgURL,
      nickname: result.nickname,
      email_address: result.email,
      mate_count: result.mate_count ?? 0,
      diary_count: result.diary_count ?? 0
    };

    return userInfo;
  } catch (error) {
    console.error('Error in userInfoService', error.message);
    throw error;
  }
};

// 회원 탈퇴 service
export const deleteUserService = async (userID: number): Promise<number> => {
  try {
    const result = await User.deleteUserById(userID);

    if (!result) {
      throw new Error('Not found such user');
    }

    // Redis에 저장된 JWT 삭제
    await deleteJWTInRedis(userID);

    return result;
  } catch (error) {
    console.error('Error in deleteUserService', error.message);
    throw error;
  }
};

// 프로필 사진 등록, 변경 service
export const registerProfileImgService = async (
  userID: number,
  imgURL: string
): Promise<number> => {
  try {
    const result: number = await User.updateUserProfileImg(userID, imgURL);

    if (!result) {
      throw new Error('Not found such user');
    }

    return result;
  } catch (error) {
    console.error('Error in registerProfileImgService', error.message);
    throw error;
  }
};

// 마이페이지 배경 사진 등록, 변경 service
export const registerBackgroundImgService = async (
  userID: number,
  imgURL: string
): Promise<number> => {
  try {
    const result: number = await User.updateUserBackgroundImg(userID, imgURL);

    if (!result) {
      throw new Error('Not found such user');
    }

    return result;
  } catch (error) {
    console.error('Error in registerBackgroundImgService', error.message);
    throw error;
  }
};

// 로그아웃 service
export const logoutService = async (userID: number): Promise<void> => {
  try {
    // Redis에 저장된 JWT 삭제
    await deleteJWTInRedis(userID);
  } catch (error) {
    console.error('Error in logoutService', error.message);
    throw error;
  }
};

// Access token 재발급 service
export const tokenRefreshService = async (
  userID: number,
  refreshToken: string
): Promise<object> => {
  try {
    // Refresh token 검증
    await verifyRefreshToken(refreshToken);

    // Redis에 해당 token이 있는지 확인
    const storedToken = await redisClient.hGetAll(String(userID));

    if (!storedToken || storedToken.refreshToken !== refreshToken) {
      throw new Error('Invalid or expired refresh token');
    }

    const result = await User.getUserById(userID);

    if (!result) {
      throw new Error('Not found such user');
    }

    const userEmail = result.email;

    // 사용자의 ID와 email 주소를 payload에 넣어서 JWT 발급
    const newAccessToken = await generateAccessToken({
      userId: userID,
      email: userEmail
    });
    const newRefreshToken = await generateRefreshToken({
      userId: userID,
      email: userEmail
    });

    // 사용자의 기존 JWT 삭제
    await deleteJWTInRedis(userID);
    // 사용자의 ID와 새로 발급된 JWT를 Redis에 저장
    await storeJWTInRedis(userID, newAccessToken, newRefreshToken);

    return {
      user_id: userID,
      access_token: newAccessToken,
      refresh_token: newRefreshToken
    };
  } catch (error) {
    console.error('Error in access token reissue', error.message);
    throw error;
  }
};

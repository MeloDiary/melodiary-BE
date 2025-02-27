// JWT 발급, 검증 관련 service
import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import redisClient from '../config/redisConfig.js';

/**
 * Acess token을 생성하는 함수입니다.
 * @param payload - Access token의 payload에 포함할 내용을 담은 객체
 * @returns 서명된 acess token
 */
export const generateAccessToken = async (payload: object): Promise<string> => {
  try {
    const jwtSecret: Secret = process.env.JWT_SECRET as string;
    const jwtExpiresIn: string = process.env.JWT_EXPIRES_IN || '1h';
    const signOptions: SignOptions = {
      expiresIn: jwtExpiresIn
    };

    return jwt.sign(payload, jwtSecret, signOptions);
  } catch (error) {
    console.error('Error occured during generating access token: ', error);
    throw new Error('Error occured during generating access token');
  }
};

/**
 * Refresh token을 생성하는 함수입니다.
 * @param payload - Refresh token의 payload에 포함할 내용을 담은 객체
 * @returns 서명된 refresh token
 */
export const generateRefreshToken = async (
  payload: object
): Promise<string> => {
  try {
    const jwtRefreshExpiresIn: string =
      process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const jwtRefreshSecret: Secret = process.env.JWT_REFRESH_SECRET as string;
    const signOptions: SignOptions = {
      expiresIn: jwtRefreshExpiresIn
    };

    return jwt.sign(payload, jwtRefreshSecret, signOptions);
  } catch (error) {
    console.error('Error occured during generating refresh token: ', error);
    throw new Error('Error occured during generating refresh token');
  }
};

/**
 * JWT를 Redis에 저장하는 함수입니다.
 * @param userId - 사용자 ID
 * @param accessToken - 생성한 access token
 * @param refreshToken - 생성한 refresh token
 */
export const storeJWTInRedis = async (
  userId: number,
  accessToken: string,
  refreshToken: string
): Promise<void> => {
  try {
    const userIdString = userId.toString();
    await redisClient.hSet(userIdString, {
      accessToken,
      refreshToken
    });
    await redisClient.expire(userIdString, 7 * 24 * 60 * 60);
    console.log('Tokens saved to Redis');
  } catch (error) {
    console.error('Failed to store tokens in Redis', error);
    throw new Error('Error occured during storing JWT');
  }
};

/**
 * Redis에 저장된 JWT를 삭제하는 함수입니다.
 * @param userId - 사용자 ID
 */
export const deleteJWTInRedis = async (userId: number): Promise<void> => {
  try {
    const userIdString = userId.toString();
    await redisClient.del(userIdString);
    console.log('Tokens deleted from Redis');
  } catch (error) {
    console.error('Failed to delete tokens in Redis', error);
    throw new Error('Error occured during deleting JWT');
  }
};

/**
 * Access token을 검증하는 함수입니다.
 * @param token - 검증할 access token
 * @returns 디코딩된 access token
 * @throws Access token이 유효하지 않거나 만료된 경우
 */
export const verifyAccessToken = async (token: string): Promise<object> => {
  try {
    const jwtSecret: Secret = process.env.JWT_SECRET as string;

    return jwt.verify(token, jwtSecret) as JwtPayload;
  } catch (error) {
    console.error('Error occured during verify access token', error);
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Refresh token을 검증하는 함수입니다.
 * @param token - 검증할 refresh token
 * @returns 디코딩된 refresh token
 * @throws Refresh token이 유효하지 않거나 만료된 경우
 */
export const verifyRefreshToken = async (token: string): Promise<object> => {
  try {
    const jwtRefreshSecret: Secret = process.env.JWT_REFRESH_SECRET as string;
    return jwt.verify(token, jwtRefreshSecret) as JwtPayload;
  } catch (error) {
    console.error('Error occured during verify refresh token', error);
    throw new Error('Invalid or expired refresh token');
  }
};

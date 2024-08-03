// JWT 발급, 검증 관련 service
import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';

/**
 * Acess token을 생성하는 함수입니다.
 * @param payload - Access token의 payload에 포함할 내용을 담은 객체
 * @returns 서명된 acess token
 */
export const generateAccessToken = (payload: object): string => {
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
export const generateRefreshToken = (payload: object): string => {
  try {
    const jwtRefreshExpiresIn: string =
      process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const jwtRefreshSecret: Secret = process.env.JWT_REFRESH_SECRET as string;
    const signOptions: SignOptions = {
      expiresIn: jwtRefreshExpiresIn
    };

    return jwt.sign(payload, jwtRefreshSecret, signOptions);
  } catch (error) {
    throw new Error('Error occured during generating refresh token');
  }
};

/**
 * Access token을 검증하는 함수입니다.
 * @param token - 검증할 access token
 * @returns The decoded token payload if verification is successful
 * @throws If the token is invalid or expired
 */
export const verifyAccessToken = (token: string): object => {
  try {
    const jwtSecret: Secret = process.env.JWT_SECRET as string;
    return jwt.verify(token, jwtSecret) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Refresh token을 검증하는 함수입니다.
 * @param token - 검증할 refresh token
 * @returns The decoded token payload if verification is successful
 * @throws If the token is invalid or expired
 */
export const verifyRefreshToken = (token: string): object => {
  try {
    const jwtRefreshSecret: Secret = process.env.JWT_REFRESH_SECRET as string;
    return jwt.verify(token, jwtRefreshSecret) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

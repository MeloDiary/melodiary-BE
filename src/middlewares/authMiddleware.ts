import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { verifyAccessToken } from '../services/jwtService.js';
import redisClient from '../config/redisConfig.js';

// JWT 검증 미들웨어
export const verifyTokenMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // 헤더에서 토큰을 가져옴
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"에서 TOKEN만 추출

  if (!token) {
    return res
      .status(401)
      .json({ message: 'The access token is invalid or expired' });
  }

  try {
    // 토큰 검증
    const decoded = (await verifyAccessToken(token)) as JwtPayload;

    // Redis에 해당 토큰이 있는지 확인
    const userID = String(decoded.userId);
    const storedToken = await redisClient.hGetAll(userID);

    if (!storedToken || storedToken.accessToken !== token) {
      return res
        .status(401)
        .json({ message: 'The access token is invalid or expired' });
    }

    // 토큰이 유효한 경우 요청에 디코딩된 토큰 내용 추가
    req.user = decoded;

    next(); // 다음 미들웨어 또는 라우트 핸들러로 이동
  } catch (error) {
    console.error('Error in authMiddleware', error.message);
    return res
      .status(401)
      .json({ message: 'The access token is invalid or expired' });
  }
};

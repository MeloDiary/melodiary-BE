import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { verifyAccessToken } from '../services/jwtService.js';

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
    const { userID } = req.params;
    const tokenUserID = decoded.userId;

    if (userID !== String(tokenUserID)) {
      return res.status(403).json({ message: 'Forbidden: User ID mismatch' });
    }
    next(); // 다음 미들웨어 또는 라우트 핸들러로 이동
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Request, Response } from 'express';
import dbPool from '../config/dbConfig.js';
import Joi from 'joi';

export const getMusicHistory = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();
  try {
    const userId = parseInt(req.params.userID, 10);
  } catch (error) {
    await dbConnection.rollback();
    console.error('업데이트 오류:', error);
    res.status(500).json({
      message: 'There is something wrong with the server'
    });
  } finally {
    dbConnection.release();
  }
};

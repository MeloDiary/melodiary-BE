import { RowDataPacket } from 'mysql2';
import { Request, Response } from 'express';
import dbPool from '../config/dbConfig.js';
import Joi from 'joi';

export const getMusicHistory = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();

  try {
    const userId = parseInt(req.params.userID, 10);
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).default(5)
    });
    let {
      error,
      value: { page, limit }
    } = schema.validate(req.query);
    if (error) {
      page = page || 1;
      limit = limit || 5;
    }

    let userQuery = `SELECT id, nickname, profile_img_url FROM user WHERE id=?`;
    const [userRows] = await dbConnection.execute<RowDataPacket[]>(userQuery, [
      userId
    ]);
    if (userRows.length == 0) {
      return res.status(404).json({ message: 'Not found that user' });
    }

    const musicQuery = `
    SELECT SQL_CALC_FOUND_ROWS
      m.*, d.created_at
      FROM music m
    LEFT JOIN
      diary d ON d.id=m.diary_id
    WHERE
      d.user_id= ?
    ORDER BY
      d.created_at DESC
      LIMIT ${limit} OFFSET ${limit * (page - 1)};

    `;
    const [musicRows] = await dbConnection.execute<RowDataPacket[]>(
      musicQuery,
      [userId]
    );

    const countQuery = `SELECT FOUND_ROWS() as total`;
    const [[{ total }]] = await dbConnection.execute<RowDataPacket[]>(
      countQuery
    );

    return res.status(200).json({
      user_profile: userRows[0],
      total_count: total,
      musics: musicRows.map((row) => {
        return {
          music_url: row.music_url,
          title: row.title,
          artist: row.artist,
          created_at: row.created_at
        };
      })
    });
  } catch (error) {
    console.error('업데이트 오류:', error);
    res.status(500).json({
      message: 'There is something wrong with the server'
    });
  } finally {
    dbConnection.release();
  }
};

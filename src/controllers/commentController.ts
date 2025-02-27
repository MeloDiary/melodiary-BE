import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Request, Response } from 'express';
import dbPool from '../config/dbConfig.js';
import {
  IComment,
  IPostComment,
  IUserProfile,
  IUserProfileRowDataPacket
} from '../types/comment.js';
import { JwtPayload } from 'jsonwebtoken';
import Joi from 'joi';
import { generateGetPresignedUrl } from '../utils/s3Utils.js';

export const postComment = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();
  try {
    const diaryId = parseInt(req.params.diaryId, 10);
    const { content, mentioned_user_id }: IPostComment = req.body;

    const commentSchema = Joi.object({
      content: Joi.string().required(),
      mentioned_user_id: Joi.number().optional(),
      diaryId: Joi.number().required()
    });

    const { error } = commentSchema.validate({
      content,
      mentioned_user_id,
      diaryId
    });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { userId } = req.user as JwtPayload;

    await dbConnection.beginTransaction();

    // 해당 일기에 접근 권한 여부 확인
    const checkQuery = `SELECT user_id, privacy FROM diary WHERE id=?`;
    const [checkRows] = await dbConnection.execute<RowDataPacket[]>(
      checkQuery,
      [diaryId]
    );
    const checkRow = checkRows[0];
    const checkAuth = await checkAccessAuth(
      userId,
      checkRow.user_id,
      checkRow.privacy
    );
    if (!checkAuth) {
      return res
        .status(403)
        .json({ message: 'No permission to access the comment' });
    }

    const writerUser = await validateUser(userId);
    const mentionedUser = mentioned_user_id
      ? await validateUser(mentioned_user_id)
      : null;
    if (writerUser == undefined) {
      return res
        .status(500)
        .json({ message: `Not found that user (userId : ${userId})` });
    }
    if (mentioned_user_id && mentionedUser == undefined) {
      return res.status(404).json({
        message: `Not found that user (userId : ${mentioned_user_id})`
      });
    }

    const commentQuery = `INSERT INTO comment (content, writer_user_id, mentioned_user_id,diary_id) 
                      VALUES (?, ?, ?,?)`;

    const [result] = await dbConnection.execute<ResultSetHeader>(commentQuery, [
      content,
      userId,
      mentioned_user_id ? mentioned_user_id : null,
      diaryId
    ]);
    const commentId = result.insertId;

    await dbConnection.commit();
    res.status(201).json({ comment_id: commentId });
  } catch (error) {
    await dbConnection.rollback();
    console.error('조회 오류:', error);
    res
      .status(500)
      .json({ message: 'There is something wrong with the server' });
  } finally {
    dbConnection.release();
  }
};
export const getComments = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();

  try {
    const diaryId = parseInt(req.params.diaryId, 10);
    const { userId } = req.user as JwtPayload;

    const commentSchema = Joi.object({
      diaryId: Joi.number().required()
    });

    const { error } = commentSchema.validate({
      diaryId
    });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // 해당 일기에 접근 권한 여부 확인
    const checkQuery = `SELECT user_id, privacy FROM diary WHERE id=?`;
    const [checkRows] = await dbConnection.execute<RowDataPacket[]>(
      checkQuery,
      [diaryId]
    );
    const checkRow = checkRows[0];
    const checkAuth = await checkAccessAuth(
      userId,
      checkRow.user_id,
      checkRow.privacy
    );
    if (!checkAuth) {
      return res
        .status(403)
        .json({ message: 'No permission to access the diary' });
    }

    const commentQuery = `SELECT * FROM comment WHERE diary_id= ? ORDER BY created_at DESC `;

    const [commentRows] = await dbConnection.execute<IComment[]>(commentQuery, [
      diaryId
    ]);

    const resultRows = await Promise.all(
      commentRows.map(async (row: IComment) => {
        let writerUser = await validateUser(row.writer_user_id);
        let mentionedUser = row.mentioned_user_id
          ? await validateUser(row.mentioned_user_id)
          : {};
        if (writerUser == undefined) {
          writerUser = getInvalidUser(row.writer_user_id);
        }
        if (row.mentioned_user_id && mentionedUser == undefined) {
          mentionedUser = getInvalidUser(row.mentioned_user_id);
        }

        return {
          comment_id: row.id,
          writer_user_profile: writerUser,
          mentioned_user_profile: mentionedUser,
          created_at: row.created_at,
          diary_id: row.diary_id,
          content: row.content
        };
      })
    );
    res.status(200).json(resultRows);
  } catch (error) {
    console.error('조회 오류:', error);
    res
      .status(500)
      .json({ message: 'There is something wrong with the server' });
  } finally {
    dbConnection.release();
  }
};
export const putComment = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();
  try {
    const diaryId = parseInt(req.params.diaryId, 10);
    const commentId = parseInt(req.params.commentId, 10);
    const { content, mentioned_user_id }: IPostComment = req.body;

    const commentSchema = Joi.object({
      content: Joi.string().required(),
      mentioned_user_id: Joi.number().optional(),
      diaryId: Joi.number().required(),
      commentId: Joi.number().required()
    });

    const { error } = commentSchema.validate({
      content,
      mentioned_user_id,
      diaryId,
      commentId
    });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { userId } = req.user as JwtPayload;

    await dbConnection.beginTransaction();

    const checkQuery = `SELECT * FROM comment WHERE id=? AND writer_user_id=?`;
    const [checkResult] = await dbConnection.execute<RowDataPacket[]>(
      checkQuery,
      [commentId, userId]
    );
    if (checkResult.length == 0) {
      return res
        .status(403)
        .json({ message: 'No permission to access the comment' });
    }

    const writerUser = await validateUser(userId);
    const mentionedUser = mentioned_user_id
      ? await validateUser(mentioned_user_id)
      : null;
    if (writerUser == undefined) {
      return res
        .status(500)
        .json({ message: `Not found that user (userId : ${userId})` });
    }
    if (mentioned_user_id && mentionedUser == undefined) {
      return res.status(404).json({
        message: `Not found that user (userId : ${mentioned_user_id})`
      });
    }

    const commentQuery = `UPDATE comment SET content =?, mentioned_user_id=? 
                      WHERE id=?`;

    await dbConnection.execute<RowDataPacket[]>(commentQuery, [
      content,
      mentioned_user_id ? mentioned_user_id : null,
      commentId
    ]);

    await dbConnection.commit();
    res.status(200).json({ message: 'Successfully editted the comment' });
  } catch (error) {
    await dbConnection.rollback();
    console.error('조회 오류:', error);
    res
      .status(500)
      .json({ message: 'There is something wrong with the server' });
  } finally {
    dbConnection.release();
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();
  try {
    const diaryId = parseInt(req.params.diaryId, 10);
    const commentId = parseInt(req.params.commentId, 10);

    const commentSchema = Joi.object({
      diaryId: Joi.number().required(),
      commentId: Joi.number().required()
    });

    const { error } = commentSchema.validate({
      diaryId,
      commentId
    });
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { userId } = req.user as JwtPayload;

    await dbConnection.beginTransaction();

    const checkQuery = `SELECT * FROM comment WHERE id=? AND writer_user_id=?`;
    const [checkResult] = await dbConnection.execute<RowDataPacket[]>(
      checkQuery,
      [commentId, userId]
    );
    if (checkResult.length == 0) {
      return res
        .status(403)
        .json({ message: 'No permission to access the comment' });
    }

    const commentQuery = `DELETE FROM comment WHERE id=?`;

    await dbConnection.execute<RowDataPacket[]>(commentQuery, [commentId]);

    await dbConnection.commit();
    res.status(200).json({ message: 'Successfully deleted the comment' });
  } catch (error) {
    await dbConnection.rollback();
    console.error('조회 오류:', error);
    res
      .status(500)
      .json({ message: 'There is something wrong with the server' });
  } finally {
    dbConnection.release();
  }
};

const checkAccessAuth = async (
  userId: string | number,
  writerId: string | number,
  privacy: string
) => {
  if (writerId == userId || privacy == 'public') {
    return true;
  } else if (privacy == 'private') {
    return false;
  }
  // (row.privacy == 'mate')

  const dbConnection = await dbPool.getConnection();
  try {
    const mateQuery = `SELECT * FROM mate WHERE status='accepted' AND ((requested_user_id = ? AND received_user_id = ?) OR (requested_user_id = ? AND received_user_id = ?) )`;
    const [mateRows] = await dbConnection.execute<RowDataPacket[]>(mateQuery, [
      userId,
      writerId,
      writerId,
      userId
    ]);
    if (mateRows.length == 0) {
      return false;
    } else {
      return true;
    }
  } catch {
    throw new Error('mate 테이블 참조 불가 오류 발생');
  } finally {
    dbConnection.release();
  }
};

const validateUser = async (
  userId: string | number
): Promise<IUserProfile | undefined> => {
  const dbConnection = await dbPool.getConnection();
  try {
    const query = `SELECT id as user_id,nickname,profile_img_url FROM user WHERE id=?`;
    const [rows] = await dbConnection.execute<IUserProfileRowDataPacket[]>(
      query,
      [userId]
    );
    if (rows.length > 0) {
      const profileImgURL = rows[0].profile_img_url
      ? await generateGetPresignedUrl(rows[0].profile_img_url)
      : null;

      return {
        user_id: Number(userId),
        nickname: rows[0].nickname,
        profile_img_url: profileImgURL
      };
    } else {
      return undefined;
    }
  } finally {
    dbConnection.release();
  }
};

const getInvalidUser = (userId: number): IUserProfile => {
  const userProfile: IUserProfile = {
    user_id: userId,
    nickname: 'Invalid User',
    profile_img_url: ''
  };
  return userProfile;
};

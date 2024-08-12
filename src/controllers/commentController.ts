import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Request, Response } from 'express';
import dbPool from '../config/dbConfig.js';
import { IPostComment } from '../types/comment.js';
import { JwtPayload } from 'jsonwebtoken';

//권한
export const postComment = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();
  try {
    const diaryId = parseInt(req.params.diaryId, 10);
    const { content, mentioned_user_id }: IPostComment = req.body;
    const { userId } = req.user as JwtPayload;

    //일기에 접근 권한이 있는지?

    await dbConnection.beginTransaction();

    const commentQuery = `INSERT INTO comment (content, writter_user_id, mentioned_user_id,diary_id) 
                      VALUES (?, ?, ?,?)`;

    const [result] = await dbConnection.execute<ResultSetHeader>(commentQuery, [
      content,
      userId,
      mentioned_user_id,
      diaryId
    ]);
    const commentId = result.insertId;

    await dbConnection.commit();
    res.status(201).json({ comment_id: commentId });
  } catch (error) {
    await dbConnection.rollback();
    console.error('조회 오류:', error);
    res.status(500).send('There is something wrong with the server');
  } finally {
    dbConnection.release();
  }
};
export const getComments = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();
  try {
    const diaryId = parseInt(req.params.diaryId, 10);
    //const { userId } = req.user as JwtPayload;

    //일기에 접근 권한이 있는지?

    await dbConnection.beginTransaction();

    const commentQuery = `SELECT * FROM comment WHERE diary_id= ?`;

    const [commentRows] = await dbConnection.execute<ResultSetHeader>(
      commentQuery,
      [diaryId]
    );

    await dbConnection.commit();
    res.status(200).json(commentRows);
  } catch (error) {
    await dbConnection.rollback();
    console.error('조회 오류:', error);
    res.status(500).send('There is something wrong with the server');
  } finally {
    dbConnection.release();
  }
};
export const putComment = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();
  try {
    //const diaryId = parseInt(req.params.diaryId, 10);
    const commentId = parseInt(req.params.commentId, 10);
    const { content, mentioned_user_id }: IPostComment = req.body;
    const { userId } = req.user as JwtPayload;

    //일기에 접근 권한이 있는지?

    await dbConnection.beginTransaction();

    const checkQuery = `SELECT * FROM comment WHERE id=? AND writter_user_id=?`;
    const [checkResult] = await dbConnection.execute<RowDataPacket[]>(
      checkQuery,
      [commentId, userId]
    );
    if (checkResult.length == 0) {
      return res
        .status(403)
        .json({ message: 'No permission to access the comment' });
    }

    const commentQuery = `UPDATE comment SET content =?, mentioned_user_id=? 
                      WHERE id=?`;

    await dbConnection.execute<RowDataPacket[]>(commentQuery, [
      content,
      mentioned_user_id,
      commentId
    ]);

    await dbConnection.commit();
    res.status(200).json({ message: 'Successfully editted the comment' });
  } catch (error) {
    await dbConnection.rollback();
    console.error('조회 오류:', error);
    res.status(500).send('There is something wrong with the server');
  } finally {
    dbConnection.release();
  }
};
export const deleteComment = async (req: Request, res: Response) => {
  const dbConnection = await dbPool.getConnection();
  try {
    //const diaryId = parseInt(req.params.diaryId, 10);
    const commentId = parseInt(req.params.commentId, 10);
    const { userId } = req.user as JwtPayload;

    //일기에 접근 권한이 있는지?

    await dbConnection.beginTransaction();

    const checkQuery = `SELECT * FROM comment WHERE id=? AND mentioned_user_id=?`;
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
    res.status(500).send('There is something wrong with the server');
  } finally {
    dbConnection.release();
  }
};

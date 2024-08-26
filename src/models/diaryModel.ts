//일기 관련 DB 쿼리를 처리하는 model
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { Connection } from 'mysql2/promise';
import { IPostDiary } from '../types/diary.js';

class DiaryModel {
  static post = async (
    {
      title,
      content,
      img_urls,
      mood,
      emoji,
      privacy,
      background_color,
      music,
      weather
    }: IPostDiary,
    userId: number,
    dbConnection: Connection
  ): Promise<ResultSetHeader> => {
    try {
      const query = `INSERT INTO diary (title, content, user_id, mood, emoji, privacy, background_color) 
                      VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const [result] = await dbConnection.execute<ResultSetHeader>(query, [
        title,
        content,
        userId,
        mood,
        emoji,
        privacy,
        background_color
      ]);
      return result;
    } catch (error) {
      throw new Error('');
    }
  };

  static checkPostToday = async (
    userId: number,
    today: string,
    dbConnection: Connection
  ): Promise<RowDataPacket[]> => {
    try {
      const query = `SELECT * FROM diary WHERE user_id=? AND DATE(created_at)= ?`;
      const [result] = await dbConnection.execute<RowDataPacket[]>(query, [
        userId,
        today
      ]);
      return result;
    } catch (error) {
      throw new Error('');
    }
  };

  static getMates = async (userId: number, dbConnection: Connection) => {
    try {
      const query = `SELECT requested_user_id AS mate_id 
            FROM mate 
            WHERE status = 'accepted' 
            AND received_user_id = ?

            UNION   

            SELECT received_user_id AS mate_id 
            FROM mate 
            WHERE status = 'accepted' 
            AND requested_user_id = ?
              `;
      const [result] = await dbConnection.execute<RowDataPacket[]>(query, [
        userId,
        userId
      ]);
      return result;
    } catch (error) {
      throw new Error('');
    }
  };

  static verifyMates = async (
    userId: number,
    writerId: number,
    dbConnection: Connection
  ) => {
    try {
      const query = `
            SELECT *
            FROM mate 
            WHERE status = 'accepted' AND
            ((requested_user_id = ? AND received_user_id = ?) OR
            (requested_user_id = ? AND received_user_id = ?))
            `;
      const [result] = await dbConnection.execute<RowDataPacket[]>(query, [
        userId,
        writerId,
        writerId,
        userId
      ]);
      return result;
    } catch (error) {
      throw new Error('');
    }
  };
}

export default DiaryModel;

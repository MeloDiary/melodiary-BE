//일기 관련 DB 쿼리를 처리하는 model
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import dbPool from '../config/dbConfig.js';
import { Connection } from 'mysql2/promise';


class MusicModel {
  static post = async (diaryId:number,{music_url,title,artist}:IPostMusic,dbConnection:Connection): Promise<ResultSetHeader | null> => {
    try {
      const query = `
      INSERT INTO music (diary_id, music_url, title, artist) 
      VALUES (?, ?, ?, ?)
    `;
     const [result] = await dbConnection.execute<ResultSetHeader>(query, [
        diaryId,
        music_url,
        title,
        artist
      ]);

      return result;

    } catch (error) {
      throw new Error('')
    } finally {
    }
  };
}

export default MusicModel;

//일기 관련 DB 쿼리를 처리하는 model
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import dbPool from '../config/dbConfig.js';
import { Connection } from 'mysql2/promise';

class ImageModel {
  static post = async (
    diaryId: number,
    img_url: string,
    img_order: number,
    dbConnection: Connection
  ): Promise<ResultSetHeader | null> => {
    try {
      const query = `INSERT INTO image (diary_id, image_url,image_order) VALUES (?, ?, ?)`;
      const [result] = await dbConnection.execute<ResultSetHeader>(query, [
        diaryId,
        img_url,
        img_order
      ]);

      return result;
    } catch (error) {
      throw new Error('');
    } finally {
      return null;
    }
  };
}

export default ImageModel;

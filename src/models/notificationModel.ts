// notification 관련 DB 쿼리를 처리하는 model
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import dbPool from '../config/dbConfig.js';

class Notification {
  // 사용자 ID를 받아서 읽지 않은 알림 목록을 리턴하는 메서드
  static async getUnreadNotifications(
    userID: number
  ): Promise<RowDataPacket[]> {
    const dbConnection = await dbPool.getConnection();

    try {
      const query = `
        SELECT
          *
        FROM
          notification
        WHERE
          user_id = ?
        AND
          status = ?;
      `;
      const params = [userID, 'unread'];
      const [results] = await dbConnection.execute<RowDataPacket[]>(
        query,
        params
      );

      return results;
    } catch (error) {
      console.error(
        `Error fetching unread notification list: ${userID}`,
        error
      );
      throw new Error('Database query failed');
    } finally {
      dbConnection.release();
    }
  }

  // 사용자 ID를 받아서 읽은 알림 목록을 리턴하는 메서드
  static async getReadNotifications(userID: number): Promise<RowDataPacket[]> {
    const dbConnection = await dbPool.getConnection();

    try {
      const query = `
        SELECT
          *
        FROM
          notification
        WHERE
          user_id = ?
        AND
          status = ?;
      `;
      const params = [userID, 'read'];
      const [results] = await dbConnection.execute<RowDataPacket[]>(
        query,
        params
      );

      return results;
    } catch (error) {
      console.error(`Error fetching read notification list: ${userID}`, error);
      throw new Error('Database query failed');
    } finally {
      dbConnection.release();
    }
  }

  // 사용자 ID와 알림 ID를 받아서 알림을 읽음 상태로 변경하는 메서드
  static async updateNotificationStatus(
    userID: number,
    notificationID: number
  ): Promise<number> {
    const dbConnection = await dbPool.getConnection();

    try {
      const query = `
        UPDATE
          notification
        SET
          status = ?
        WHERE
          user_id = ?
        AND
          id = ?;
      `;
      const params = ['read', userID, notificationID];
      const [results] = await dbConnection.execute<ResultSetHeader>(
        query,
        params
      );

      return results.affectedRows;
    } catch (error) {
      console.error(
        `Error updating notification status: ${notificationID}, ${userID}`,
        error
      );
      throw new Error('Database query failed');
    } finally {
      dbConnection.release();
    }
  }
}

export default Notification;

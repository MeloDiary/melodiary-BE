// mate 관련 DB 쿼리를 처리하는 model
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import dbPool from '../config/dbConfig.js';

class Mate {
  // 사용자 ID를 받아서 친구목록을 리턴하는 메서드
  static async getMateList(userID: number): Promise<RowDataPacket[]> {
    try {
      const query = `
        SELECT
          u.id, u.nickname, u.profile_img_url
        FROM
          user u
        JOIN
          mate m ON (u.id = m.requested_user_id OR u.id = m.received_user_id)
        WHERE
          (m.requested_user_id = ? OR m.received_user_id = ?)
        AND
          u.id != ?
        AND
          m.status = ?;
      `;
      const params = [userID, userID, userID, 'accepted'];
      const [results] = await dbPool.execute<RowDataPacket[]>(query, params);

      return results;
    } catch (error) {
      console.error(`Error fetching mate list: ${userID}`, error);
      throw new Error('Database query failed');
    }
  }

  // 친구 요청을 보내는 사용자 ID와 친구 요청을 받을 사용자 ID를 받아서 이미 친구 상태인지 확인하는 메서드
  static async isMateExists(
    requestedUserID: number,
    receivedUserID: number
  ): Promise<number | null> {
    try {
      const query = `
        SELECT
          *
        FROM
          mate m
        WHERE
          ((m.requested_user_id = ? AND m.received_user_id = ?)
        OR
          (m.requested_user_id = ? AND m.received_user_id = ?))
        AND
          m.status = ?;
      `;
      const params = [
        requestedUserID,
        receivedUserID,
        receivedUserID,
        requestedUserID,
        'accepted'
      ];
      const [results] = await dbPool.execute<RowDataPacket[]>(query, params);

      return results.length ? results[0].id : null;
    } catch (error) {
      console.error(
        `Error fetching mate request: ${requestedUserID}, ${receivedUserID}`,
        error
      );
      throw new Error('Database query failed');
    }
  }

  // 친구 요청을 보낸 사용자 ID와 친구 요청을 받는 사용자 ID를 받아서 mate 테이블에 insert 하는 메서드
  static async createMate(
    requestedUserID: number,
    receivedUserID: number
  ): Promise<number> {
    try {
      const query = `
        INSERT INTO mate (
          requested_user_id,
          received_user_id
        ) VALUES (
          ?,
          ?
        );
      `;
      const params = [requestedUserID, receivedUserID];
      const [results] = await dbPool.execute<ResultSetHeader>(query, params);

      return results.insertId;
    } catch (error) {
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        // 사용자의 ID가 user 테이블에 존재하지 않는 경우
        throw new Error('Not found such user');
      } else if (error.code === 'ER_DUP_ENTRY') {
        // 이미 친구 요청을 보낸 경우
        throw new Error('Already sent the mate request');
      } else {
        console.error(
          `Error creating mate: ${requestedUserID}, ${receivedUserID}`,
          error
        );
        throw new Error('Database insert failed');
      }
    }
  }

  // 사용자 ID와 친구 사용자 ID를 받아서 친구 관계를 삭제하는 메서드
  static async deleteMate(
    requestedUserID: number,
    receivedUserID: number
  ): Promise<number> {
    try {
      const query = `
        DELETE
        FROM
          mate m
        WHERE
          ((m.requested_user_id = ? AND m.received_user_id = ?)
        OR
          (m.requested_user_id = ? AND m.received_user_id = ?))
        AND
          m.status = ?;
      `;
      const params = [
        requestedUserID,
        receivedUserID,
        receivedUserID,
        requestedUserID,
        'accepted'
      ];
      const [results] = await dbPool.execute<ResultSetHeader>(query, params);

      return results.affectedRows;
    } catch (error) {
      console.error(
        `Error deleting mate: ${requestedUserID}, ${receivedUserID}`,
        error
      );
      throw new Error('Database query failed');
    }
  }

  // 사용자 ID를 받아서 받은 친구 요청 목록을 리턴하는 메서드
  static async getReceivedMateRequest(
    userID: number
  ): Promise<RowDataPacket[]> {
    try {
      const query = `
        SELECT
          u.id AS user_id, u.nickname, u.profile_img_url, m.id AS request_id
        FROM
          user u
        JOIN
          mate m ON u.id = m.requested_user_id
        WHERE
          m.received_user_id = ?
        AND
          m.status = ?;
      `;
      const params = [userID, 'pending'];
      const [results] = await dbPool.execute<RowDataPacket[]>(query, params);

      return results;
    } catch (error) {
      console.error(`Error fetching received mate requests: ${userID}`, error);
      throw new Error('Database query failed');
    }
  }

  // 사용자 ID를 받아서 보낸 친구 요청 목록을 리턴하는 메서드
  static async getSentMateRequest(userID: number): Promise<RowDataPacket[]> {
    try {
      const query = `
        SELECT
          u.id AS user_id, u.nickname, u.profile_img_url, m.id AS request_id
        FROM
          user u
        JOIN
          mate m ON u.id = m.received_user_id
        WHERE
          m.requested_user_id = ?
        AND
          m.status = ?;
      `;
      const params = [userID, 'pending'];
      const [results] = await dbPool.execute<RowDataPacket[]>(query, params);

      return results;
    } catch (error) {
      console.error(`Error fetching sent mate requests: ${userID}`, error);
      throw new Error('Database query failed');
    }
  }

  // 사용자 ID와 친구 요청 ID를 받아서 친구 요청을 수락 처리하는 메서드
  static async acceptMate(userID: number, requestID: number): Promise<number> {
    try {
      const query = `
        UPDATE
          mate
        SET
          status = ?
        WHERE
          received_user_id = ?
        AND
          id = ?
        AND
          status = ?;
      `;
      const params = ['accepted', userID, requestID, 'pending'];
      const [results] = await dbPool.execute<ResultSetHeader>(query, params);

      return results.affectedRows;
    } catch (error) {
      console.error(
        `Error accepting mate request: ${requestID}, ${userID}`,
        error
      );
      throw new Error('Database query failed');
    }
  }

  // 사용자 ID와 친구 요청 ID를 받아서 친구 요청을 거절 처리하는 메서드
  static async rejectMate(userID: number, requestID: number): Promise<number> {
    try {
      const query = `
        DELETE
        FROM
          mate
        WHERE
          received_user_id = ?
        AND
          id = ?
        AND
          status = ?;
      `;
      const params = [userID, requestID, 'pending'];
      const [results] = await dbPool.execute<ResultSetHeader>(query, params);

      return results.affectedRows;
    } catch (error) {
      console.error(
        `Error rejecting mate request: ${requestID}, ${userID}`,
        error
      );
      throw new Error('Database query failed');
    }
  }
}

export default Mate;

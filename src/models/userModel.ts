// 사용자 관련 DB 쿼리를 처리하는 model
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import dbPool from '../config/dbConfig.js';

class User {
  // 사용자 ID를 받아서 간략한 사용자 정보를 리턴하는 메서드
  static async getUserById(userId: number): Promise<RowDataPacket | null> {
    try {
      const query = `
        SELECT
          *
        FROM
          user
        WHERE
          id = ?;
      `;
      const params = [userId];
      const [results] = await dbPool.execute<RowDataPacket[]>(query, params);

      return results.length ? results[0] : null;
    } catch (error) {
      console.error(`Error fetching user by ID: ${userId}`, error);
      throw new Error('Database query failed');
    }
  }

  // 사용자 ID를 받아서 마이페이지에서 사용될 사용자 정보를 리턴하는 메서드
  static async getUserInfoById(userId: number): Promise<RowDataPacket | null> {
    try {
      const query = `
        SELECT
          u.*,
          (SELECT COUNT(*) FROM diary WHERE user_id = u.id) AS diary_count,
          (SELECT COUNT(*) FROM mate WHERE (requested_user_id = u.id OR received_user_id = u.id) AND status = ?) AS mate_count
        FROM
          user u
        WHERE
          u.id = ?;
      `;
      const params = ['accepted', userId];
      const [results] = await dbPool.execute<RowDataPacket[]>(query, params);

      return results.length ? results[0] : null;
    } catch (error) {
      console.error(`Error fetching user info by ID: ${userId}`, error);
      throw new Error('Database query failed');
    }
  }

  // 사용자 ID를 받아서 사용자를 삭제하는 메서드
  static async deleteUserById(userId: number): Promise<number | null> {
    try {
      const query = `
          DELETE
          FROM
            user
          WHERE
            id = ?;
        `;
      const params = [userId];
      const [results] = await dbPool.execute<ResultSetHeader>(query, params);

      return results.affectedRows;
    } catch (error) {
      console.error(`Error deleting user by ID: ${userId}`, error);
      throw new Error('Database delete failed');
    }
  }

  // 회원가입할 이메일과 닉네임을 받아서 DB insert하는 메서드
  static async createUser(
    userEmail: string,
    nickname: string
  ): Promise<number | null> {
    try {
      const query = `
        INSERT INTO user (
          email,
          nickname
        ) VALUES (
          ?,
          ?
        );
      `;
      const params = [userEmail, nickname];
      const [results] = await dbPool.execute<ResultSetHeader>(query, params);

      return results.insertId || null;
    } catch (error) {
      console.error(`Error creating user with email: ${userEmail}`, error);
      throw new Error('Database insert failed');
    }
  }

  // 사용자 이메일을 받아서 이미 존재하는 유저인지 확인하는 메서드
  static async isUserExistsByEmail(email: string): Promise<number | null> {
    try {
      const query = `
        SELECT
          *
        FROM
          user
        WHERE
          email = ?;
      `;
      const params = [email];
      const [results] = await dbPool.execute<RowDataPacket[]>(query, params);

      return results.length ? results[0].id : null;
    } catch (error) {
      console.error(`Error checking if user exists by email: ${email}`, error);
      throw new Error('Database query failed');
    }
  }

  // 닉네임을 받아서 이미 존재하는 닉네임인지 확인하는 메서드
  static async isUserExistsByNickname(
    nickname: string
  ): Promise<number | null> {
    try {
      const query = `
        SELECT
          *
        FROM
          user
        WHERE
          nickname = ?;
      `;
      const params = [nickname];
      const [results] = await dbPool.execute<RowDataPacket[]>(query, params);

      return results.length ? results[0].id : null;
    } catch (error) {
      console.error(`Error checking if nickname exists: ${nickname}`, error);
      throw new Error('Database query failed');
    }
  }

  // 사용자 ID를 받아서 가입된 사용자인지 확인하는 메서드
  static async isUserExistsById(userID: number): Promise<number | null> {
    try {
      const query = `
        SELECT
          *
        FROM
          user
        WHERE
          id = ?;
      `;
      const params = [userID];
      const [results] = await dbPool.execute<RowDataPacket[]>(query, params);

      return results.length ? results[0].id : null;
    } catch (error) {
      console.error(`Error checking if user exists by id: ${userID}`, error);
      throw new Error('Database query failed');
    }
  }

  // 사용자 ID, 닉네임을 받아서 해당 사용자의 닉네임을 변경하는 메서드
  static async updateUserNickname(
    userID: number,
    nickname: string
  ): Promise<number> {
    try {
      const query = `
        UPDATE
          user
        SET
          nickname = ? 
        WHERE
          id = ?;
      `;
      const params = [nickname, userID];
      const [results] = await dbPool.execute<ResultSetHeader>(query, params);

      return results.affectedRows;
    } catch (error) {
      console.error(
        `Error updating user nickname: ${userID}, ${nickname}`,
        error
      );
      throw new Error('Database query failed');
    }
  }

  // 사용자 ID, 프로필 사진 URL을 받아서 해당 사용자의 프로필 사진을 변경하는 메서드
  static async updateUserProfileImg(
    userID: number,
    imgURL: string
  ): Promise<number> {
    try {
      const query = `
          UPDATE
            user
          SET
            profile_img_url = ? 
          WHERE
            id = ?;
        `;
      const params = [imgURL, userID];
      const [results] = await dbPool.execute<ResultSetHeader>(query, params);

      return results.affectedRows;
    } catch (error) {
      console.error(
        `Error updating user profile image: ${userID}, ${imgURL}`,
        error
      );
      throw new Error('Database query failed');
    }
  }

  // 사용자 ID, 마이페이지 배경 사진 URL을 받아서 해당 사용자의 프로필 사진을 변경하는 메서드
  static async updateUserBackgroundImg(
    userID: number,
    imgURL: string
  ): Promise<number> {
    try {
      const query = `
            UPDATE
              user
            SET
              profile_background_img_url = ?
            WHERE
              id = ?;
          `;
      const params = [imgURL, userID];
      const [results] = await dbPool.execute<ResultSetHeader>(query, params);

      return results.affectedRows;
    } catch (error) {
      console.error(
        `Error updating user background image: ${userID}, ${imgURL}`,
        error
      );
      throw new Error('Database query failed');
    }
  }
}

export default User;

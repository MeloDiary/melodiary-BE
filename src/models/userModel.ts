// 사용자 관련 DB 쿼리를 처리하는 model
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { IUser } from '../types/user.js';
import dbPool from '../config/dbConfig.js';

class User {
  // 사용자 ID를 받아서 사용자 정보를 리턴하는 메서드
  static async getUserById(userId: number): Promise<IUser | null> {
    try {
      const query = 'SELECT * FROM user WHERE id = ?';
      const params = [userId];
      const [results] = await dbPool.execute<RowDataPacket[]>(query, params);

      return results.length ? (results[0] as IUser) : null;
    } catch (error) {
      console.error(`Error fetching user by ID: ${userId}`, error);
      throw new Error('Database query failed');
    }
  }

  // 회원가입할 이메일과 닉네임을 받아서 DB insert하는 메서드
  static async createUser(
    userEmail: string,
    nickname: string
  ): Promise<number | null> {
    try {
      const query = 'INSERT INTO user (email, nickname) VALUES (?, ?)';
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
      const query = 'SELECT * FROM user WHERE email = ?';
      const params = [email];
      const [results] = await dbPool.execute<RowDataPacket[]>(query, params);

      return results.length ? results[0].id : null;
    } catch (error) {
      console.error(`Error checking if user exists by email: ${email}`, error);
      throw new Error('Database query failed');
    }
  }

  // 닉네임을 받아서 이미 존재하는 닉네임인지 확인하는 메서드
  static async isNicknameExists(nickname: string): Promise<number | null> {
    try {
      const query = 'SELECT * FROM user WHERE nickname = ?';
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
      const query = 'SELECT * FROM user WHERE id = ?';
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
      const query = 'UPDATE user SET nickname = ? WHERE id = ?';
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
}

export default User;

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
  static async isUserExists(email: string): Promise<number | null> {
    try {
      const query = 'SELECT * FROM user WHERE email = ?';
      const params = [email];
      const [results] = await dbPool.execute<RowDataPacket[]>(query, params);

      return results.length ? results[0].id : null;
    } catch (error) {
      console.error(`Error checking if user exists: ${email}`, error);
      throw new Error('Database query failed');
    }
  }
}

export default User;

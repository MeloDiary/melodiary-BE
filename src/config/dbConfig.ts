// 데이터베이스 연결 모듈
import mysql, { PoolOptions } from 'mysql2/promise';

// 데이터베이스 연결 설정
const dbConfig: PoolOptions = {
  host: process.env.DB_HOST, // 로컬 호스트
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined, // 로컬에서 SSH 터널링으로 포워딩한 포트
  user: process.env.DB_USER, // MySQL 사용자 이름
  password: process.env.DB_PASSWORD, // MySQL 사용자 비밀번호
  database: process.env.DB_NAME // 데이터베이스 이름
};

// MySQL 연결 풀 생성
const dbPool = mysql.createPool(dbConfig);

export default dbPool;

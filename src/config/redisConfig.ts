//Redis 연결 모듈
import { createClient } from 'redis';

//Redis 연결 설정
const redisConfig = {
  url: `redis://${process.env.REDIS_ENDPOINT}`,
  password: process.env.REDIS_SECRET
};

//Redis 연결 생성
const redisClient = createClient(redisConfig);

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redisClient.connect().catch(console.error);

export default redisClient;

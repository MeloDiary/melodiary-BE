// 서버 엔트리 포인트
import './src/config/envConfig.js';
import morgan from 'morgan';
import express, { Application, Response } from 'express';
import cors from 'cors';
import apiSpecRouter from './src/routes/apiSpecRoutes.js';
import userRouter from './src/routes/userRoutes.js';
import diariesRouter from './src/routes/diaries.js';

const app: Application = express();
const port = parseInt(process.env.PORT || '4000', 10);

// 개발환경과 배포환경에서 각각 다른 로깅 모듈 사용
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// 요청 body parser
app.use(express.json());

// CORS 설정
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://melodiary.site',
      'https://www.melodiary.site',
      'https://melo-diary.vercel.app'
    ],
    methods: 'GET, POST, PUT, DELETE, OPTIONS',
    credentials: true
  })
);

// Router
app.use('/api-spec', apiSpecRouter);
app.use('/api/users', userRouter);
app.use('/api/diaries', diariesRouter);

app.get('/', (_, res: Response) => {
  res.status(200).json({ message: 'Welcome!' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Port ${port} ready`);
});

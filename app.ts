// 서버 엔트리 포인트
import './src/config/envConfig.js';
import morgan from 'morgan';
import express, { Application, Response } from 'express';
import cors from 'cors';
import apiSpecRouter from './src/routes/apiSpecRoutes.js';
import userRouter from './src/routes/userRoutes.js';

const app: Application = express();

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
    origin: 'http://localhost:3000',
    methods: 'GET, POST, PUT, DELETE',
    credentials: true
  })
);

// Router
app.use('/api-spec', apiSpecRouter);
app.use('/api/users', userRouter);

app.get('/', (_, res: Response) => {
  res.status(200).json({ message: 'Welcome!' });
});

app.listen(4000, '0.0.0.0', () => {
  console.log(`Port 4000 ready`);
});

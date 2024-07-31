import express, { Application, Response } from 'express';
import apiSpecRouter from './routes/apiSpecRoutes.js';

const app: Application = express();

app.use(express.json());
app.use('/api', apiSpecRouter);
app.get('/', (_, res: Response) => {
  res.status(200).json({ message: 'Welcome!' });
});

app.listen(4000, '0.0.0.0', () => {
  console.log(`Port 4000 ready`);
});

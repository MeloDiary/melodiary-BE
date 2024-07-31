import express from 'express';
import apiSpecRouter from './routes/apiSpecRoutes.js';
const app = express();
app.use(express.json());
app.use('/api', apiSpecRouter);
app.get('/', (_, res) => {
    res.status(200).json({ message: 'Welcome!' });
});
app.listen(4000, '0.0.0.0', () => {
    console.log(`Port 4000 ready`);
});

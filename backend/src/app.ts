import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import router from './routes';
import errorHandler from './middleware/error-handler';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000' }));
app.use(express.json({ limit: '1mb' }));

app.use('/api', router);

app.use(errorHandler);

export default app;

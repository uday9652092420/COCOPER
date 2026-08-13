import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

export default app;

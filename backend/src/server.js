import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import customerRoutes from './routes/customers.js';
import { initializeDatabase } from './config/db.js';

dotenv.config({ path: new URL('../.env', import.meta.url) });

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'coconut-cocktail-backend' });
});

app.use('/api/customers', customerRoutes);

initializeDatabase().then(() => {
  app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });
}).catch((error) => {
  console.error('Failed to initialize backend.', error);
  process.exit(1);
});

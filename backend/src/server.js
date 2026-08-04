import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import customerRoutes from './routes/customers.js';
import { initializeDatabase } from './config/db.js';

dotenv.config({ path: new URL('../.env', import.meta.url) });

const app = express();
const preferredPort = Number(process.env.PORT || 4004);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'coconut-cocktail-backend' });
});

app.use('/api/customers', customerRoutes);

const tryListen = (port, attemptsLeft) => {
  const server = app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });

  server.on('error', (error) => {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'EADDRINUSE') {
      if (attemptsLeft > 0) {
        console.warn(`Port ${port} is busy. Trying ${port + 1} instead.`);
        server.close(() => tryListen(port + 1, attemptsLeft - 1));
      } else {
        console.error('No available port found. Please free up a port and try again.');
        process.exit(1);
      }
    } else {
      console.error('Failed to start backend.', error);
      process.exit(1);
    }
  });
};

initializeDatabase().then(() => {
  tryListen(preferredPort, 10);
}).catch((error) => {
  console.error('Failed to initialize backend.', error);
  process.exit(1);
});

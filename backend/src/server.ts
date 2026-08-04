import app from './app.js';
import { initializeDatabase } from './config/db.js';
import { DEFAULT_PORT } from './config/constants.js';

const preferredPort = Number(process.env.PORT || DEFAULT_PORT);

const tryListen = (port: number, attemptsLeft: number) => {
  const server = app.listen(port, () => {
    console.log(`Backend listening on http://localhost:${port}`);
  });

  server.on('error', (error: unknown) => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'EADDRINUSE'
    ) {
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

initializeDatabase()
  .then(() => {
    tryListen(preferredPort, 10);
  })
  .catch((error) => {
    console.error('Failed to initialize backend.', error);
    process.exit(1);
  });

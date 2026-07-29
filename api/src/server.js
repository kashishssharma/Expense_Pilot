/**
 * Server entry point.
 * Initializes database pool connection and starts HTTP server listener.
 */
const config = require('./config');
const Logger = require('./config/logger');
const app = require('./app');
const db = require('./db/pool');

async function startServer() {
  try {
    // Verify database connectivity
    const result = await db.query('SELECT NOW()');
    Logger.info(`PostgreSQL database connected at ${result.rows[0].now}`);

    const server = app.listen(config.port, () => {
      Logger.info(`Express API server running on port ${config.port} [${config.env}]`);
    });

    // Graceful shutdown handling
    const shutdown = (signal) => {
      Logger.warn(`Received ${signal}. Gracefully shutting down HTTP server...`);
      server.close(() => {
        Logger.info('HTTP server closed. Terminating process.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    Logger.error('Failed to start API server', error);
    process.exit(1);
  }
}

startServer();

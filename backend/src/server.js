import app from './app.js';
import logger from './config/logger.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Serveur Autobat démarré sur le port ${PORT}`);
  logger.info(`📦 Environnement: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 API: http://localhost:${PORT}`);
});

const shutdown = async () => {
  logger.info('🛑 Arrêt du serveur...');
  server.close(() => {
    logger.info('✅ Serveur arrêté proprement');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('❌ Force shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;

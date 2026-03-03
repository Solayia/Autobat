import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import logger from './config/logger.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import devisRoutes from './routes/devisRoutes.js';
import catalogueRoutes from './routes/catalogueRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import chantierRoutes from './routes/chantierRoutes.js';
import employeRoutes from './routes/employeRoutes.js';
import stripeRoutes from './routes/stripeRoutes.js';
import factureRoutes from './routes/factureRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import pricingRoutes from './routes/pricingRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import syncBadgeageRoutes from './routes/syncBadgeageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARES
// ═══════════════════════════════════════════════════════════════

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting global
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Trop de requêtes, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Rate limiting stricte pour auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Maximum 50 tentatives de connexion échouées par IP toutes les 15 minutes
  skipSuccessfulRequests: true,
  message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false
});

// Stripe webhook - DOIT être avant les body parsers pour recevoir le body brut
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const { handleWebhook } = await import('./controllers/stripeController.js');
  return handleWebhook(req, res);
});

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging HTTP
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Serve static files (uploads) with CORS
app.use('/uploads', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET']
}), express.static('uploads'));

// ═══════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/devis', devisRoutes);
app.use('/api/catalogue', catalogueRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chantiers', chantierRoutes);
app.use('/api/employes', employeRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/factures', factureRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/super-admin', pricingRoutes);
app.use('/api/super-admin/sales', salesRoutes);
app.use('/api/badgeages', syncBadgeageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════

// 404
app.use(notFound);

// Error handler global
app.use(errorHandler);

// ═══════════════════════════════════════════════════════════════
// SERVER START
// ═══════════════════════════════════════════════════════════════

const server = app.listen(PORT, () => {
  logger.info(`🚀 Serveur Autobat démarré sur le port ${PORT}`);
  logger.info(`📦 Environnement: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 API: http://localhost:${PORT}`);
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('🛑 Arrêt du serveur...');
  server.close(() => {
    logger.info('✅ Serveur arrêté proprement');
    process.exit(0);
  });

  // Force shutdown après 10s
  setTimeout(() => {
    logger.error('❌ Force shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;




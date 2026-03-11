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

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARES
// ═══════════════════════════════════════════════════════════════

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

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Trop de requêtes, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  skipSuccessfulRequests: true,
  message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false
});

// Stripe webhook - DOIT être avant les body parsers
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const { handleWebhook } = await import('./controllers/stripeController.js');
  return handleWebhook(req, res);
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
} else if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
  }));
}

app.use('/uploads', cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET']
}), express.static(process.env.UPLOADS_PATH || 'uploads'));

// ═══════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime(), environment: process.env.NODE_ENV });
});

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

app.use(notFound);
app.use(errorHandler);

export default app;

import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DB_PATH = resolve(__dirname, '../prisma/test.db');

process.env.DATABASE_URL = `file:${DB_PATH}`;
process.env.JWT_SECRET = 'test-jwt-secret-32chars-minimum-ok';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-32chars-min-ok';
process.env.NODE_ENV = 'test';
process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
process.env.FRONTEND_URL = 'http://localhost:5173';

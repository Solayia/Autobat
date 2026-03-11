import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    it('retourne un token avec credentials valides', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin1@test.fr', password: 'Test1234!' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('access_token');
      expect(res.body).toHaveProperty('refresh_token');
      expect(res.body.user.email).toBe('admin1@test.fr');
      expect(res.body.user.role).toBe('COMPANY_ADMIN');
    });

    it('refuse avec mot de passe incorrect', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin1@test.fr', password: 'mauvais_mdp' });

      expect(res.status).toBe(401);
    });

    it('refuse avec email inexistant', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'inexistant@test.fr', password: 'Test1234!' });

      expect(res.status).toBe(401);
    });

    it('refuse sans email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'Test1234!' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('retourne le profil avec token valide', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin1@test.fr', password: 'Test1234!' });

      const token = loginRes.body.access_token;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('admin1@test.fr');
    });

    it('refuse sans token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('refuse avec token invalide', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token_bidon_invalide');
      expect(res.status).toBe(401);
    });
  });
});

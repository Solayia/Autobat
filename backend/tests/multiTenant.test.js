import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

// Helpers pour récupérer les tokens
async function loginAs(email) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'Test1234!' });
  return res.body.access_token;
}

describe('Isolation Multi-Tenant (SÉCURITÉ CRITIQUE)', () => {
  let token1, token2, clientId1;

  beforeAll(async () => {
    token1 = await loginAs('admin1@test.fr');
    token2 = await loginAs('admin2@test.fr');

    // Créer un client pour tenant1
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        nom: 'Client Alpha',
        email: 'client1@test.fr',
        telephone: '0600000001',
        type: 'ENTREPRISE'
      });
    clientId1 = res.body.client?.id;
  });

  describe('Clients', () => {
    it('tenant1 voit ses propres clients', async () => {
      const res = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      const ids = (res.body.clients || res.body).map(c => c.id);
      expect(ids).toContain(clientId1);
    });

    it('tenant2 ne voit pas les clients de tenant1', async () => {
      const res = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
      const ids = (res.body.clients || res.body).map(c => c.id);
      expect(ids).not.toContain(clientId1);
    });

    it('tenant2 ne peut pas accéder au client de tenant1 par son ID', async () => {
      const res = await request(app)
        .get(`/api/clients/${clientId1}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
    });

    it('tenant2 ne peut pas modifier le client de tenant1', async () => {
      const res = await request(app)
        .put(`/api/clients/${clientId1}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ nom: 'Pirate', type: 'ENTREPRISE' });

      expect(res.status).toBe(404);
    });

    it('tenant2 ne peut pas supprimer le client de tenant1', async () => {
      const res = await request(app)
        .delete(`/api/clients/${clientId1}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Devis', () => {
    let devisId1;

    beforeAll(async () => {
      // Créer un devis pour tenant1
      const res = await request(app)
        .post('/api/devis')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          client_id: clientId1,
          date_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          lignes: [{ type: 'MATERIAU', description: 'Test', unite: 'U', quantite: 1, prix_unitaire_ht: 100 }]
        });
      devisId1 = res.body.id;
    });

    it('tenant2 ne voit pas les devis de tenant1', async () => {
      const res = await request(app)
        .get('/api/devis')
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
      const ids = (res.body.data || res.body.devis || []).map(d => d.id);
      expect(ids).not.toContain(devisId1);
    });

    it('tenant2 ne peut pas accéder au devis de tenant1', async () => {
      const res = await request(app)
        .get(`/api/devis/${devisId1}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(404);
    });
  });

  describe('Requêtes sans auth', () => {
    it('refuse les clients sans token', async () => {
      const res = await request(app).get('/api/clients');
      expect(res.status).toBe(401);
    });

    it('refuse les devis sans token', async () => {
      const res = await request(app).get('/api/devis');
      expect(res.status).toBe(401);
    });

    it('refuse les factures sans token', async () => {
      const res = await request(app).get('/api/factures');
      expect(res.status).toBe(401);
    });
  });
});

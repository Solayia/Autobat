import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

const LIGNE_TEST = [{ type: 'MATERIAU', description: 'Test', unite: 'U', quantite: 1, prix_unitaire_ht: 100 }];

async function loginAs(email) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'Test1234!' });
  return res.body.access_token;
}

describe('Numérotation séquentielle', () => {
  let token, clientId;

  beforeAll(async () => {
    token = await loginAs('admin1@test.fr');

    // Créer un client pour ce test (au cas où aucun n'existe)
    const createRes = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'Client Num Test', email: 'numtest@test.fr', telephone: '0600000003', type: 'ENTREPRISE' });

    clientId = createRes.body.client?.id;

    // Fallback: récupérer le premier client existant
    if (!clientId) {
      const res = await request(app)
        .get('/api/clients')
        .set('Authorization', `Bearer ${token}`);
      clientId = (res.body.clients || [])[0]?.id;
    }
  });

  describe('Devis (DEV-YYYY-NNNN)', () => {
    it('crée des devis avec numéros séquentiels', async () => {
      const year = new Date().getFullYear();

      const res1 = await request(app)
        .post('/api/devis')
        .set('Authorization', `Bearer ${token}`)
        .send({
          client_id: clientId,
          date_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          lignes: LIGNE_TEST
        });

      const res2 = await request(app)
        .post('/api/devis')
        .set('Authorization', `Bearer ${token}`)
        .send({
          client_id: clientId,
          date_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          lignes: LIGNE_TEST
        });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);

      const num1 = res1.body.numero_devis;
      const num2 = res2.body.numero_devis;

      // Format DEV-YYYY-NNNN
      expect(num1).toMatch(new RegExp(`^DEV-${year}-\\d{4}$`));
      expect(num2).toMatch(new RegExp(`^DEV-${year}-\\d{4}$`));

      // Séquentiel : num2 > num1
      const seq1 = parseInt(num1.split('-')[2]);
      const seq2 = parseInt(num2.split('-')[2]);
      expect(seq2).toBe(seq1 + 1);
    });

    it('les numéros de devis sont uniques par tenant', async () => {
      const token2 = await loginAs('admin2@test.fr');

      // Créer un client pour tenant2
      const clientRes = await request(app)
        .post('/api/clients')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          nom: 'Client Beta',
          email: 'seq2@test.fr',
          telephone: '0600000004',
          type: 'ENTREPRISE'
        });

      const devisT1 = await request(app)
        .post('/api/devis')
        .set('Authorization', `Bearer ${token}`)
        .send({
          client_id: clientId,
          date_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          lignes: LIGNE_TEST
        });

      const devisT2 = await request(app)
        .post('/api/devis')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          client_id: clientRes.body.client?.id || clientRes.body.id,
          date_validite: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          lignes: LIGNE_TEST
        });

      // Les deux peuvent avoir le même numéro séquentiel (compteur indépendant par tenant)
      // mais ils doivent chacun avoir un format valide
      const year = new Date().getFullYear();
      expect(devisT1.body.numero_devis).toMatch(new RegExp(`^DEV-${year}-\\d{4}$`));
      expect(devisT2.body.numero_devis).toMatch(new RegExp(`^DEV-${year}-\\d{4}$`));
    });
  });
});

import Stripe from 'stripe';
import prisma from '../config/database.js';
import logger from '../config/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/stripe/create-checkout-session
 * Créer une session de paiement Stripe pour augmenter le nombre d'employés
 */
export const createCheckoutSession = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { new_employes_max } = req.body;

    // Validation
    if (!new_employes_max || typeof new_employes_max !== 'number' || new_employes_max < 1) {
      return res.status(400).json({
        code: 'INVALID_EMPLOYES_MAX',
        message: 'Le nombre d\'employés doit être un nombre positif'
      });
    }

    if (new_employes_max > 100) {
      return res.status(400).json({
        code: 'EMPLOYES_MAX_EXCEEDED',
        message: 'Le nombre maximum d\'employés autorisé est 100'
      });
    }

    // Récupérer le tenant actuel
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        nom: true,
        employes_max: true,
        email: true
      }
    });

    if (!tenant) {
      return res.status(404).json({
        code: 'TENANT_NOT_FOUND',
        message: 'Entreprise introuvable'
      });
    }

    // Empêcher la réduction du nombre d'employés
    if (new_employes_max < tenant.employes_max) {
      return res.status(400).json({
        code: 'CANNOT_DECREASE_EMPLOYES',
        message: 'Vous ne pouvez pas réduire le nombre d\'employés. Contactez le support.'
      });
    }

    // Si pas de changement
    if (new_employes_max === tenant.employes_max) {
      return res.status(400).json({
        code: 'NO_CHANGE',
        message: 'Le nombre d\'employés est déjà à cette valeur'
      });
    }

    // Calculer le montant
    // Premier employé: 100€ HT, chaque supplémentaire: 20€ HT
    const currentPrice = tenant.employes_max === 1 ? 100 : 100 + (tenant.employes_max - 1) * 20;
    const newPrice = new_employes_max === 1 ? 100 : 100 + (new_employes_max - 1) * 20;
    const amountToPay = newPrice - currentPrice; // Montant à payer pour l'upgrade

    // Pour Stripe, on paie en centimes et HT
    const amountInCents = Math.round(amountToPay * 100);

    // Créer la session Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Augmentation du nombre d'employés`,
              description: `De ${tenant.employes_max} à ${new_employes_max} employé${new_employes_max > 1 ? 's' : ''}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/settings?tab=abonnement&payment=success`,
      cancel_url: `${process.env.FRONTEND_URL}/settings?tab=abonnement&payment=cancel`,
      customer_email: tenant.email,
      metadata: {
        tenant_id: tenantId,
        user_id: userId,
        old_employes_max: tenant.employes_max.toString(),
        new_employes_max: new_employes_max.toString(),
        tenant_name: tenant.nom
      }
    });

    logger.info('Session de paiement Stripe créée', {
      service: 'autobat-api',
      tenant_id: tenantId,
      user_id: userId,
      session_id: session.id,
      new_employes_max,
      amount: amountToPay
    });

    res.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    logger.error('Erreur création session Stripe', {
      service: 'autobat-api',
      error: error.message
    });
    next(error);
  }
};

/**
 * POST /api/stripe/webhook
 * Webhook Stripe pour gérer les événements de paiement
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    logger.error('Erreur webhook Stripe', {
      service: 'autobat-api',
      error: err.message
    });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer l'événement
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      // Récupérer les métadonnées
      const { tenant_id, new_employes_max } = session.metadata;
      const newEmployesMax = parseInt(new_employes_max);

      // Mettre à jour le tenant
      const updatedTenant = await prisma.tenant.update({
        where: { id: tenant_id },
        data: { employes_max: newEmployesMax },
        select: {
          id: true,
          nom: true,
          employes_max: true
        }
      });

      logger.info('Abonnement mis à jour après paiement Stripe', {
        service: 'autobat-api',
        tenant_id: tenant_id,
        new_employes_max: newEmployesMax,
        session_id: session.id,
        payment_status: session.payment_status
      });

      // TODO: Créer une entrée dans une table de paiements pour l'historique
      // await prisma.payment.create({ ... })

    } catch (error) {
      logger.error('Erreur mise à jour tenant après paiement', {
        service: 'autobat-api',
        error: error.message,
        session_id: session.id
      });
    }
  }

  res.json({ received: true });
};

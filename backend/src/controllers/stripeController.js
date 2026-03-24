import Stripe from 'stripe';
import prisma from '../config/database.js';
import logger from '../config/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/stripe/create-subscription-checkout
 * Créer une session d'abonnement Stripe (essai 7j + CB requise)
 * Appelée juste après l'inscription depuis Register.jsx
 */
export const createSubscriptionCheckout = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, nom: true, email: true }
    });

    if (!tenant) {
      return res.status(404).json({ code: 'TENANT_NOT_FOUND', message: 'Entreprise introuvable' });
    }

    if (!process.env.STRIPE_PRICE_BASE) {
      return res.status(500).json({ code: 'STRIPE_NOT_CONFIGURED', message: 'Stripe non configuré' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_BASE, quantity: 1 }],
      subscription_data: { trial_period_days: 7 },
      customer_email: tenant.email,
      metadata: { tenant_id: tenant.id },
      success_url: `${process.env.FRONTEND_URL}/dashboard?welcome=1`,
      cancel_url: `${process.env.FRONTEND_URL}/register?stripe_cancel=1`,
    });

    logger.info('Session abonnement Stripe créée', {
      service: 'autobat-api',
      tenant_id: tenantId,
      session_id: session.id
    });

    res.json({ url: session.url });

  } catch (error) {
    logger.error('Erreur création session abonnement Stripe', {
      service: 'autobat-api',
      error: error.message
    });
    next(error);
  }
};

/**
 * POST /api/stripe/portal
 * Créer une session Customer Portal Stripe pour gérer l'abonnement
 */
export const createPortalSession = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, stripe_customer_id: true }
    });

    if (!tenant) {
      return res.status(404).json({ code: 'TENANT_NOT_FOUND', message: 'Entreprise introuvable' });
    }

    if (!tenant.stripe_customer_id) {
      return res.status(400).json({
        code: 'NO_STRIPE_CUSTOMER',
        message: 'Aucun abonnement Stripe associé. Veuillez créer un abonnement.'
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/settings?tab=abonnement`,
    });

    logger.info('Session portail Stripe créée', {
      service: 'autobat-api',
      tenant_id: tenantId
    });

    res.json({ url: session.url });

  } catch (error) {
    logger.error('Erreur création session portail Stripe', {
      service: 'autobat-api',
      error: error.message
    });
    next(error);
  }
};

/**
 * POST /api/stripe/upgrade-employees
 * Mettre à jour le nombre d'employés dans l'abonnement Stripe (récurrent)
 */
export const upgradeEmployees = async (req, res, next) => {
  try {
    const tenantId = req.tenantId;
    const { new_employes_max } = req.body;

    if (!new_employes_max || typeof new_employes_max !== 'number' || new_employes_max < 1) {
      return res.status(400).json({ code: 'INVALID_EMPLOYES_MAX', message: "Nombre d'employés invalide" });
    }
    if (new_employes_max > 100) {
      return res.status(400).json({ code: 'EMPLOYES_MAX_EXCEEDED', message: "Maximum 100 employés" });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, employes_max: true, stripe_subscription_id: true }
    });

    if (!tenant) return res.status(404).json({ code: 'TENANT_NOT_FOUND', message: 'Entreprise introuvable' });
    if (new_employes_max < tenant.employes_max) {
      return res.status(400).json({ code: 'CANNOT_DECREASE', message: "Réduction impossible. Contactez le support." });
    }
    if (new_employes_max === tenant.employes_max) {
      return res.status(400).json({ code: 'NO_CHANGE', message: "Déjà à cette valeur" });
    }

    // Mettre à jour l'item de siège dans l'abonnement Stripe
    if (tenant.stripe_subscription_id && process.env.STRIPE_PRICE_SEAT) {
      const subscription = await stripe.subscriptions.retrieve(tenant.stripe_subscription_id, {
        expand: ['items']
      });

      const additionalSeats = Math.max(0, new_employes_max - 1); // -1 pour l'admin
      const seatItem = subscription.items.data.find(item => item.price.id === process.env.STRIPE_PRICE_SEAT);

      if (seatItem) {
        if (additionalSeats === 0) {
          await stripe.subscriptionItems.del(seatItem.id, { proration_behavior: 'create_prorations' });
        } else {
          await stripe.subscriptionItems.update(seatItem.id, {
            quantity: additionalSeats,
            proration_behavior: 'create_prorations'
          });
        }
      } else if (additionalSeats > 0) {
        await stripe.subscriptionItems.create({
          subscription: tenant.stripe_subscription_id,
          price: process.env.STRIPE_PRICE_SEAT,
          quantity: additionalSeats,
          proration_behavior: 'create_prorations'
        });
      }
    }

    // Mettre à jour en DB
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { employes_max: new_employes_max }
    });

    logger.info('Upgrade employés effectué', {
      service: 'autobat-api',
      tenant_id: tenantId,
      old: tenant.employes_max,
      new: new_employes_max
    });

    res.json({ success: true, employes_max: new_employes_max });

  } catch (error) {
    logger.error('Erreur upgrade employés Stripe', { service: 'autobat-api', error: error.message });
    next(error);
  }
};

/**
 * POST /api/stripe/webhook
 * Webhook Stripe pour gérer les événements d'abonnement et de paiement
 */
export const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Erreur webhook Stripe', { service: 'autobat-api', error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {

      // --- Abonnement créé (fin du checkout avec trial) ---
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { tenant_id, new_employes_max } = session.metadata || {};

        if (session.mode === 'subscription' && tenant_id) {
          // Récupérer le customer_id depuis la session
          const customerId = session.customer;
          const subscriptionId = session.subscription;

          // Récupérer la date de fin de trial depuis la subscription
          let trialEndsAt = null;
          if (subscriptionId) {
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            if (subscription.trial_end) {
              trialEndsAt = new Date(subscription.trial_end * 1000);
            }
          }

          await prisma.tenant.update({
            where: { id: tenant_id },
            data: {
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              statut: 'TRIAL',
              trial_ends_at: trialEndsAt,
            }
          });

          logger.info('Abonnement Stripe créé — statut TRIAL', {
            service: 'autobat-api',
            tenant_id,
            customer_id: customerId,
            subscription_id: subscriptionId,
            trial_ends_at: trialEndsAt
          });

        }
        break;
      }

      // --- Paiement réussi (après la fin du trial ou renouvellement mensuel) ---
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        // Ne traiter que les invoices liées à un abonnement (pas les one-time)
        if (!invoice.subscription) break;
        // Ignorer les factures à 0€ (générées lors de la création du trial)
        if (invoice.amount_paid === 0) break;

        // Retrouver le tenant par stripe_customer_id, avec fallback sur stripe_subscription_id
        let tenant = await prisma.tenant.findFirst({
          where: { stripe_customer_id: invoice.customer }
        });
        if (!tenant && invoice.subscription) {
          tenant = await prisma.tenant.findFirst({
            where: { stripe_subscription_id: invoice.subscription }
          });
        }
        if (!tenant) break;
        if (tenant.is_demo) break; // Compte démo — jamais modifié par Stripe

        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { statut: 'ACTIF', trial_ends_at: null }
        });

        logger.info('Paiement réussi — statut ACTIF', {
          service: 'autobat-api',
          tenant_id: tenant.id,
          invoice_id: invoice.id
        });
        break;
      }

      // --- Paiement échoué ---
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (!invoice.subscription) break;

        const tenant = await prisma.tenant.findFirst({
          where: { stripe_customer_id: invoice.customer }
        });
        if (!tenant) break;
        if (tenant.is_demo) break; // Compte démo — jamais modifié par Stripe

        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { statut: 'SUSPENDU' }
        });

        logger.warn('Paiement échoué — statut SUSPENDU', {
          service: 'autobat-api',
          tenant_id: tenant.id,
          invoice_id: invoice.id
        });
        break;
      }

      // --- Abonnement résilié ---
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        const tenant = await prisma.tenant.findFirst({
          where: { stripe_subscription_id: subscription.id }
        });
        if (!tenant) break;
        if (tenant.is_demo) break; // Compte démo — jamais modifié par Stripe

        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { statut: 'RESILIE', stripe_subscription_id: null }
        });

        logger.info('Abonnement résilié — statut RESILIE', {
          service: 'autobat-api',
          tenant_id: tenant.id,
          subscription_id: subscription.id
        });
        break;
      }

      // --- Abonnement mis à jour (ex: sortie de trial, résiliation, paiement ok/échoué) ---
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const tenant = await prisma.tenant.findFirst({
          where: { stripe_subscription_id: subscription.id }
        });
        if (!tenant) break;
        if (tenant.is_demo) break; // Compte démo — jamais modifié par Stripe

        // Résiliation programmée → on marque RESILIE immédiatement
        if (subscription.cancel_at_period_end === true) {
          const reason = subscription.cancellation_details?.feedback || subscription.cancellation_details?.reason || null;
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { statut: 'RESILIE' }
          });
          logger.warn('Résiliation programmée — statut RESILIE', {
            service: 'autobat-api',
            tenant_id: tenant.id,
            reason,
            cancel_at: subscription.cancel_at
          });
        } else if (subscription.status === 'active') {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { statut: 'ACTIF', trial_ends_at: null }
          });
          logger.info('Abonnement actif — statut ACTIF', {
            service: 'autobat-api',
            tenant_id: tenant.id
          });
        } else if (subscription.status === 'past_due') {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: { statut: 'SUSPENDU' }
          });
          logger.warn('Abonnement en retard de paiement — statut SUSPENDU', {
            service: 'autobat-api',
            tenant_id: tenant.id
          });
        } else {
          logger.info('Abonnement mis à jour', {
            service: 'autobat-api',
            tenant_id: tenant.id,
            status: subscription.status
          });
        }
        break;
      }

      default:
        logger.info(`Webhook Stripe ignoré: ${event.type}`, { service: 'autobat-api' });
    }
  } catch (error) {
    logger.error('Erreur traitement webhook Stripe', {
      service: 'autobat-api',
      error: error.message,
      event_type: event.type
    });
    // Ne pas renvoyer d'erreur à Stripe pour éviter les retries
  }

  res.json({ received: true });
};

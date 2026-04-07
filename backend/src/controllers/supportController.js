import prisma from '../config/database.js';
import logger from '../config/logger.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Upload attachments ───────────────────────────────────────────────────────

const uploadsDir = process.env.UPLOADS_PATH
  ? path.join(process.env.UPLOADS_PATH, 'support')
  : path.join(__dirname, '..', '..', 'uploads', 'support');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  }
});

export const uploadMiddleware = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|pdf)$/i;
    cb(null, allowed.test(file.originalname));
  }
}).array('attachments', 5);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const sendSupportEmail = async (ticket, user) => {
  const supportEmail = process.env.SUPPORT_NOTIFICATION_EMAIL;
  if (!supportEmail) return;

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpHost || !smtpUser || !smtpPass) return;

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: smtpUser, pass: smtpPass }
    });

    const typeLabel = { BUG: '🐛 Bug', FEEDBACK: '💬 Feedback', QUESTION: '❓ Question' }[ticket.type] || ticket.type;
    const prioriteLabel = { HIGH: '🔴 Haute', MEDIUM: '🟡 Moyenne', LOW: '🟢 Basse' }[ticket.priorite] || ticket.priorite;

    await transporter.sendMail({
      from: `"Auto Bat Man" <${smtpUser}>`,
      to: supportEmail,
      subject: `[${typeLabel}] ${ticket.titre}`,
      html: `
        <h2>Nouveau ticket Auto Bat Man</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;font-weight:bold">Type</td><td style="padding:8px">${typeLabel}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Priorité</td><td style="padding:8px">${prioriteLabel}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Utilisateur</td><td style="padding:8px">${user.prenom} ${user.nom} (${user.email})</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Page</td><td style="padding:8px">${ticket.page_url || '-'}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Contexte</td><td style="padding:8px">${ticket.entity_name || '-'}</td></tr>
        </table>
        <h3>Message</h3>
        <p style="white-space:pre-wrap">${ticket.message}</p>
        ${ticket.screenshot_url ? `<h3>Screenshot</h3><img src="${process.env.API_BASE_URL || ''}${ticket.screenshot_url}" style="max-width:600px" />` : ''}
      `
    });
  } catch (err) {
    logger.error('[Support] Erreur envoi email notification:', err.message);
  }
};

// ─── Controllers ─────────────────────────────────────────────────────────────

/**
 * POST /api/support/tickets
 * Créer un ticket (bug, feedback, question)
 */
export const createTicket = async (req, res) => {
  try {
    const { type, titre, message, page_url, entity_name, priorite, screenshot_data } = req.body;
    const tenantId = req.tenantId;
    const userId = req.userId;

    if (!type || !titre || !message) {
      return res.status(400).json({ error: 'type, titre et message sont requis' });
    }

    // Sauvegarder le screenshot (base64 → fichier)
    let screenshotUrl = null;
    if (screenshot_data) {
      const base64 = screenshot_data.replace(/^data:image\/\w+;base64,/, '');
      const filename = `screenshot-${Date.now()}.png`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, Buffer.from(base64, 'base64'));
      screenshotUrl = `/api/uploads/support/${filename}`;
    }

    // Pièces jointes uploadées via multer
    const attachmentUrls = (req.files || []).map(f => `/api/uploads/support/${f.filename}`);

    const ticket = await prisma.supportTicket.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        type,
        titre,
        message,
        page_url: page_url || null,
        entity_name: entity_name || null,
        screenshot_url: screenshotUrl,
        attachments: attachmentUrls.length ? JSON.stringify(attachmentUrls) : null,
        priorite: priorite || 'MEDIUM'
      },
      include: { user: { select: { prenom: true, nom: true, email: true } } }
    });

    // Notification email asynchrone (ne bloque pas la réponse)
    sendSupportEmail(ticket, ticket.user).catch(() => {});

    res.status(201).json(ticket);
  } catch (error) {
    logger.error('[Support] createTicket:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * GET /api/support/faq
 * Liste des items FAQ actifs
 */
export const getFaq = async (req, res) => {
  try {
    const items = await prisma.faqItem.findMany({
      where: { actif: true },
      orderBy: [{ categorie: 'asc' }, { ordre: 'asc' }]
    });

    res.json(items);
  } catch (error) {
    logger.error('[Support] getFaq:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ─── Super Admin ──────────────────────────────────────────────────────────────

/**
 * GET /api/super-admin/support/tickets
 */
export const getAllTickets = async (req, res) => {
  try {
    const { statut, type, page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      ...(statut && { statut }),
      ...(type && { type })
    };

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { prenom: true, nom: true, email: true, tenant_id: true } }
        }
      }),
      prisma.supportTicket.count({ where })
    ]);

    res.json({ tickets, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    logger.error('[Support] getAllTickets:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * PATCH /api/super-admin/support/tickets/:id
 */
export const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, priorite, admin_notes } = req.body;

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...(statut && { statut }),
        ...(priorite && { priorite }),
        ...(admin_notes !== undefined && { admin_notes })
      }
    });

    res.json(ticket);
  } catch (error) {
    logger.error('[Support] updateTicket:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

import prisma from '../config/database.js';

/**
 * GET /api/chantiers/:chantierId/messages
 */
export const getMessages = async (req, res) => {
  try {
    const { chantierId } = req.params;
    const tenantId = req.tenantId;

    const chantier = await prisma.chantier.findFirst({
      where: { id: chantierId, tenant_id: tenantId }
    });
    if (!chantier) return res.status(404).json({ message: 'Chantier introuvable' });

    const messages = await prisma.chantierMessage.findMany({
      where: { chantier_id: chantierId, tenant_id: tenantId },
      orderBy: { created_at: 'asc' },
      include: {
        user: {
          select: { id: true, prenom: true, nom: true, avatar_url: true, role: true }
        }
      }
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * POST /api/chantiers/:chantierId/messages
 */
export const createMessage = async (req, res) => {
  try {
    const { chantierId } = req.params;
    const tenantId = req.tenantId;
    const userId = req.userId;
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: 'Le message ne peut pas être vide' });
    }

    const chantier = await prisma.chantier.findFirst({
      where: { id: chantierId, tenant_id: tenantId }
    });
    if (!chantier) return res.status(404).json({ message: 'Chantier introuvable' });

    const newMessage = await prisma.chantierMessage.create({
      data: {
        tenant_id: tenantId,
        chantier_id: chantierId,
        user_id: userId,
        message: message.trim()
      },
      include: {
        user: {
          select: { id: true, prenom: true, nom: true, avatar_url: true, role: true }
        }
      }
    });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * DELETE /api/chantiers/:chantierId/messages/:messageId
 * Seul l'auteur ou un admin peut supprimer
 */
export const deleteMessage = async (req, res) => {
  try {
    const { chantierId, messageId } = req.params;
    const tenantId = req.tenantId;
    const userId = req.userId;
    const userRole = req.userRole;

    const msg = await prisma.chantierMessage.findFirst({
      where: { id: messageId, chantier_id: chantierId, tenant_id: tenantId }
    });
    if (!msg) return res.status(404).json({ message: 'Message introuvable' });

    const isOwner = msg.user_id === userId;
    const isAdmin = ['MANAGER', 'COMPANY_ADMIN'].includes(userRole);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await prisma.chantierMessage.delete({ where: { id: messageId } });
    res.json({ message: 'Message supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

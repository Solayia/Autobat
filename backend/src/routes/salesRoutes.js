import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getSalesStats,
  getLeads,
  createLead,
  updateLead,
  deleteLead,
  updateObjectifMrr
} from '../controllers/salesController.js';

const router = Router();

router.use(authenticate);
router.use(authorize(['SUPER_ADMIN']));

// Stats pipeline
router.get('/stats', getSalesStats);
router.patch('/objectif', updateObjectifMrr);

// Leads
router.get('/leads', getLeads);
router.post('/leads', createLead);
router.patch('/leads/:id', updateLead);
router.delete('/leads/:id', deleteLead);

export default router;

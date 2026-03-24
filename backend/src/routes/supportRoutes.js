import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createTicket,
  getFaq,
  uploadMiddleware
} from '../controllers/supportController.js';
import {
  getFeatureRequests,
  createFeatureRequest,
  toggleVote
} from '../controllers/featureRequestController.js';

const router = express.Router();

router.use(authenticate);

// FAQ
router.get('/faq', getFaq);

// Tickets
router.post('/tickets', uploadMiddleware, createTicket);

// Feature requests
router.get('/features', getFeatureRequests);
router.post('/features', createFeatureRequest);
router.post('/features/:id/vote', toggleVote);

export default router;

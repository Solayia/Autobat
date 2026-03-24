import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getStats, getTenants, getTenantById,
  updateTenantStatut, toggleDemo, deleteTenant, impersonateTenant,
  getLogs, clearLogs, searchUsers, runTests
} from '../controllers/superAdminController.js';
import { getAllTickets, updateTicket } from '../controllers/supportController.js';
import {
  getAllFeatureRequests, updateFeatureStatus,
  getAllFaq, createFaqItem, updateFaqItem, deleteFaqItem
} from '../controllers/featureRequestController.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(['SUPER_ADMIN']));

// Stats & pilotage
router.get('/stats', getStats);

// Tenants
router.get('/tenants', getTenants);
router.get('/tenants/:id', getTenantById);
router.patch('/tenants/:id/statut', updateTenantStatut);
router.patch('/tenants/:id/demo', toggleDemo);
router.delete('/tenants/:id', deleteTenant);
router.post('/tenants/:id/impersonate', impersonateTenant);

// Logs
router.get('/logs', getLogs);
router.delete('/logs', clearLogs);

// Users
router.get('/users', searchUsers);

// Tests
router.post('/run-tests', runTests);

// Support - Tickets
router.get('/support/tickets', getAllTickets);
router.patch('/support/tickets/:id', updateTicket);

// Support - Feature Requests
router.get('/support/features', getAllFeatureRequests);
router.patch('/support/features/:id', updateFeatureStatus);

// Support - FAQ
router.get('/support/faq', getAllFaq);
router.post('/support/faq', createFaqItem);
router.patch('/support/faq/:id', updateFaqItem);
router.delete('/support/faq/:id', deleteFaqItem);

export default router;

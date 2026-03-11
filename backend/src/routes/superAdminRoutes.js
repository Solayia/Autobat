import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import {
  getStats, getTenants, getTenantById,
  updateTenantStatut, deleteTenant, impersonateTenant,
  getLogs, clearLogs, searchUsers, runTests
} from '../controllers/superAdminController.js';

const router = express.Router();

router.use(authenticate);
router.use(authorize(['SUPER_ADMIN']));

// Stats & pilotage
router.get('/stats', getStats);

// Tenants
router.get('/tenants', getTenants);
router.get('/tenants/:id', getTenantById);
router.patch('/tenants/:id/statut', updateTenantStatut);
router.delete('/tenants/:id', deleteTenant);
router.post('/tenants/:id/impersonate', impersonateTenant);

// Logs
router.get('/logs', getLogs);
router.delete('/logs', clearLogs);

// Users
router.get('/users', searchUsers);

// Tests
router.post('/run-tests', runTests);

export default router;

import { Router } from 'express';
import productionController from '../controllers/production.controller';
import { requireRole } from '../middleware/auth';
import { ROLES } from '../constants/roles.constants';

const router = Router();

router.get('/', productionController.getGroups);

// Stacked on top of the router-level guard (which also admits kitchen):
// these two are admin/super_admin only.
router.get(
  '/weekly-counts',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  productionController.getWeeklyCounts,
);
router.get('/day', requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), productionController.getDayClients);

export default router;

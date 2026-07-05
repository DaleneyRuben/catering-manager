import { Router } from 'express';
import reportController from '../controllers/report.controller';
import { requireRole } from '../middleware/auth';
import { ROLES } from '../constants/roles.constants';

const router = Router();

router.get('/active-clients/download', reportController.downloadActiveClients);
router.get('/menu-card/download', reportController.exportMenu);
router.get(
  '/kitchen-report/download',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  reportController.exportKitchenReport,
);

export default router;

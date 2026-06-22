import { Router } from 'express';
import authRoutes from './auth.routes';
import clientRoutes from './client.routes';
import menuRoutes from './menu.routes';
import planRoutes from './plan.routes';
import reportRoutes from './report.routes';
import subscriptionRoutes from './subscription.routes';
import userRoutes from './user.routes';
import healthController from '../controllers/health.controller';
import { requireAuth, requireRole } from '../middleware/auth';
import { ROLES } from '../constants/roles';

const router = Router();

router.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

router.get(
  '/health/status',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  healthController.getStatus,
);

router.use('/auth', authRoutes);

router.use('/clients', requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), clientRoutes);
router.use(
  '/menus',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.KITCHEN),
  menuRoutes,
);
router.use(
  '/clients/:clientId/subscriptions',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  subscriptionRoutes,
);
router.use('/plans', requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), planRoutes);
router.use(
  '/reports',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.KITCHEN),
  reportRoutes,
);
router.use('/users', requireAuth, requireRole(ROLES.SUPER_ADMIN), userRoutes);

export default router;

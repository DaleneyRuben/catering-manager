import { Router } from 'express';
import authRoutes from './auth.routes';
import clientRoutes from './client.routes';
import dashboardRoutes from './dashboard.routes';
import deliveryRoutes from './delivery.routes';
import healthRoutes from './health.routes';
import menuRoutes from './menu.routes';
import planRoutes from './plan.routes';
import productionRoutes from './production.routes';
import reportRoutes from './report.routes';
import subscriptionRoutes from './subscription.routes';
import userRoutes from './user.routes';
import { requireAuth, requireRole } from '../middleware/auth';
import { ROLES } from '../constants/roles';

const router = Router();

router.use('/health', requireAuth, requireRole(ROLES.SUPER_ADMIN), healthRoutes);

router.use('/auth', authRoutes);

router.use('/clients', requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), clientRoutes);
router.use('/dashboard', requireAuth, requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), dashboardRoutes);
router.use(
  '/delivery',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DELIVERY),
  deliveryRoutes,
);
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
  '/production',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.KITCHEN),
  productionRoutes,
);
router.use(
  '/reports',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.KITCHEN),
  reportRoutes,
);
router.use('/users', requireAuth, requireRole(ROLES.SUPER_ADMIN), userRoutes);

export default router;

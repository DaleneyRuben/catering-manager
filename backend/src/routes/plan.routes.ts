import { Router } from 'express';
import planController from '../controllers/plan.controller';
import validate from '../middleware/validate';
import { requireRole } from '../middleware/auth';
import { ROLES } from '../constants/roles.constants';
import { createPlanSchema, updatePlanSchema } from '../schemas/plan.schema';

const router = Router();

// Stacked on top of the router-level guard (admin, super_admin, nutritionist):
// nutritionist only needs the plan list and client counts to build a subscription
// in the Agregar cliente wizard; everything else stays admin/super_admin only.
router.get('/', planController.getAll);
router.get('/client-counts', planController.getClientCounts);
router.get('/:id', requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), planController.getById);
router.post(
  '/',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(createPlanSchema),
  planController.create,
);
router.patch(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(updatePlanSchema),
  planController.update,
);
router.delete('/:id', requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), planController.remove);

export default router;

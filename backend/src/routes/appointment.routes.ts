import { Router } from 'express';
import appointmentController from '../controllers/appointment.controller';
import validate from '../middleware/validate';
import { requireRole } from '../middleware/auth';
import { ROLES } from '../constants/roles.constants';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  convertAppointmentSchema,
} from '../schemas/appointment.schema';

const router = Router();

// Stacked on top of the router-level guard (admin, super_admin, nutritionist):
// creating, editing, cancelling, and listing pending citas is admin/super_admin only.
router.post(
  '/',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(createAppointmentSchema),
  appointmentController.create,
);
router.get(
  '/pending',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  appointmentController.getPending,
);
router.patch(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  validate(updateAppointmentSchema),
  appointmentController.update,
);
router.delete('/:id', requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN), appointmentController.remove);

// Nutritionist-only: her conversion queue and the convert action itself.
router.get(
  '/nutritionist',
  requireRole(ROLES.NUTRITIONIST),
  appointmentController.getForNutritionist,
);
router.post(
  '/:id/convert',
  requireRole(ROLES.NUTRITIONIST),
  validate(convertAppointmentSchema),
  appointmentController.convert,
);

export default router;

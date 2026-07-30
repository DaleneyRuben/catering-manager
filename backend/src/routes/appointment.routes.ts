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
import { createSubscriptionSchema } from '../schemas/subscription.schema';

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

// Nutritionist-only: her conversion queue, the convert/resolve-renewal actions, and
// reading a single appointment to render the existing-client renewal view.
router.get(
  '/nutritionist/pending',
  requireRole(ROLES.NUTRITIONIST),
  appointmentController.getPendingForNutritionist,
);
router.get(
  '/nutritionist/history',
  requireRole(ROLES.NUTRITIONIST),
  appointmentController.getHistoryForNutritionist,
);
router.get(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.NUTRITIONIST),
  appointmentController.getById,
);
router.post(
  '/:id/convert',
  requireRole(ROLES.NUTRITIONIST),
  validate(convertAppointmentSchema),
  appointmentController.convert,
);
// Atomically creates the subscription and stamps the appointment in one request/transaction —
// replaces the old client-side create-then-PATCH sequence that could partially fail.
router.post(
  '/:id/resolve-renewal',
  requireRole(ROLES.NUTRITIONIST),
  validate(createSubscriptionSchema),
  appointmentController.resolveRenewal,
);

export default router;

import { Router } from 'express';
import clientController from '../controllers/client.controller';
import historyController from '../controllers/history.controller';
import { requireRole } from '../middleware/auth';
import validate from '../middleware/validate';
import { createClientSchema, updateClientSchema, setGroupSchema } from '../schemas/client.schema';
import { ROLES } from '../constants/roles.constants';

const router = Router();

const adminOnly = requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN);

router.get('/', adminOnly, clientController.getAll);
router.get('/search', adminOnly, clientController.search);
// nutritionist needs this to render the existing-client appointment summary view
router.get(
  '/:id',
  requireRole(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.NUTRITIONIST),
  clientController.getById,
);
router.get('/:id/history', adminOnly, historyController.getByClient);
router.post('/', adminOnly, validate(createClientSchema), clientController.create);
router.patch('/:id', adminOnly, validate(updateClientSchema), clientController.update);
router.post('/:id/finalize', adminOnly, clientController.finalize);
router.put('/:id/group', adminOnly, validate(setGroupSchema), clientController.setGroup);
router.delete('/:id', adminOnly, clientController.remove);

export default router;

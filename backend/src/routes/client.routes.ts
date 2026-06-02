import { Router } from 'express';
import clientController from '../controllers/client.controller';
import historyController from '../controllers/history.controller';
import validate from '../middleware/validate';
import { createClientSchema, updateClientSchema } from '../schemas/client.schema';

const router = Router();

router.get('/', clientController.getAll);
router.get('/counts', clientController.getCounts);
router.get('/:id', clientController.getById);
router.get('/:id/history', historyController.getByClient);
router.post('/', validate(createClientSchema), clientController.create);
router.patch('/:id', validate(updateClientSchema), clientController.update);
router.post('/:id/finalize', clientController.finalize);

export default router;

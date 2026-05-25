import { Router } from 'express';
import clientController from '../controllers/client.controller';
import validate from '../middleware/validate';
import { createClientSchema, updateClientSchema } from '../schemas/client.schema';

const router = Router();

router.get('/', clientController.getAll);
router.get('/:id', clientController.getById);
router.post('/', validate(createClientSchema), clientController.create);
router.patch('/:id', validate(updateClientSchema), clientController.update);

export default router;

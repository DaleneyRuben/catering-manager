import { Router } from 'express';
import clientController from '../controllers/client.controller';
import validate from '../middleware/validate';
import { createClientSchema } from '../schemas/client.schema';

const router = Router();

router.post('/', validate(createClientSchema), clientController.create);

export default router;

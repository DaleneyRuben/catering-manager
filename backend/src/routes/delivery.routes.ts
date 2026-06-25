import { Router } from 'express';
import deliveryController from '../controllers/delivery.controller';

const router = Router();

router.get('/', deliveryController.getRoute);

export default router;

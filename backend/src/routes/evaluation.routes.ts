import { Router } from 'express';
import evaluationController from '../controllers/evaluation.controller';

const router = Router();

router.get('/pending-payment', evaluationController.getPendingPayment);
router.post('/:id/mark-paid', evaluationController.markPaid);
router.delete('/:id', evaluationController.remove);

export default router;

import { Router } from 'express';
import financeController from '../controllers/finance.controller';
import validate from '../middleware/validate';
import { createExpenseSchema, updateExpenseSchema } from '../schemas/finance.schema';

const router = Router();

router.get('/', financeController.getOverview);
router.get('/categories', financeController.getCategories);

// There is no POST for income: a payment is only ever born from marking a subscription paid
// (ADR-008). The asymmetry with expenses is deliberate, not an omission.
router.post('/expenses', validate(createExpenseSchema), financeController.createExpense);
router.patch('/expenses/:id', validate(updateExpenseSchema), financeController.updateExpense);
router.delete('/expenses/:id', financeController.removeExpense);

export default router;

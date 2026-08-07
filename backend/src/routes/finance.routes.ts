import { Router } from 'express';
import financeController from '../controllers/finance.controller';
import validate from '../middleware/validate';
import {
  createCategorySchema,
  createExpenseSchema,
  updateCategorySchema,
  updateExpenseSchema,
} from '../schemas/finance.schema';

const router = Router();

router.get('/', financeController.getOverview);
router.get('/categories', financeController.getCategories);

// There is no DELETE for a category: expenses already filed against one must keep naming it, so
// the only way out is archiving it through PATCH (backlog 3.8, and deactivateCategory's comment).
router.post('/categories', validate(createCategorySchema), financeController.createCategory);
router.patch('/categories/:id', validate(updateCategorySchema), financeController.updateCategory);

// There is no POST for income: a payment is only ever born from marking a subscription paid
// (ADR-008). The asymmetry with expenses is deliberate, not an omission.
router.post('/expenses', validate(createExpenseSchema), financeController.createExpense);
router.patch('/expenses/:id', validate(updateExpenseSchema), financeController.updateExpense);
router.delete('/expenses/:id', financeController.removeExpense);

export default router;

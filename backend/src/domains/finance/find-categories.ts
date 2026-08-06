import ExpenseCategory from '../../models/ExpenseCategory';

type CategoryFilter = {
  includeInactive?: boolean;
};

export const findCategories = ({ includeInactive = false }: CategoryFilter = {}) =>
  ExpenseCategory.findAll({
    ...(includeInactive ? {} : { where: { active: true } }),
    order: [['name', 'ASC']],
  });

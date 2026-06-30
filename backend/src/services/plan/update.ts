import Plan from '../../models/Plan';
import { UpdatePlanDto } from '../../schemas/plan.schema';

export const update = async (id: number, data: UpdatePlanDto) => {
  const plan = await Plan.findByPk(id);
  if (!plan) return null;
  return plan.update(data);
};

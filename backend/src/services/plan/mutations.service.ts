import Plan from '../../models/Plan';
import { CreatePlanDto, UpdatePlanDto } from '../../schemas/plan.schema';

const create = (data: CreatePlanDto) => Plan.create(data as never);

const update = async (id: number, data: UpdatePlanDto) => {
  const plan = await Plan.findByPk(id);
  if (!plan) return null;
  return plan.update(data);
};

const remove = async (id: number): Promise<boolean> => {
  const plan = await Plan.findByPk(id);
  if (!plan) return false;
  await plan.destroy();
  return true;
};

export default { create, update, remove };

import Plan from '../../models/Plan';

export const remove = async (id: number): Promise<boolean> => {
  const plan = await Plan.findByPk(id);
  if (!plan) return false;
  await plan.destroy();
  return true;
};

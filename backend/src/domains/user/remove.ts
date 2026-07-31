import User from '../../models/User';

export const remove = async (id: number): Promise<boolean> => {
  const user = await User.findByPk(id);
  if (!user) return false;
  await user.destroy();
  return true;
};

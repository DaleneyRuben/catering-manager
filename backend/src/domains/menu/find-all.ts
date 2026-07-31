import { Op } from 'sequelize';
import Menu from '../../models/Menu';
import { getCurrentMenuWeek } from '../../utils/date';

export const findAll = (): Promise<Menu[]> => {
  const { start, end } = getCurrentMenuWeek();
  return Menu.findAll({
    where: { date: { [Op.between]: [start, end] } },
    order: [['date', 'ASC']],
  });
};

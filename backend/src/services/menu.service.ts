import { Op } from 'sequelize';
import Menu from '../models/Menu';
import { UpsertMenuDto } from '../schemas/menu.schema';
import { getCurrentMenuWeek } from '../utils/date';

const pruneOutsideWeek = async (): Promise<void> => {
  const { start, end } = getCurrentMenuWeek();
  await Menu.destroy({ where: { date: { [Op.notBetween]: [start, end] } } });
};

const upsert = async (date: string, data: Omit<UpsertMenuDto, 'date'>): Promise<Menu> => {
  const existing = await Menu.findOne({ where: { date } });

  let menu: Menu;
  if (existing) {
    menu = await existing.update(data);
  } else {
    menu = await Menu.create({ date, ...data } as never);
  }

  await pruneOutsideWeek();

  return menu;
};

const findByDate = (date: string): Promise<Menu | null> => Menu.findOne({ where: { date } });

const findAll = (): Promise<Menu[]> => {
  const { start, end } = getCurrentMenuWeek();
  return Menu.findAll({
    where: { date: { [Op.between]: [start, end] } },
    order: [['date', 'ASC']],
  });
};

export default { upsert, findByDate, findAll };

import Menu from '../models/Menu';
import { UpsertMenuDto } from '../schemas/menu.schema';

const MAX_STORED = 3;

const prune = async (): Promise<void> => {
  const all = await Menu.findAll({ order: [['date', 'DESC']] });
  const toDelete = all.slice(MAX_STORED);
  await Promise.all(toDelete.map((m) => m.destroy()));
};

const upsert = async (date: string, data: Omit<UpsertMenuDto, 'date'>): Promise<Menu> => {
  const existing = await Menu.findOne({ where: { date } });

  let menu: Menu;
  if (existing) {
    menu = await existing.update(data);
  } else {
    menu = await Menu.create({ date, ...data } as never);
  }

  await prune();

  return menu;
};

const findByDate = (date: string): Promise<Menu | null> => Menu.findOne({ where: { date } });

const findAll = (): Promise<Menu[]> => Menu.findAll({ order: [['date', 'DESC']] });

export default { upsert, findByDate, findAll };

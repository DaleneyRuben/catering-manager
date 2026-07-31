import Menu from '../../models/Menu';

export const findByDate = (date: string): Promise<Menu | null> => Menu.findOne({ where: { date } });

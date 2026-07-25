import { Op } from 'sequelize';
import Client from '../../models/Client';

export const search = (query: string) =>
  Client.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.iLike]: `%${query}%` } },
        { phoneNumber: { [Op.iLike]: `%${query}%` } },
      ],
    },
    attributes: ['id', 'name', 'phoneNumber'],
    order: [['name', 'ASC']],
    limit: 10,
  });

import { Op } from 'sequelize';
import Client from '../../models/Client';
import { escapeLikePattern } from '../../utils/search';

export const search = (query: string) => {
  const pattern = `%${escapeLikePattern(query)}%`;
  return Client.findAll({
    where: {
      [Op.or]: [{ name: { [Op.iLike]: pattern } }, { phoneNumber: { [Op.iLike]: pattern } }],
    },
    attributes: ['id', 'name', 'phoneNumber'],
    order: [['name', 'ASC']],
    limit: 10,
  });
};

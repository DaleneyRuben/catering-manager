import { Op } from 'sequelize';
import Client from '../../models/Client';

// Escapes LIKE metacharacters so a query like "%" or "_" is matched literally
// instead of acting as a wildcard.
const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, '\\$&');

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

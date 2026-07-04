import { Op } from 'sequelize';
import { subDays } from 'date-fns';
import LoginEvent from '../../models/LoginEvent';
import { parseUserAgent, type ParsedDevice } from './_helpers';

const RETENTION_DAYS = 180;

export const record = async (
  userId: number,
  userAgent: string | undefined,
): Promise<ParsedDevice> => {
  const parsed = parseUserAgent(userAgent);

  await LoginEvent.create({
    userId,
    ...parsed,
    userAgent: userAgent ?? null,
  });

  await LoginEvent.destroy({
    where: { createdAt: { [Op.lt]: subDays(new Date(), RETENTION_DAYS) } },
  });

  return parsed;
};

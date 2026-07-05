import LoginEvent from '../../models/LoginEvent';
import { parseUserAgent, type ParsedDevice } from './_helpers';

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

  return parsed;
};

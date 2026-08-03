import { Op, Transaction } from 'sequelize';
import { randomUUID } from 'crypto';
import Client from '../../models/Client';
import { withTransaction } from '../../database/with-transaction';

// A delivery group is a set of clients at one address, linked by a shared token on `clients`.
// It lives here rather than in `delivery` because every step of it writes that table — including
// the rows of clients other than the one being edited.
export const setDeliveryGroup = async (
  clientId: number,
  memberIds: number[],
  transaction?: Transaction,
): Promise<void> => {
  const client = await Client.findByPk(clientId);
  if (!client) throw new Error(`Client ${clientId} not found`);

  const oldToken = client.groupToken;

  // Nothing to rewrite, so no transaction is opened.
  if (memberIds.length === 0 && !oldToken) return;

  await withTransaction(transaction, async (t) => {
    if (memberIds.length === 0) {
      await client.update({ groupToken: null }, { transaction: t });
      // Counted inside the same transaction, so it sees the row this call just cleared —
      // outside it, the client would still count as a member and the group never dissolves.
      const remaining = await Client.count({ where: { groupToken: oldToken }, transaction: t });
      if (remaining === 1) {
        await Client.update(
          { groupToken: null },
          { where: { groupToken: oldToken }, transaction: t },
        );
      }
      return;
    }

    // Reuse existing token — never change it unnecessarily
    const token = oldToken ?? randomUUID();
    if (!oldToken) {
      await client.update({ groupToken: token }, { transaction: t });
    }

    // Evict old group members no longer in the new list
    if (oldToken) {
      await Client.update(
        { groupToken: null },
        {
          where: { groupToken: oldToken, id: { [Op.notIn]: [...memberIds, clientId] } },
          transaction: t,
        },
      );
    }

    await Client.update({ groupToken: token }, { where: { id: memberIds }, transaction: t });
  });
};

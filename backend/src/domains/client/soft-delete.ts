import { Transaction } from 'sequelize';
import { HISTORY_EVENTS } from '../../constants/history.constants';
import Client from '../../models/Client';
import { withTransaction } from '../../database/with-transaction';
import type { Actor } from '../../types/actor';
import { record } from '../client-history';

export const softDelete = async (id: number, actor: Actor, transaction?: Transaction) => {
  const client = await Client.findByPk(id);
  if (!client) return null;

  await withTransaction(transaction, async (t) => {
    await client.destroy({ transaction: t });
    await record(actor, { type: HISTORY_EVENTS.CLIENT_DELETED, clientId: id }, t);
  });

  return client;
};

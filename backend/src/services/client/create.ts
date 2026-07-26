import { Transaction } from 'sequelize';
import Client from '../../models/Client';
import { CreateClientDto } from '../../schemas/client.schema';

export const create = (data: CreateClientDto, transaction?: Transaction) =>
  transaction ? Client.create(data as never, { transaction }) : Client.create(data as never);

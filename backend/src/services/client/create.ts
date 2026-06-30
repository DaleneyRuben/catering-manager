import Client from '../../models/Client';
import { CreateClientDto } from '../../schemas/client.schema';

export const create = (data: CreateClientDto) => Client.create(data as never);

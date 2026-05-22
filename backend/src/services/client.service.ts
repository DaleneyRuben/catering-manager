import Client from '../models/Client';
import { CreateClientDto } from '../schemas/client.schema';

const create = (data: CreateClientDto) => Client.create(data as never);

const findAll = () => Client.findAll();

const findById = (id: number) => Client.findByPk(id);

export default { create, findAll, findById };

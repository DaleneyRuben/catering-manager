import Client from '../models/Client';
import Plan from '../models/Plan';
import Subscription from '../models/Subscription';
import { CreateClientDto } from '../schemas/client.schema';

const INCLUDE_SUBSCRIPTION = [{ model: Subscription, include: [Plan] }];

const create = (data: CreateClientDto) => Client.create(data as never);

const findAll = () => Client.findAll({ include: INCLUDE_SUBSCRIPTION });

const findById = (id: number) => Client.findByPk(id, { include: INCLUDE_SUBSCRIPTION });

export default { create, findAll, findById };

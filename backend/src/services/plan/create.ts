import Plan from '../../models/Plan';
import { CreatePlanDto } from '../../schemas/plan.schema';

export const create = (data: CreatePlanDto) => Plan.create(data as never);

import Plan from '../../models/Plan';

export const findById = (id: number) => Plan.findByPk(id);

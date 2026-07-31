import Plan from '../../models/Plan';

export const findAll = () => Plan.findAll({ order: [['price', 'ASC']] });

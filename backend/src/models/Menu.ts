import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({ tableName: 'menus', timestamps: true })
class Menu extends Model {
  @Column({ type: DataType.DATEONLY, allowNull: false, unique: true })
  declare date: string;

  @Column({ type: DataType.TEXT })
  declare breakfast: string | null;

  @Column({ type: DataType.TEXT, field: 'morning_snack' })
  declare morningSnack: string | null;

  @Column({ type: DataType.TEXT })
  declare salad: string | null;

  @Column({ type: DataType.TEXT })
  declare lunch: string | null;

  @Column({ type: DataType.TEXT, field: 'afternoon_snack' })
  declare afternoonSnack: string | null;

  @Column({ type: DataType.TEXT })
  declare dinner: string | null;

  @Column({ type: DataType.TEXT })
  declare juice: string | null;
}

export default Menu;

import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  Default,
  HasMany,
} from "sequelize-typescript";
import Todo from "./Todo";
import User from "./User";

@Table
export default class List extends Model {
  @AutoIncrement
  @PrimaryKey
  @Column
  public id!: number;

  @Column
  public name!: string;

  @Default("#000000")
  @Column
  public color!: string;

  @HasMany(() => Todo)
  public todos!: Todo[];

  @ForeignKey(() => User)
  @Column
  public userId!: number;

  @BelongsTo(() => User, {
    onDelete: "CASCADE",
  })
  public user!: User;
}

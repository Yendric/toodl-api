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
  BeforeCreate,
  BeforeDestroy,
  BeforeBulkDestroy,
} from "sequelize-typescript";
import { DatabaseLimitError } from "../errors/DatabaseLimitError";
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

  @Default(false)
  @Column
  public withoutDates!: boolean;

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

  @BeforeCreate
  static async LimitListsPerUser(instance: List) {
    const amount = await List.count({ where: { userId: instance.userId } });
    if (amount >= 10) {
      throw new DatabaseLimitError("Je mag maximaal 10 lijsten hebben.");
    }
  }

  @BeforeDestroy
  static async KeepOneList(instance: List) {
    const amount = await List.count({ where: { userId: instance.userId } });
    if (amount <= 1) {
      throw new DatabaseLimitError("Je moet minimaal 1 lijst hebben.");
    }
  }

  @BeforeBulkDestroy
  static enableIndividualHooks(options: any) {
    options.individualHooks = true;
  }
}

import {
  Table,
  Column,
  Model,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  ForeignKey,
  BelongsTo,
  Default,
  BeforeCreate,
} from "sequelize-typescript";
import { DatabaseLimitError } from "../errors/DatabaseLimitError";
import List from "./List";
import User from "./User";

@Table
export default class Todo extends Model {
  @AutoIncrement
  @PrimaryKey
  @Column
  public id!: number;

  @Column
  public subject!: string;

  @Column
  public description!: string;

  @AllowNull
  @Column
  public isAllDay!: boolean;

  @AllowNull
  @Column
  public location!: string;

  @AllowNull
  @Column
  public recurrenceRule!: string;

  @AllowNull
  @Column
  public startTimezone!: string;

  @AllowNull
  @Column
  public endTimezone!: string;

  @Column
  public startTime!: Date;

  @AllowNull
  @Column
  public endTime!: Date;

  @AllowNull
  @Column
  public recurrenceException!: string;

  @AllowNull
  @Default(false)
  @Column
  public done!: boolean;

  @ForeignKey(() => List)
  @Column
  public listId!: number;

  @BelongsTo(() => List)
  public list!: List;

  @ForeignKey(() => User)
  @Column
  public userId!: number;

  @BelongsTo(() => User, {
    onDelete: "CASCADE",
  })
  public user!: User;

  @BeforeCreate
  static async limitTodosPerList(instance: Todo) {
    const amount = await Todo.count({ where: { listId: instance.listId } });
    if (amount >= 100) {
      throw new DatabaseLimitError("Je kan maximaal 100 todos per lijst hebben.");
    }
  }
}

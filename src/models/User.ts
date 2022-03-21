import {
  Table,
  Column,
  Model,
  Unique,
  IsEmail,
  PrimaryKey,
  AllowNull,
  AutoIncrement,
  HasMany,
  Default,
  AfterCreate,
} from "sequelize-typescript";
import List from "./List";
import Todo from "./Todo";

@Table
export default class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  public id!: number;

  @Unique
  @IsEmail
  @Column
  public email!: string;

  @AllowNull
  @Column
  public password!: string;

  @Column
  public username!: string;

  @Default(true)
  @Column
  public dailyNotification!: boolean;

  @Default(true)
  @Column
  public reminderNotification!: boolean;

  @Default(true)
  @Column
  public nowNotification!: boolean;

  @Column
  public smartschoolCourseExport!: string;

  @Column
  public smartschoolTaskExport!: string;

  @HasMany(() => Todo)
  public todos!: Todo[];

  @HasMany(() => List)
  public lists!: List[];

  @AfterCreate
  static createFirstList(instance: User) {
    List.create({ userId: instance.id, name: "Standaard", color: "#33AAFF" });
  }
}

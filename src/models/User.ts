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
} from "sequelize-typescript";
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

  @Column
  public dailyNotification!: boolean;

  @Column
  public reminderNotification!: boolean;

  @Column
  public nowNotification!: boolean;

  @Column
  public smartschoolCourseExport!: string;

  @Column
  public smartschoolTaskExport!: string;

  @HasMany(() => Todo)
  public todos!: Todo[];
}

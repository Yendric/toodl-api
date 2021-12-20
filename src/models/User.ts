import { Table, Column, Model, Unique, IsEmail, PrimaryKey, AllowNull, AutoIncrement, HasMany } from 'sequelize-typescript';
import Todo from './Todo';

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

    @HasMany(() => Todo)
    public todos!: Todo[]
}
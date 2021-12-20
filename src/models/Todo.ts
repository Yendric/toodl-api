import { Table, Column, Model, PrimaryKey, AutoIncrement, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import User from './User';

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
    @Column
    public done!: boolean;

    @ForeignKey(() => User)
    @Column
    public userId!: number;

    @BelongsTo(() => User, {
        onDelete: 'CASCADE',
    })
    public user!: User;
}
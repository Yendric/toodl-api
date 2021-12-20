import { Sequelize } from 'sequelize-typescript';
import { log } from '../utils/logging';
import Todo from './Todo';
import User from './User';

const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: process.env.debug ? log : false,
    storage: 'database.sqlite',
});

sequelize.addModels([Todo, User]);
sequelize.sync();
import { Sequelize } from "sequelize-typescript";
import { log } from "@/utils/logging";
import List from "@/models/List";
import Todo from "@/models/Todo";
import User from "@/models/User";

const sequelize = new Sequelize("database", "user", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: process.env.debug ? log : false,
  storage: "database.sqlite",
});

sequelize.addModels([Todo, User, List]);
sequelize.sync();

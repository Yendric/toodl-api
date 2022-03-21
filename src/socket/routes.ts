import * as TodoController from "./controllers/todo";
import * as ListController from "./controllers/list";
import Router from "./Router";

Router.add("todos/update", TodoController.update);
Router.add("todos/destroy", TodoController.destroy);
Router.add("todos/create", TodoController.create);
Router.add("todos", TodoController.index);

Router.add("lists/update", ListController.update);
Router.add("lists/destroy", ListController.destroy);
Router.add("lists/create", ListController.create);
Router.add("lists/todos", ListController.index);
Router.add("lists", ListController.index);

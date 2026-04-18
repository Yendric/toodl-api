import { Container } from "inversify";
import "reflect-metadata";
import { AuthController } from "./controllers/auth.js";
import { CategoryController } from "./controllers/category.js";
import { ListController } from "./controllers/list.js";
import { NotificationController } from "./controllers/notification.js";
import { StoreController } from "./controllers/store.js";
import { TodoController } from "./controllers/todo.js";
import { UserController } from "./controllers/user.js";
import { MailProvider } from "./providers/MailProvider.js";
import { WebPushProvider } from "./providers/WebPushProvider.js";
import { AuthService } from "./services/AuthService.js";
import { CategoryService } from "./services/CategoryService.js";
import { CronService } from "./services/CronService.js";
import { ListService } from "./services/ListService.js";
import { LoggingService } from "./services/LoggingService.js";
import { MailService } from "./services/MailService.js";
import { NotificationService } from "./services/NotificationService.js";
import { StoreService } from "./services/StoreService.js";
import { TodoService } from "./services/TodoService.js";
import { UserService } from "./services/UserService.js";

const iocContainer = new Container();

iocContainer.bind<AuthController>(AuthController).toSelf();
iocContainer.bind<CategoryController>(CategoryController).toSelf();
iocContainer.bind<ListController>(ListController).toSelf();
iocContainer.bind<StoreController>(StoreController).toSelf();
iocContainer.bind<TodoController>(TodoController).toSelf();
iocContainer.bind<UserController>(UserController).toSelf();
iocContainer.bind<NotificationController>(NotificationController).toSelf();

iocContainer.bind<MailProvider>(MailProvider).toSelf();
iocContainer.bind<WebPushProvider>(WebPushProvider).toSelf();

iocContainer.bind<AuthService>(AuthService).toSelf();
iocContainer.bind<CategoryService>(CategoryService).toSelf();
iocContainer.bind<CronService>(CronService).toSelf();
iocContainer.bind<ListService>(ListService).toSelf();
iocContainer.bind<LoggingService>(LoggingService).toSelf().inSingletonScope();
iocContainer.bind<MailService>(MailService).toSelf();
iocContainer.bind<NotificationService>(NotificationService).toSelf();
iocContainer.bind<StoreService>(StoreService).toSelf();
iocContainer.bind<TodoService>(TodoService).toSelf();
iocContainer.bind<UserService>(UserService).toSelf();

export { iocContainer };

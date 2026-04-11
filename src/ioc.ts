import { Controller } from "tsoa";
import { AuthController } from "./controllers/auth.js";
import { ListController } from "./controllers/list.js";
import { NotificationController } from "./controllers/notification.js";
import { TodoController } from "./controllers/todo.js";
import { UserController } from "./controllers/user.js";
import { AuthService, type IAuthService } from "./services/AuthService.js";
import { ListService, type IListService } from "./services/ListService.js";
import { NotificationService, type INotificationService } from "./services/NotificationService.js";
import { TodoService, type ITodoService } from "./services/TodoService.js";
import { UserService, type IUserService } from "./services/UserService.js";

class IoCContainer {
  private _userService: IUserService;
  private _authService: IAuthService;
  private _listService: IListService;
  private _todoService: ITodoService;
  private _notificationService: INotificationService;

  constructor() {
    this._userService = new UserService();
    this._authService = new AuthService(this._userService);
    this._listService = new ListService();
    this._todoService = new TodoService();
    this._notificationService = new NotificationService();
  }

  public get<T extends Controller>(controller: new (...args: unknown[]) => T): T {
    if (controller === (AuthController as unknown)) {
      return new AuthController(this._authService) as unknown as T;
    }
    if (controller === (ListController as unknown)) {
      return new ListController(this._listService) as unknown as T;
    }
    if (controller === (TodoController as unknown)) {
      return new TodoController(this._todoService) as unknown as T;
    }
    if (controller === (UserController as unknown)) {
      return new UserController(this._userService) as unknown as T;
    }
    if (controller === (NotificationController as unknown)) {
      return new NotificationController(this._notificationService) as unknown as T;
    }

    return new (controller as new (...args: unknown[]) => T)();
  }
}

export const iocContainer = new IoCContainer();

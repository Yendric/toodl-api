import { AuthController } from "./controllers/auth";
import { ListController } from "./controllers/list";
import { TodoController } from "./controllers/todo";
import { UserController } from "./controllers/user";
import { AuthService, IAuthService } from "./services/AuthService";
import { ListService, IListService } from "./services/ListService";
import { TodoService, ITodoService } from "./services/TodoService";
import { UserService, IUserService } from "./services/UserService";
import { Controller } from "tsoa";

class IoCContainer {
  private _userService: IUserService;
  private _authService: IAuthService;
  private _listService: IListService;
  private _todoService: ITodoService;

  constructor() {
    this._userService = new UserService();
    this._authService = new AuthService(this._userService);
    this._listService = new ListService();
    this._todoService = new TodoService();
  }

  public async get<T extends Controller>(controller: new (...args: any[]) => T): Promise<T> {
    if (controller === AuthController as unknown) {
      return new AuthController(this._authService) as unknown as T;
    }
    if (controller === ListController as unknown) {
      return new ListController(this._listService) as unknown as T;
    }
    if (controller === TodoController as unknown) {
      return new TodoController(this._todoService) as unknown as T;
    }
    if (controller === UserController as unknown) {
      return new UserController(this._userService) as unknown as T;
    }

    return new controller();
  }
}

export const iocContainer = new IoCContainer();

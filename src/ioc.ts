import { Controller } from "tsoa";
import { AuthController } from "./controllers/auth.js";
import { CategoryController } from "./controllers/category.js";
import { ListController } from "./controllers/list.js";
import { StoreController } from "./controllers/store.js";
import { TodoController } from "./controllers/todo.js";
import { UserController } from "./controllers/user.js";
import { AuthService, type IAuthService } from "./services/AuthService.js";
import { CategoryService, type ICategoryService } from "./services/CategoryService.js";
import { ListService, type IListService } from "./services/ListService.js";
import { StoreService, type IStoreService } from "./services/StoreService.js";
import { TodoService, type ITodoService } from "./services/TodoService.js";
import { UserService, type IUserService } from "./services/UserService.js";

class IoCContainer {
  private _userService: IUserService;
  private _authService: IAuthService;
  private _listService: IListService;
  private _todoService: ITodoService;
  private _categoryService: ICategoryService;
  private _storeService: IStoreService;

  constructor() {
    this._userService = new UserService();
    this._authService = new AuthService(this._userService);
    this._listService = new ListService();
    this._todoService = new TodoService();
    this._categoryService = new CategoryService();
    this._storeService = new StoreService();
  }

  public get<T extends Controller>(controller: new (...args: unknown[]) => T): T {
    if (controller === (AuthController as unknown)) {
      return new AuthController(this._authService) as unknown as T;
    }
    if (controller === (CategoryController as unknown)) {
      return new CategoryController(this._categoryService) as unknown as T;
    }
    if (controller === (ListController as unknown)) {
      return new ListController(this._listService) as unknown as T;
    }
    if (controller === (StoreController as unknown)) {
      return new StoreController(this._storeService) as unknown as T;
    }
    if (controller === (TodoController as unknown)) {
      return new TodoController(this._todoService) as unknown as T;
    }
    if (controller === (UserController as unknown)) {
      return new UserController(this._userService) as unknown as T;
    }

    return new (controller as new (...args: unknown[]) => T)();
  }
}

export const iocContainer = new IoCContainer();

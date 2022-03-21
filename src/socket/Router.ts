import User from "../models/User";
import { callBackFn, emitFn, Route } from "../types";
import { broadcastLists, broadcastTodos } from "./services/broadcastingService";

export default class Router {
  static routes: Route[] = [];

  static add(uri: string, callback: callBackFn) {
    this.routes.push({ uri, callback });
  }

  static match(uri: string, args: any[], user: User, emit: emitFn) {
    const callbackFn = args.pop();
    const route = this.routes.find((route) => route.uri === uri);

    if (!route) return "404";

    route.callback.call(this, args[0], user, emit).then((res: any) => callbackFn(res));

    // Broadcast changes
    broadcastTodos(user, emit);
    broadcastLists(user, emit);
  }
}

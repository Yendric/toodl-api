import User from "../../models/User";
import { emitFn } from "../../types";

export async function broadcastTodos(user: User, emit: emitFn) {
  const todos = await user.$get("todos", {
    order: [
      ["done", "ASC"],
      ["startTime", "ASC"],
    ],
  });
  emit("todos", todos);
}

export async function broadcastLists(user: User, emit: emitFn) {
  const lists = await user.$get("lists", {
    order: [["name", "ASC"]],
  });
  emit("lists", lists);
}

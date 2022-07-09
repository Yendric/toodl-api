import User from "@/models/User";
import { io } from "@/server";

export async function broadcastTodos(user?: User) {
  if (!user) return;

  const room = "user." + user.id;

  const todos = await user.$get("todos", {
    order: [
      ["done", "ASC"],
      ["startTime", "ASC"],
    ],
  });

  io.to(room).emit("todos", todos);
}

export async function broadcastLists(user?: User) {
  if (!user) return;

  const room = "user." + user.id;

  const lists = await user.$get("lists", {
    order: [["name", "ASC"]],
  });
  io.to(room).emit("lists", lists);
}

import List from "../../models/List";
import User from "../../models/User";

export async function update(list: List, user: User) {
  await List.update(
    {
      name: list.name,
      color: list.color,
    },
    {
      where: {
        id: list.id,
        userId: user.id,
      },
    }
  );

  return true;
}
export async function destroy(list: List, user: User) {
  await List.destroy({
    where: {
      id: list.id,
      userId: user.id,
    },
  });

  return true;
}

export async function create(list: List, user: User) {
  await List.create({
    name: list.name,
    color: list.color,
    userId: user.id,
  });

  return true;
}

export async function todos(list: List) {
  const todos = await list.$get("todos", {
    order: [
      ["done", "ASC"],
      ["startTime", "ASC"],
    ],
  });

  return todos;
}

export async function index(args: null, user: User) {
  if (!user) return;
  const lists = await user.$get("lists", {
    order: [["name", "ASC"]],
  });

  return lists;
}

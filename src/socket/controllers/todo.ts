import dayjs from "dayjs";
import Todo from "../../models/Todo";
import User from "../../models/User";

// TODO: Input validation en object destructuring
export async function create(todo: Todo, user: User) {
  if (!todo.startTime) todo.startTime = new Date();
  if (!todo.endTime) todo.endTime = dayjs(todo.startTime).add(1, "hour").toDate();

  await Todo.create({
    subject: todo.subject,
    description: todo.description,
    isAllDay: todo.isAllDay,
    location: todo.location,
    recurrenceRule: todo.recurrenceRule,
    startTimezone: todo.startTimezone,
    endTimezone: todo.endTimezone,
    startTime: todo.startTime,
    endTime: todo.endTime,
    recurrenceException: todo.recurrenceException,
    listId: todo.listId ?? null,
    userId: user.id,
    done: todo.done,
  });

  return true;
}

export async function destroy(todo: Todo, user: User) {
  await Todo.destroy({
    where: {
      id: todo.id,
      userId: user.id,
    },
  });

  return true;
}

export async function update(todo: Todo, user: User) {
  if (!todo.startTime) todo.startTime = new Date();

  await Todo.update(
    {
      subject: todo.subject,
      description: todo.description,
      isAllDay: todo.isAllDay,
      location: todo.location,
      recurrenceRule: todo.recurrenceRule,
      startTimezone: todo.startTimezone,
      endTimezone: todo.endTimezone,
      startTime: todo.startTime,
      endTime: todo.endTime,
      recurrenceException: todo.recurrenceException,
      listId: todo.listId ?? null,
      done: todo.done,
    },
    {
      where: {
        id: todo.id,
        userId: user.id,
      },
    }
  );

  return true;
}
export async function index(args: null, user: User) {
  if (!user) return;
  const todos = await user.$get("todos", {
    order: [
      ["done", "ASC"],
      ["startTime", "ASC"],
    ],
  });
  return todos;
}

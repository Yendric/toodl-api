import todoMail from "@/mail/emails/todoMail";
import prisma from "@/prisma";
import dayjs from "dayjs";
import cron from "node-cron";

/*
/  Email schedule, elke dag om 18:00 uur e-mail over de todos van morgen.
*/
cron.schedule("0 18 * * *", async function () {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      username: true,
      todos: {
        where: {
          done: false,
        },
      },
    },
  });
  users.forEach(async (user) => {
    const todos = user.todos.filter((todo) => {
      const todoDate = dayjs(todo.startTime);
      const tomorrow = dayjs().add(1, "days");
      return todoDate.isSame(tomorrow, "day");
    });
    if (!todos.length) return;
    todoMail(todos, user, "Todo's voor morgen", "morgen heeft u de volgende todo's gepland, vergeet ze niet:");
  });
});

/*
/  Controleert elke minuut op actuele todo's en todo's binnen een kwartier
*/
cron.schedule("* * * * *", async function () {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      username: true,
      todos: {
        where: {
          done: false,
        },
      },
    },
  });
  users.forEach(async (user) => {
    const currentTodos = user.todos.filter((todo) => {
      const now = dayjs();
      const todoDate = dayjs(todo.startTime);
      return todoDate.isSame(now, "minute");
    });
    if (currentTodos.length) {
      todoMail(
        currentTodos,
        user,
        "U heeft een todo gepland",
        "op dit moment heeft u de volgende todo('s) gepland, vergeet ze niet:"
      );
    }

    const quartreTodos = user.todos.filter((todo) => {
      const now = dayjs();
      const todoDate = dayjs(todo.startTime);
      return todoDate.diff(now, "minute") === 15;
    });
    if (quartreTodos.length) {
      todoMail(
        quartreTodos,
        user,
        "Todos over een kwartier",
        "over een kwartier heeft u de volgende todo('s) gepland, vergeet ze niet:"
      );
    }
  });
});

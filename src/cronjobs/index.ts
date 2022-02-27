import dayjs from "dayjs";
import cron from "node-cron";
import User from "../models/User";
import mail from "../utils/mail";

/*
/  Email schedule, elke dag om 18:00 uur e-mail over de todos van morgen.
*/
cron.schedule("0 18 * * *", async function () {
  const users = await User.findAll();
  users.forEach(async (user) => {
    const todos = (
      await user.$get("todos", {
        where: {
          done: false,
        },
      })
    ).filter((todo) => {
      const todoDate = dayjs(todo.startTime);
      const tomorrow = dayjs().add(1, "days");
      return todoDate.isSame(tomorrow, "day");
    });
    if (!todos.length) return;
    mail(
      todos,
      user.email,
      user.username,
      "Todo's voor morgen",
      "morgen heeft u de volgende todo's gepland, vergeet ze niet:"
    );
  });
});

/*
/  Controleert elke minuut op actuele todo's en todo's binnen een kwartier
*/
cron.schedule("* * * * *", async function () {
  const users = await User.findAll();
  users.forEach(async (user) => {
    const todos = await user.$get("todos", {
      where: {
        done: false,
      },
    });

    const currentTodos = todos.filter((todo) => {
      const now = dayjs();
      const todoDate = dayjs(todo.startTime);
      return todoDate.isSame(now, "minute");
    });
    if (currentTodos.length) {
      mail(
        currentTodos,
        user.email,
        user.username,
        "U heeft een todo gepland",
        "op dit moment heeft u de volgende todo('s) gepland, vergeet ze niet:"
      );
    }

    const quartreTodos = todos.filter((todo) => {
      const now = dayjs();
      const todoDate = dayjs(todo.startTime);
      return todoDate.diff(now, "minute") === 15;
    });
    if (quartreTodos.length) {
      mail(
        quartreTodos,
        user.email,
        user.username,
        "Todos over een kwartier",
        "over een kwartier heeft u de volgende todo('s) gepland, vergeet ze niet:"
      );
    }
  });
});

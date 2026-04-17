import { iocContainer } from "#/ioc.js";
import { MailService } from "#/services/MailService.js";
import prisma from "#/prisma.js";
import { LoggingService } from "#/services/LoggingService.js";
import dayjs from "dayjs";
import cron from "node-cron";

/*
/  Email schedule, elke dag om 18:00 uur e-mail over de todos van morgen.
*/
cron.schedule("0 18 * * *", () => {
  void (async () => {
    try {
      const users = await prisma.user.findMany({
        select: {
          email: true,
          username: true,
          todos: {
            where: {
              done: false,
              enableDeadline: true,
            },
          },
        },
      });
      for (const user of users) {
        const todos = user.todos.filter((todo) => {
          const todoDate = dayjs(todo.startTime);
          const tomorrow = dayjs().add(1, "days");
          return todo.enableDeadline && todoDate.isSame(tomorrow, "day");
        });
        if (!todos.length) continue;
        await iocContainer.get(MailService).sendTodoMail(
          todos,
          user,
          "Todo's voor morgen",
          "morgen heeft u de volgende todo's gepland, vergeet ze niet:",
        );
      }
    } catch (err) {
      iocContainer.get(LoggingService).error("Error in daily email cronjob: " + String(err));
    }
  })();
});

/*
/  Controleert elke minuut op actuele todo's en todo's binnen een kwartier
*/
cron.schedule("* * * * *", () => {
  void (async () => {
    try {
      const users = await prisma.user.findMany({
        select: {
          email: true,
          username: true,
          todos: {
            where: {
              done: false,
              enableDeadline: true,
            },
          },
        },
      });
      for (const user of users) {
        const currentTodos = user.todos.filter((todo) => {
          const now = dayjs();
          const todoDate = dayjs(todo.startTime);
          return todo.enableDeadline && todoDate.isSame(now, "minute");
        });
        if (currentTodos.length) {
          await iocContainer.get(MailService).sendTodoMail(
            currentTodos,
            user,
            "U heeft een todo gepland",
            "op dit moment heeft u de volgende todo('s) gepland, vergeet ze niet:",
          );
        }

        const quartreTodos = user.todos.filter((todo) => {
          const now = dayjs();
          const todoDate = dayjs(todo.startTime);
          return todo.enableDeadline && todoDate.diff(now, "minute") === 15;
        });
        if (quartreTodos.length) {
          await iocContainer.get(MailService).sendTodoMail(
            quartreTodos,
            user,
            "Todos over een kwartier",
            "over een kwartier heeft u de volgende todo('s) gepland, vergeet ze niet:",
          );
        }
      }
    } catch (err) {
      iocContainer.get(LoggingService).error("Error in minute check cronjob: " + String(err));
    }
  })();
});

import todoMail from "#/mail/emails/todoMail.js";
import prisma from "#/prisma.js";
import { NotificationService } from "#/services/NotificationService.js";
import dayjs from "dayjs";
import cron from "node-cron";

import { error as logError } from "#/utils/logging.js";

const notificationService = new NotificationService();
const APP_URI = process.env.APP_URI || "http://localhost:3000";

/*
/  Email schedule, elke dag om 18:00 uur e-mail over de todos van morgen.
*/
cron.schedule("0 18 * * *", () => {
  void (async () => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          dailyPush: true,
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
        await todoMail(
          todos,
          user,
          "Todo's voor morgen",
          "morgen heeft u de volgende todo's gepland, vergeet ze niet:",
        );

        // Push notification
        await notificationService.sendPush(
          user.id,
          {
            title: "Todo's voor morgen",
            body: `Je hebt ${todos.length} todo's gepland voor morgen.`,
            data: { url: `${APP_URI}/` },
          },
          "daily",
        );
      }
    } catch (err) {
      logError("Error in daily email cronjob: " + String(err));
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
          id: true,
          email: true,
          username: true,
          reminderPush: true,
          nowPush: true,
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
          await todoMail(
            currentTodos,
            user,
            "U heeft een todo gepland",
            "op dit moment heeft u de volgende todo('s) gepland, vergeet ze niet:",
          );

          // Push notification for "now"
          for (const todo of currentTodos) {
            await notificationService.sendPush(
              user.id,
              {
                title: "Nu gepland",
                body: todo.subject,
                data: { url: `${APP_URI}/todo/${todo.id}` },
              },
              "now",
            );
          }
        }

        const quartreTodos = user.todos.filter((todo) => {
          const now = dayjs();
          const todoDate = dayjs(todo.startTime);
          return todo.enableDeadline && todoDate.diff(now, "minute") === 15;
        });
        if (quartreTodos.length) {
          await todoMail(
            quartreTodos,
            user,
            "Todos over een kwartier",
            "over een kwartier heeft u de volgende todo('s) gepland, vergeet ze niet:",
          );

          // Push notification for reminders
          for (const todo of quartreTodos) {
            await notificationService.sendPush(
              user.id,
              {
                title: "Over 15 minuten",
                body: todo.subject,
                data: { url: `${APP_URI}/todo/${todo.id}` },
              },
              "reminder",
            );
          }
        }
      }
    } catch (err) {
      logError("Error in minute check cronjob: " + String(err));
    }
  })();
});

import { inject, injectable } from "inversify";
import prisma from "#/prisma.js";
import { LoggingService } from "./LoggingService.js";
import { NotificationService } from "./NotificationService.js";
import dayjs from "dayjs";

@injectable()
export class CronService {
  constructor(
    @inject(NotificationService) private notificationService: NotificationService,
    @inject(LoggingService) private loggingService: LoggingService,
  ) {}

  public async processDailyNotifications(): Promise<void> {
    this.loggingService.log("Starting daily notification cronjob...");
    try {
      const tomorrowStart = dayjs().add(1, "days").startOf("day").toDate();
      const tomorrowEnd = dayjs().add(1, "days").endOf("day").toDate();

      const users = await prisma.user.findMany({
        where: {
          todos: {
            some: {
              done: false,
              enableDeadline: true,
              startTime: {
                gte: tomorrowStart,
                lte: tomorrowEnd,
              },
            },
          },
        },
        include: {
          todos: {
            where: {
              done: false,
              enableDeadline: true,
              startTime: {
                gte: tomorrowStart,
                lte: tomorrowEnd,
              },
            },
          },
          pushSubscriptions: true,
        },
      });

      const promises = users.map((user) => {
        if (!user.todos.length) return Promise.resolve();
        return this.notificationService.dispatchDaily(user, user.todos);
      });

      await Promise.allSettled(promises);
      this.loggingService.success(`Daily notification cronjob finished. Processed ${promises.length} users.`);
    } catch (err) {
      this.loggingService.error("Error in daily notification cronjob: " + String(err));
    }
  }

  public async processMinuteNotifications(): Promise<void> {
    this.loggingService.log("Starting minute check cronjob...");
    try {
      const nowStart = dayjs().startOf("minute").toDate();
      const nowEnd = dayjs().endOf("minute").toDate();

      const fifteenStart = dayjs().add(15, "minute").startOf("minute").toDate();
      const fifteenEnd = dayjs().add(15, "minute").endOf("minute").toDate();

      const usersNow = await prisma.user.findMany({
        where: {
          todos: {
            some: {
              done: false,
              enableDeadline: true,
              startTime: {
                gte: nowStart,
                lte: nowEnd,
              },
            },
          },
        },
        include: {
          todos: {
            where: {
              done: false,
              enableDeadline: true,
              startTime: {
                gte: nowStart,
                lte: nowEnd,
              },
            },
          },
          pushSubscriptions: true,
        },
      });

      const promisesNow = usersNow.flatMap((user) =>
        user.todos.map((todo) => this.notificationService.dispatchNow(user, todo)),
      );

      const usersReminder = await prisma.user.findMany({
        where: {
          todos: {
            some: {
              done: false,
              enableDeadline: true,
              startTime: {
                gte: fifteenStart,
                lte: fifteenEnd,
              },
            },
          },
        },
        include: {
          todos: {
            where: {
              done: false,
              enableDeadline: true,
              startTime: {
                gte: fifteenStart,
                lte: fifteenEnd,
              },
            },
          },
          pushSubscriptions: true,
        },
      });

      const promisesReminder = usersReminder.flatMap((user) =>
        user.todos.map((todo) => this.notificationService.dispatchReminder(user, todo)),
      );

      await Promise.allSettled([...promisesNow, ...promisesReminder]);
      this.loggingService.success(
        `Minute check cronjob finished. Dispatched ${promisesNow.length} immediate notifications and ${promisesReminder.length} reminders.`,
      );
    } catch (err) {
      this.loggingService.error("Error in minute check cronjob: " + String(err));
    }
  }
}

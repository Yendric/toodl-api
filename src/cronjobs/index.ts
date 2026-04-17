import { iocContainer } from "#/ioc.js";
import { CronService } from "#/services/CronService.js";
import cron from "node-cron";

/*
/  Email schedule, elke dag om 18:00 uur e-mail over de todos van morgen.
*/
cron.schedule("0 18 * * *", () => {
  void iocContainer.get(CronService).processDailyNotifications();
});

/*
/  Controleert elke minuut op actuele todo's en todo's binnen een kwartier
*/
cron.schedule("* * * * *", () => {
  void iocContainer.get(CronService).processMinuteNotifications();
});

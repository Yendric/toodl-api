import { app } from "#/index.js";
import { iocContainer } from "#/ioc.js";
import { LoggingService } from "#/services/LoggingService.js";
import { createServer } from "http";

const port = process.env.PORT ?? 3000;

export const server = createServer(app);

if (process.env.NODE_ENV !== "test") {
  server.listen(port, () => {
    iocContainer
      .get(LoggingService)
      .announce(`App is online on port ${port}. Visit ${process.env.CALLBACK_URI} in your browser.`);
  });
}

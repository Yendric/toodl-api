import { app } from "#/index.js";
import { announce } from "#/utils/logging.js";
import { createServer } from "http";

const port = process.env.PORT ?? 3000;

export const server = createServer(app);

if (process.env.NODE_ENV !== "test") {
  server.listen(port, () => {
    announce(`App is online op poort ${port}. Bezoek ${process.env.CALLBACK_URI} in je browser.`);
  });
}

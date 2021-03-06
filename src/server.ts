import { createServer } from "http";
import { app } from "@/index";
import { announce } from "@/utils/logging";

const port = process.env.PORT ?? 3000;

export const server = createServer(app);
import { io } from "@/socket";
export { io };

if (process.env.NODE_ENV !== "test") {
  server.listen(port, () => {
    announce(`App is online op poort ${port}. Bezoek ${process.env.CALLBACK_URI} in je browser.`);
  });
}

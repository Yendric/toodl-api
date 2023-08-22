import handleError from "@/middleware/errorHandler";
import routes from "@/routes/routes";
import cors from "cors";
import { config } from "dotenv";
import express from "express";
import "express-async-errors";
import session from "express-session";
import helmet from "helmet";

config();
const API_VERSION = "v1";

const app = express();

const FileStore = require("session-file-store")(session);
const sessionMiddleware = session({
  store: new FileStore(),
  secret: process.env.SECRET ?? "CHANGE-ME-IN-DOTENV-Q#%$GR$A&EHL*H@UA#RXQPSWHCDUN",
  saveUninitialized: false,
  resave: false,
  rolling: true,
  cookie: { maxAge: 2592000000 },
  name: "toodl_session",
});

app.use(helmet());
app.use(cors({ origin: process.env.APP_URI, credentials: true }));
app.use(express.json());
app.use(sessionMiddleware);
app.use(`/${API_VERSION}`, routes);
app.use(handleError);

import "@/cronjobs";

export { API_VERSION, app, sessionMiddleware };

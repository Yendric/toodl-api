import express from "express";
import session from "express-session";
import cors from "cors";
import { config } from "dotenv";
import SessionFileStore from "session-file-store";
import helmet from "helmet";
import routes from "@/routes/routes";
import handleError from "@/middleware/errorHandler";

config();
const API_VERSION = "v1";

const app = express();

const FileStore = SessionFileStore(session);
const sessionMiddleware = session({
  store: new FileStore(),
  secret: process.env.SECRET ?? "CHANGE-ME-IN-DOTENV-Q#%$GR$A&EHL*H@UA#RXQPSWHCDUN",
  saveUninitialized: false,
  resave: false,
  cookie: { maxAge: 2592000000 },
  name: "toodl_session",
});

app.use(helmet());
app.use(cors({ origin: process.env.APP_URI, credentials: true }));
app.use(express.json());
app.use(sessionMiddleware);
app.use(`/${API_VERSION}`, routes);
app.use(handleError);

import "./models/database";
import "./cronjobs";

export { sessionMiddleware, app, API_VERSION };

import express from "express";
import session from "express-session";
import cors from "cors";
import auth from "./routes/auth";
import { config } from "dotenv";
import SessionFileStore from "session-file-store";

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
});

app.use(cors({ origin: process.env.APP_URI, credentials: true }));
app.use(express.json());
app.use(sessionMiddleware);
app.use(`/${API_VERSION}/auth`, auth);

import "./models/database";
import "./cronjobs";

export { sessionMiddleware, app, API_VERSION };

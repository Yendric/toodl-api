import express from "express";
import session from "express-session";
import cors from "cors";
import auth from "./routes/auth";
import { config } from "dotenv";

config();

const app = express();

const sessionMiddleware = session({
  secret:
    process.env.SECRET ?? "CHANGE-ME-IN-DOTENV-Q#%$GR$A&EHL*H@UA#RXQPSWHCDUN",
  saveUninitialized: false,
  resave: false,
  cookie: { maxAge: 2592000000 },
});

app.use(cors({ origin: process.env.APP_URI, credentials: true }));
app.use(express.json());
app.use(sessionMiddleware);
app.use("/v1/auth", auth);

import "./models/database";
import "./cronjobs";

export { sessionMiddleware, app };

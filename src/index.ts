import { config } from "dotenv";
import { expand } from "dotenv-expand";

expand(config());

import handleError from "#/middleware/errorHandler.js";
import { requestLogger } from "#/middleware/requestLogger.js";
import { RegisterRoutes } from "#/routes.js";
import cors from "cors";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import SessionFileStore from "session-file-store";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.json" with { type: "json" };

const API_VERSION = "v1";

const app = express();
app.set("trust proxy", 1);

const swaggerOptions = {
  ...swaggerDocument,
  servers: [{ url: `${process.env.CALLBACK_URI ?? "http://localhost:3001"}/${API_VERSION}` }],
};

const FileStore = SessionFileStore(session);
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
app.use(cors({ origin: process.env.APP_URI?.split(","), credentials: true }));
app.use(express.json());
app.use(sessionMiddleware);
app.use(requestLogger);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerOptions));

const v1Router = express.Router();
RegisterRoutes(v1Router);
app.use(`/${API_VERSION}`, v1Router);

app.use(handleError);

import "#/cronjobs/index.js";

export { API_VERSION, app, sessionMiddleware };

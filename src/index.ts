import express from 'express';
import session from 'express-session';
import cors from 'cors';
import auth from './routes/auth';
import { config } from 'dotenv';
import { announce } from './utils/logging';

config();

const app = express();
const port = process.env.PORT ?? 3000;

const sessionMiddleware = session({
    secret: process.env.SECRET ?? 'CHANGE-ME-IN-DOTENV-Q#%$GR$A&EHL*H@UA#RXQPSWHCDUN',
    saveUninitialized: false,
    resave: false,
    cookie: { maxAge: 2592000000 },
});

app.use(cors({ origin: process.env.APP_URI, credentials: true }));
app.use(express.json());
app.use(sessionMiddleware);
app.use('/v1/auth', auth);

const server = app.listen(port, function() {
    announce(`App is online op poort ${port}. Bezoek ${process.env.CALLBACK_URI} in je browser.`);
});

import './models/database';
import './socket';
import './cronjobs';

export { sessionMiddleware, server };

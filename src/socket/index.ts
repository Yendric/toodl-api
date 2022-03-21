import isLoggedIn from "../middleware/auth";
import { sessionMiddleware } from "..";
import server from "../server";
import User from "../models/User";
import { Server } from "socket.io";
import { IncomingMessage } from "../types";
import { NextFunction, Request, Response } from "express";
import Router from "./Router";

/*
/ Maak socket.io server met zelfde middleware als expresserver
*/
const io = new Server(server, {
  cors: {
    origin: process.env.APP_URI,
    credentials: true,
  },
});
io.use((socket, next) => {
  sessionMiddleware(socket.request as Request, {} as Response, next as NextFunction);
  isLoggedIn(socket.request, {}, next);
});

/*
/ Registreer routes van de websocket
*/
import "./routes";

/*
/ Behandel connecties met de socket.io server
*/
io.on("connection", async function (socket) {
  const request = socket.request as IncomingMessage;
  if (!request.session) return;
  const user = await User.findByPk(request.session.userId);
  if (!user) return;

  const room = "user." + user.id;
  socket.join(room);

  socket.onAny((uri, ...args) => Router.match(uri, args, user, io.to(room).emit.bind(socket)));
});

import isLoggedIn from "../middleware/auth";
import { sessionMiddleware } from "..";
import server from "../server";
import User from "../models/User";
import Todo from "../models/Todo";
import { Server } from "socket.io";
import { IncomingMessage } from "../types";
import { NextFunction, Request, Response } from "express";

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
/ Behandel connecties met de socket.io server
*/
io.on("connection", async function (socket) {
  const request = socket.request as IncomingMessage;
  if (!request.session) return;
  const user = await User.findByPk(request.session.userId);
  if (!user) return;

  const room = "user." + user.id;
  socket.join(room);

  async function sendTodos() {
    if (!user) return;
    const todos = await user.$get("todos", {
      order: [
        ["done", "ASC"],
        ["startTime", "ASC"],
      ],
    });
    io.to(room).emit("todos", todos);
  }

  socket.on("index", () => sendTodos());

  socket.on(
    "create",
    async (
      {
        subject,
        description,
        isAllDay,
        location,
        reccurenceRule,
        startTimezone,
        endTimezone,
        startTime = new Date(),
        endTime,
        reccurenceException,
        done,
      },
      callback
    ) => {
      await Todo.create({
        subject,
        description,
        isAllDay,
        location,
        reccurenceRule,
        startTimezone,
        endTimezone,
        startTime,
        endTime,
        reccurenceException,
        userId: user.id,
        done,
      });
      callback(true);
      return sendTodos();
    }
  );

  socket.on("destroy", async (id, callback) => {
    await Todo.destroy({
      where: {
        id,
        userId: user.id,
      },
    });
    callback(true);
    return sendTodos();
  });

  socket.on(
    "update",
    async (
      {
        id,
        subject,
        description,
        isAllDay,
        location,
        reccurenceRule,
        startTimezone,
        endTimezone,
        startTime = new Date(),
        endTime,
        reccurenceException,
        done,
      },
      callback
    ) => {
      await Todo.update(
        {
          subject,
          description,
          isAllDay,
          location,
          reccurenceRule,
          startTimezone,
          endTimezone,
          startTime,
          endTime,
          reccurenceException,
          done,
        },
        {
          where: {
            id,
            userId: user.id,
          },
        }
      );
      callback(true);
      return sendTodos();
    }
  );
});

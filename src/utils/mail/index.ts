import nodemailer from "nodemailer";
import dayjs from "dayjs";
import fs from "fs";
import Todo from "../../models/Todo";
import { success, error } from "../logging";

export default function (
  todos: Todo[],
  email: string,
  voornaam: string,
  onderwerp: string,
  tekst: string
) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_EMAIL,
      pass: process.env.GMAIL_PASSWORD,
    },
  });

  const todoHTML = todos
    .map(
      (todo) =>
        `<li>
		${todo.subject}
		 - 
		${dayjs(todo.startTime).format("DD/MM/YYYY HH:mm")};
		</li>`
    )
    .join("");

  const html = fs
    .readFileSync("./template.html")
    .toString()
    .replace("${voornaam}", voornaam)
    .replace("${tekst}", tekst)
    .replace("${todoHTML}", todoHTML);

  transporter.sendMail(
    {
      from: "Toodl Notificaties <toodl@yendric.be>",
      replyTo: "Toodl Notificaties <toodl@yendric.be>",
      to: email,
      subject: "Toodl - " + onderwerp,
      text: "Dit bericht bevat info over todos, bekijk de HTML versie voor meer info.",
      html,
    },
    function (err, info) {
      if (err) {
        error("Fout bij het versturen van e-mail:" + err);
      } else {
        success("Email verzonden: " + info.response);
      }
    }
  );
}

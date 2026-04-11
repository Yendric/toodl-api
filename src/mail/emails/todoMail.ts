import { type Todo } from "@prisma/client";
import dayjs from "dayjs";
import { sendMail } from "../index.js";

export default async function (
  todos: Todo[],
  user: { email: string } & { [x: string | number | symbol]: unknown },
  tekst: string,
  onderwerp: string,
) {
  const todoHTML =
    "<ul>" +
    todos
      .map(
        (todo) =>
          `<li>
		${todo.subject}
		 - 
		${dayjs(todo.startTime).format("DD/MM/YYYY HH:mm")};
		</li>`,
      )
      .join("") +
    "</ul>";

  await sendMail(user.email, tekst, onderwerp, todoHTML);
}

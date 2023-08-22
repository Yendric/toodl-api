import { Todo } from "@prisma/client";
import dayjs from "dayjs";
import { sendMail } from "..";

export default function (
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

  sendMail(user.email, tekst, onderwerp, todoHTML);
}

import { type Todo, type User } from "#/generated/prisma/client.js";
import { LoggingService } from "#/services/LoggingService.js";
import { emailTemplate } from "#/services/mailTemplate.js";
import type { INotificationProvider } from "#/types/notifications.js";
import dayjs from "dayjs";
import { inject, injectable } from "inversify";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";

@injectable()
export class MailProvider implements INotificationProvider {
  private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo, SMTPTransport.Options>;

  constructor(@inject(LoggingService) private loggingService: LoggingService) {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_EMAIL,
        pass: process.env.GMAIL_PASSWORD,
      },
    });
  }

  private async sendMail(to: string, tekst: string, onderwerp: string, html: string) {
    try {
      const info = await this.transporter.sendMail({
        from: "Toodl Notificaties <toodl@yendric.be>",
        replyTo: "Toodl Notificaties <toodl@yendric.be>",
        to,
        subject: "Toodl - " + onderwerp,
        text: "Dit bericht bevat info over todos, bekijk de HTML versie voor meer info.",
        html: emailTemplate.replaceAll("{onderwerp}", onderwerp).replace("{text}", tekst).replace("{html}", html),
      });
      this.loggingService.success("Email sent: " + info.response);
    } catch (err) {
      this.loggingService.error("Error sending email: " + String(err));
      throw err;
    }
  }

  private generateTodoHTML(todos: Todo[]): string {
    return (
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
      "</ul>"
    );
  }

  public async sendDaily(user: User, todos: Todo[]): Promise<void> {
    const html = this.generateTodoHTML(todos);
    await this.sendMail(
      user.email,
      "morgen heeft u de volgende todo's gepland, vergeet ze niet:",
      "Todo's voor morgen",
      html,
    );
  }

  public async sendReminder(user: User, todo: Todo): Promise<void> {
    const html = this.generateTodoHTML([todo]);
    await this.sendMail(
      user.email,
      "over een kwartier heeft u de volgende todo gepland, vergeet ze niet:",
      "Todo over een kwartier",
      html,
    );
  }

  public async sendNow(user: User, todo: Todo): Promise<void> {
    const html = this.generateTodoHTML([todo]);
    await this.sendMail(
      user.email,
      "op dit moment heeft u de volgende todo gepland, vergeet ze niet:",
      "U heeft een todo gepland",
      html,
    );
  }
}

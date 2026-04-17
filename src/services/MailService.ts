import { type Todo } from "#/generated/prisma/client.js";
import dayjs from "dayjs";
import { inject, injectable } from "inversify";
import nodemailer from "nodemailer";
import { LoggingService } from "./LoggingService.js";
import { emailTemplate } from "./mailTemplate.js";

export interface IMailService {
  sendWelcomeMail(user: { email: string; username: string } & { [x: string | number | symbol]: unknown }): Promise<void>;
  sendRemovalMail(user: { email: string; username: string } & { [x: string | number | symbol]: unknown }): Promise<void>;
  sendTodoMail(
    todos: Todo[],
    user: { email: string } & { [x: string | number | symbol]: unknown },
    tekst: string,
    onderwerp: string,
  ): Promise<void>;
}

@injectable()
export class MailService implements IMailService {
  private transporter: nodemailer.Transporter;

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
      this.loggingService.success("Email verzonden: " + info.response);
    } catch (err) {
      this.loggingService.error("Fout bij het versturen van e-mail: " + String(err));
    }
  }

  public async sendWelcomeMail(user: { email: string; username: string } & { [x: string | number | symbol]: unknown }) {
    await this.sendMail(
      user.email,
      "",
      "Welkom bij Toodl",
      `Beste ${user.username},<br/><br/>
Welkom bij Toodl! We zijn blij dat je hebt gekozen voor onze app om je taken te beheren en je productiviteit te verhogen.<br/><br/>

Met Toodl kun je gemakkelijk taken aanmaken, prioriteiten instellen en deadlines bijhouden. We zijn er om je te helpen georganiseerd te blijven en je doelen te bereiken.<br/><br/>

Begin meteen: https://toodl.yendric.be/<br/><br/>

Als je vragen hebt over het account of als je merkt dat dit account niet door jou is aangemaakt, aarzel dan niet om contact met ons op te nemen. We zijn er om te helpen.<br/><br/>

Met vriendelijke groeten,<br/>
Het Toodl-team`,
    );
  }

  public async sendRemovalMail(user: { email: string; username: string } & { [x: string | number | symbol]: unknown }) {
    await this.sendMail(
      user.email,
      "",
      "Account verwijderd",
      `Beste ${user.username},<br/><br/>

    Het spijt ons te horen dat je hebt besloten om je Toodl-account te verwijderen. We waarderen de tijd die je hebt doorgebracht met ons en hopen dat Toodl je heeft geholpen bij het organiseren van je taken en het bereiken van je doelen.<br/><br/>

    Als je ooit besluit om terug te komen of als je nog vragen hebt, aarzel dan niet om contact met ons op te nemen. Jouw feedback is waardevol voor ons en helpt ons Toodl te blijven verbeteren.<br/><br/>
    
    Bedankt voor je vertrouwen in Toodl. We wensen je het allerbeste in alles wat je doet.<br/><br/>

    Met vriendelijke groeten,<br/>
    Het Toodl-team`,
    );
  }

  public async sendTodoMail(
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

    await this.sendMail(user.email, tekst, onderwerp, todoHTML);
  }
}

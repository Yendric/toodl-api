import { emailTemplate } from "@/mail/template";
import { error, success } from "@/utils/logging";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
});

export function sendMail(to: string, tekst: string, onderwerp: string, html: string) {
  return transporter.sendMail(
    {
      from: "Toodl Notificaties <toodl@yendric.be>",
      replyTo: "Toodl Notificaties <toodl@yendric.be>",
      to,
      subject: "Toodl - " + onderwerp,
      text: "Dit bericht bevat info over todos, bekijk de HTML versie voor meer info.",
      html: emailTemplate.replaceAll("{onderwerp}", onderwerp).replace("{text}", tekst).replace("{html}", html),
    },
    function (err, info) {
      if (err) {
        error("Fout bij het versturen van e-mail:" + err);
      } else {
        success("Email verzonden: " + info.response);
      }
    },
  );
}

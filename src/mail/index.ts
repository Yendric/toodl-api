import { emailTemplate } from "#/mail/template.js";
import { error, success } from "#/utils/logging.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD,
  },
});

export async function sendMail(to: string, tekst: string, onderwerp: string, html: string) {
  try {
    const info = await transporter.sendMail({
      from: "Toodl Notificaties <toodl@yendric.be>",
      replyTo: "Toodl Notificaties <toodl@yendric.be>",
      to,
      subject: "Toodl - " + onderwerp,
      text: "Dit bericht bevat info over todos, bekijk de HTML versie voor meer info.",
      html: emailTemplate.replaceAll("{onderwerp}", onderwerp).replace("{text}", tekst).replace("{html}", html),
    });
    success("Email verzonden: " + info.response);
  } catch (err) {
    error("Fout bij het versturen van e-mail: " + String(err));
  }
}

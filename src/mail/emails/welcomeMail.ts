import { sendMail } from "..";

export default function (user: { email: string } & { [x: string | number | symbol]: unknown }) {
  sendMail(
    user.email,
    "",
    "Welkom bij Toodl",
    `Beste ${user.username},<br/><br/>
Welkom bij Toodl! We zijn blij dat je hebt gekozen voor onze app om je taken te beheren en je productiviteit te verhogen.<br/><br/>

Met Toodl kun je gemakkelijk taken aanmaken, prioriteiten instellen en deadlines bijhouden. We zijn er om je te helpen georganiseerd te blijven en je doelen te bereiken.<br/><br/>

Begin meteen: https://toodl.yendric.be/<br/><br/>

Als je vragen hebt over het account of als je merkt dat dit account niet door jou is aangemaakt, aarzel dan niet om contact met ons op te nemen. We zijn er om te helpen.<br/><br/>

Met vriendelijke groeten,<br/>
Het Toodl-team`
  );
}

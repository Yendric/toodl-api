import { sendMail } from "..";

export default function (user: { email: string } & { [x: string | number | symbol]: unknown }) {
  sendMail(
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

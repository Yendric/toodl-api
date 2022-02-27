import { Request, Response } from "express";
import { isEmail } from "../utils/string";
import bcrypt from "bcryptjs";

export async function info(req: Request, res: Response) {
  if (!req.session.user)
    return res.status(404).json({ message: "Gebruiker niet gevonden." });

  res.status(200).json({
    email: req.session.user.email,
    username: req.session.user.username,
  });
}

export async function update(req: Request, res: Response) {
  if (!req.session.user)
    return res.status(404).json({ message: "Gebruiker niet gevonden." });

  const { email, username } = req.body;
  if (!(email && username))
    return res.status(400).json({ message: "Geef alle gegevens mee." });

  if (!isEmail(email))
    return res
      .status(400)
      .json({ message: "Geef een geldig-email adres mee." });
  if (username.length < 2 || username.length > 30)
    return res
      .status(400)
      .json({ message: "Geef een geldige gebruikersnaam mee." });

  await req.session.user.update({
    email,
    username,
  });

  res.status(204).json({ message: "Gebruiker succesvol geüpdated." });
}

export async function updatePassword(req: Request, res: Response) {
  if (!req.session.user)
    return res.status(404).json({ message: "Gebruiker niet gevonden." });

  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (!(oldPassword && newPassword && confirmPassword))
    return res.status(400).json({ message: "Geef alle gegevens mee." });

  if (
    (await bcrypt.compare(oldPassword, req.session.user.password)) &&
    newPassword === confirmPassword
  ) {
    req.session.user.password = oldPassword;
    req.session.user.save();
    res.status(204).json({ message: "Gebruiker succesvol geüpdated." });
  } else {
    return res.status(400).json({ message: "Geef je juiste wachtwoord mee." });
  }
}

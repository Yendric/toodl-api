import { Request, Response } from "express";
import { isEmail } from "../utils/string";
import bcrypt from "bcryptjs";

export async function info(req: Request, res: Response) {
  if (!req.session.user) return res.status(404).json({ message: "Gebruiker niet gevonden." });

  res.status(200).json({
    email: req.session.user.email,
    username: req.session.user.username,
    onlyLinked: !req.session.user.password,
    dailyNotification: req.session.user.dailyNotification,
    reminderNotification: req.session.user.reminderNotification,
    nowNotification: req.session.user.nowNotification,
    smartschoolCourseExport: req.session.user.smartschoolCourseExport,
    smartschoolTaskExport: req.session.user.smartschoolTaskExport,
  });
}

export async function update(req: Request, res: Response) {
  if (!req.session.user) return res.status(404).json({ message: "Gebruiker niet gevonden." });

  const { email, username, smartschoolCourseExport, smartschoolTaskExport } = req.body;

  if (!email && !username && !smartschoolCourseExport && !smartschoolTaskExport)
    return res.status(400).json({ message: "Geef iets mee om aan te passen." });

  if (!isEmail(email)) return res.status(400).json({ message: "Geef een geldig e-mail adres mee." });
  if (username.length < 2 || username.length > 30)
    return res.status(400).json({ message: "Geef een geldige gebruikersnaam mee." });
  if (
    !(
      smartschoolCourseExport.length > 80 &&
      smartschoolCourseExport.length < 90 &&
      smartschoolCourseExport.includes("smartschool.be")
    )
  )
    return res.status(400).json({ message: "Geef een geldige smartschool lesonderwerpenlink mee." });
  if (
    !(
      smartschoolTaskExport.length > 80 &&
      smartschoolTaskExport.length < 90 &&
      smartschoolTaskExport.includes("smartschool.be")
    )
  )
    return res.status(400).json({ message: "Geef een geldige smartschool takenlink mee." });

  await req.session.user.update({
    email: email ?? req.session.user.email,
    username: username ?? req.session.user.username,
    smartschoolCourseExport: smartschoolCourseExport ?? req.session.user.smartschoolCourseExport,
    smartschoolTaskExport: smartschoolTaskExport ?? req.session.user.smartschoolTaskExport,
  });

  return res.status(204).json({ message: "Gebruiker succesvol geüpdated." });
}

export async function updatePassword(req: Request, res: Response) {
  if (!req.session.user) return res.status(404).json({ message: "Gebruiker niet gevonden." });

  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!req.session.user.password) {
    if (!newPassword || !confirmPassword) return res.status(400).json({ message: "Geef alle gegevens mee." });
    if (newPassword != confirmPassword) return res.status(400).json({ message: "Wachtwoorden komen niet overeen" });

    req.session.user.password = await bcrypt.hash(newPassword, 10);
    req.session.user.save();
    return res.status(204).json({ message: "Gebruiker succesvol geüpdated." });
  } else {
    if (!oldPassword || !newPassword || !confirmPassword)
      return res.status(400).json({ message: "Geef alle gegevens mee." });

    if (!(await bcrypt.compare(oldPassword, req.session.user.password)) || newPassword != confirmPassword)
      return res.status(400).json({ message: "Geef je juiste wachtwoord mee." });

    req.session.user.password = await bcrypt.hash(newPassword, 10);
    req.session.user.save();
    return res.status(204).json({ message: "Gebruiker succesvol geüpdated." });
  }
}

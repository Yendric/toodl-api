import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { body, matchedData } from "express-validator";
import validate from "../middleware/validation";

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

export const update = [
  body("email").isEmail().normalizeEmail(),
  body("username").isString().isLength({ min: 1, max: 30 }),
  body(["smartschoolCourseExport", "smartschoolTaskExport"])
    .optional({ nullable: true })
    .isURL()
    .isLength({ min: 80, max: 90 })
    .contains("smartschool.be"),
  body(["dailyNotification", "reminderNotification", "nowNotification"]).isBoolean(),
  validate,
  async function (req: Request, res: Response) {
    if (!req.session.user) return res.status(404).json({ message: "Gebruiker niet gevonden." });

    await req.session.user.update(matchedData(req));

    return res.status(200).json({ message: "Gebruiker succesvol geüpdatet." });
  },
];

export async function destroy(req: Request, res: Response) {
  if (!req.session.user) return res.status(404).json({ message: "Gebruiker niet gevonden." });

  await req.session.user.destroy();
  return req.session.destroy(() => {
    return res.status(200).json({ message: "Gebruiker succesvol verwijderd." });
  });
}

export const updatePassword = [
  body(["newPassword", "confirmPassword"]).isLength({ min: 8, max: 50 }),
  body("oldPassword").optional().isLength({ min: 8, max: 50 }),
  validate,
  async function (req: Request, res: Response) {
    if (!req.session.user) return res.status(404).json({ message: "Gebruiker niet gevonden." });

    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!req.session.user.password) {
      if (!newPassword || !confirmPassword) return res.status(400).json({ message: "Geef alle gegevens mee." });
      if (newPassword != confirmPassword) return res.status(400).json({ message: "Wachtwoorden komen niet overeen" });

      req.session.user.password = await bcrypt.hash(newPassword, 10);
      req.session.user.save();
      return res.status(200).json({ message: "Gebruiker succesvol geüpdatet." });
    } else {
      if (newPassword != confirmPassword) return res.status(400).json({ message: "Wachtwoordbevestiging incorrect." });
      if (!(await bcrypt.compare(oldPassword, req.session.user.password)) || newPassword != confirmPassword)
        return res.status(400).json({ message: "Geef je juiste wachtwoord mee." });

      req.session.user.password = await bcrypt.hash(newPassword, 10);
      req.session.user.save();
      return res.status(200).json({ message: "Gebruiker succesvol geüpdatet." });
    }
  },
];

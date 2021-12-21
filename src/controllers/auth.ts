import { getUserByEmail } from '../utils/database';
import bcrypt from 'bcryptjs';
import Users from '../models/User';
import { OAuth2Client } from 'google-auth-library';
import { Request, Response } from 'express';
import { error } from '../utils/logging';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function login(req:Request, res:Response) {
    const { email, password } = req.body;

    if(!(email && password)) return res.status(400).json({ message:'Email, wachtwoord vereist.' });

    const user = await getUserByEmail(email);
    if(user && (await bcrypt.compare(password, user.password))) {
        req.session.loggedIn = true;
        req.session.userId = user.id;

        return res.status(200).json({ message: 'Succesvol ingelogd.' });
    }
    return res.status(400).json({ message: 'Incorrecte gegevens.' });
}

export async function register(req:Request, res:Response) {
    const { username, email, password } = req.body;

    if(!(email && password && username)) return res.status(400).json({ message: 'Email, naam én wachtwoord vereist.' });

    const oldUser = await getUserByEmail(email);
    if(oldUser) return res.status(409).json({ message:'Email is reeds geregistreerd.' });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await Users.create({
        username,
        email: email.toLowerCase(),
        password: passwordHash,
    });

    req.session.loggedIn = true;
    req.session.userId = user.id;

    return res.status(201).json({ message: 'Succesvol geregistreerd.' });
}

export async function logout(req:Request, res:Response) {
    return req.session.destroy((err) => {
        if(err) {
            error('Fout bij uitloggen: ' + err);
            return res.status(500).json({ message: 'Er ging iets fout bij het uitloggen.' });
        }
        return res.status(200).json({ message: 'Succesvol uitgelogd.' });
    });
}

export async function google(req:Request, res:Response) {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!(payload?.email && payload.name)) return res.status(500).json({ message: 'Er is iets foutgegaan.' });

    let user = await getUserByEmail(payload.email);
    if(!user) user = await Users.create({ email: payload.email, username: payload.name });

    req.session.loggedIn = true;
    req.session.userId = user.id;

    res.status(201).json({ message:'Google login/register succesvol.' });
}
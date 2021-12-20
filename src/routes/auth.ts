import * as AuthController from '../controllers/auth';
import userdata from './user';
import { Router } from 'express';
import isLoggedIn from '../middleware/auth';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/logout', AuthController.logout);
router.post('/google', AuthController.google);

router.use('/user_data', isLoggedIn, userdata);

export default router;
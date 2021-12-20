import { Router } from 'express';
import * as UserController from '../controllers/user';

const router = Router();

router.get('/', UserController.info);
router.post('/', UserController.update);
router.post('/update_password', UserController.updatePassword);

export default router;
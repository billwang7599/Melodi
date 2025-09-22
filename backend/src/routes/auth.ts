import { Router } from 'express';
import { getAllUsers, login, register } from '../controllers/authController';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/users', getAllUsers);

export default router;

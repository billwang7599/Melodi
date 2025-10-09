import { Router } from 'express';
import { getAllUsers, getUserProfile, syncUser } from '../controllers/authController';

const router = Router();

router.post('/sync', syncUser);
router.get('/users', getAllUsers);
router.get('/user/:userId', getUserProfile);

export default router;

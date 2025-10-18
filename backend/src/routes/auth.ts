import { Router } from 'express';
import { getAllUsers, getUserProfile, syncUser, updateUserProfile } from '../controllers/authController';

const router = Router();

router.post('/sync', syncUser);
router.get('/users', getAllUsers);
router.get('/user/:userId', getUserProfile);
router.put('/user/:userId', updateUserProfile);

export default router;

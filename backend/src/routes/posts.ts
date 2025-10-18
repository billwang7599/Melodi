import { Router } from 'express';
import { createPost, getAllPosts, getPostsByUserId } from '../controllers/postsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Create a new post (protected route - requires authentication)
router.post('/', authenticateToken, createPost);

// Get posts for a specific user
router.get('/user/:userId', getPostsByUserId);

// Get all public posts (for feed functionality)
router.get('/', getAllPosts);

export default router;
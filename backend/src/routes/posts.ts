import { Router } from 'express';
import { createPost, getAllPosts, getPostsByUserId, toggleLike } from '../controllers/postsController';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth';

const router = Router();

// Create a new post (protected route - requires authentication)
router.post('/', authenticateToken, createPost);

// Get posts for a specific user
router.get('/user/:userId', getPostsByUserId);

// Get all public posts (for feed functionality) - optionally authenticated
router.get('/', optionalAuthenticateToken, getAllPosts);

// Like or unlike a post (protected route - requires authentication)
router.post('/:postId/like', authenticateToken, toggleLike);

export default router;
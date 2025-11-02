import { Router } from 'express';
import {
    deleteComment,
    updateComment
} from '../controllers/commentsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Update a comment (protected route - requires authentication)
router.put('/comments/:commentId', authenticateToken, updateComment);

// Delete a comment (protected route - requires authentication)
router.delete('/comments/:commentId', authenticateToken, deleteComment);

export default router;

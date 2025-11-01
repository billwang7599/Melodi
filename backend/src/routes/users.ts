import { Router } from 'express';
import {
    searchUsers,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    checkFollowingStatus,
} from '../controllers/usersController';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth';

const router = Router();

// Search users (optional auth for public search)
router.get('/search', optionalAuthenticateToken, searchUsers);

// Follow/unfollow endpoints (require auth)
router.post('/:userId/follow', authenticateToken, followUser);
router.delete('/:userId/follow', authenticateToken, unfollowUser);

// Get followers/following lists (optional auth to show follow status)
router.get('/:userId/followers', optionalAuthenticateToken, getFollowers);
router.get('/:userId/following', optionalAuthenticateToken, getFollowing);

// Check if following a user (require auth)
router.get('/:userId/following-status', authenticateToken, checkFollowingStatus);

export default router;


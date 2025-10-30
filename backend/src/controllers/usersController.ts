import { Response } from 'express';
import { getDatabase } from '../db';
import { AuthRequest } from '../middleware/auth';

// Search users by username
export const searchUsers = async (req: AuthRequest, res: Response) => {
    try {
        const { query } = req.query;
        const currentUserId = req.userId;

        if (!query || typeof query !== 'string') {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const supabase = await getDatabase();

        // Search users by username (case-insensitive partial match)
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username, display_name, bio, is_public')
            .ilike('username', `%${query}%`)
            .limit(20);

        if (error) {
            throw error;
        }

        // If user is authenticated, include follow status
        if (currentUserId && users) {
            const userIds = users.map(u => u.id);

            // Get all friendship relationships involving these users
            const { data: friendships } = await supabase
                .from('friends')
                .select('user_one_id, user_two_id, status, action_user_id')
                .or(`user_one_id.in.(${userIds.join(',')}),user_two_id.in.(${userIds.join(',')})`)
                .eq('status', 'accepted');

            // Map users with follow status
            const usersWithStatus = users.map(user => {
                if (user.id === currentUserId) {
                    return { ...user, isOwnProfile: true, isFollowing: false };
                }

                // Check if current user is following this user
                const isFollowing = friendships?.some(
                    f => f.user_one_id === currentUserId && f.user_two_id === user.id
                ) || false;

                return { ...user, isOwnProfile: false, isFollowing };
            });

            return res.status(200).json({ users: usersWithStatus });
        }

        // Not authenticated - return without follow status
        const usersWithoutStatus = users?.map(user => ({
            ...user,
            isOwnProfile: false,
            isFollowing: false,
        }));

        res.status(200).json({ users: usersWithoutStatus });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Follow a user
export const followUser = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.userId;

        if (!currentUserId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        if (currentUserId === userId) {
            return res.status(400).json({ message: 'Cannot follow yourself' });
        }

        const supabase = await getDatabase();

        // Check if target user exists
        const { data: targetUser, error: userError } = await supabase
            .from('users')
            .select('id, is_public')
            .eq('id', userId)
            .single();

        if (userError || !targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // user_one_id is the follower, user_two_id is the followed user
        const userOneId = currentUserId;
        const userTwoId = userId;

        // Check if friendship already exists
        const { data: existingFriendship, error: checkError } = await supabase
            .from('friends')
            .select('*')
            .eq('user_one_id', userOneId)
            .eq('user_two_id', userTwoId)
            .maybeSingle();

        if (checkError) {
            throw checkError;
        }

        if (existingFriendship) {
            // Update existing friendship
            if (existingFriendship.status === 'accepted') {
                return res.status(400).json({ message: 'Already following this user' });
            }

            // Update to accepted
            const { data: updatedFriendship, error: updateError } = await supabase
                .from('friends')
                .update({
                    status: 'accepted',
                    action_user_id: currentUserId,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_one_id', userOneId)
                .eq('user_two_id', userTwoId)
                .select()
                .single();

            if (updateError) {
                throw updateError;
            }

            return res.status(200).json({
                message: 'Now following user',
                friendship: updatedFriendship,
            });
        }

        // Create new friendship
        const now = new Date().toISOString();
        const { data: newFriendship, error: insertError } = await supabase
            .from('friends')
            .insert([
                {
                    user_one_id: userOneId,
                    user_two_id: userTwoId,
                    action_user_id: currentUserId,
                    status: 'accepted',
                    created_at: now,
                    updated_at: now,
                },
            ])
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        res.status(201).json({
            message: 'Now following user',
            friendship: newFriendship,
        });
    } catch (error) {
        console.error('Follow user error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ 
            message: 'Server error', 
            error: errorMessage,
            details: error instanceof Error ? error.stack : undefined
        });
    }
};

// Unfollow a user
export const unfollowUser = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.userId;

        if (!currentUserId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        if (currentUserId === userId) {
            return res.status(400).json({ message: 'Cannot unfollow yourself' });
        }

        const supabase = await getDatabase();

        // user_one_id is the follower, user_two_id is the followed user
        const userOneId = currentUserId;
        const userTwoId = userId;

        // Delete friendship
        const { error } = await supabase
            .from('friends')
            .delete()
            .eq('user_one_id', userOneId)
            .eq('user_two_id', userTwoId)
            .eq('status', 'accepted');

        if (error) {
            throw error;
        }

        res.status(200).json({ message: 'Unfollowed user successfully' });
    } catch (error) {
        console.error('Unfollow user error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ 
            message: 'Server error', 
            error: errorMessage,
            details: error instanceof Error ? error.stack : undefined
        });
    }
};

// Get followers list
export const getFollowers = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const supabase = await getDatabase();

        // Get all users who follow this user (where user_two_id = userId)
        const { data: friendships, error: friendshipError } = await supabase
            .from('friends')
            .select('user_one_id, user_two_id')
            .eq('user_two_id', userId)
            .eq('status', 'accepted');

        if (friendshipError) {
            throw friendshipError;
        }

        if (!friendships || friendships.length === 0) {
            return res.status(200).json({ followers: [] });
        }

        // Get user details for followers
        const followerIds = friendships.map(f => f.user_one_id);
        const { data: followers, error: usersError } = await supabase
            .from('users')
            .select('id, username, display_name, bio, is_public')
            .in('id', followerIds);

        if (usersError) {
            throw usersError;
        }

        // If current user is authenticated, add follow status
        if (currentUserId && followers) {
            const followerUserIds = followers.map(f => f.id);

            // Get friendships where current user follows any of these followers
            const { data: currentUserFriendships } = await supabase
                .from('friends')
                .select('user_one_id, user_two_id')
                .eq('user_one_id', currentUserId)
                .in('user_two_id', followerUserIds)
                .eq('status', 'accepted');

            const followersWithStatus = followers.map(follower => {
                const isFollowing = currentUserFriendships?.some(
                    f => f.user_two_id === follower.id
                ) || false;

                return {
                    ...follower,
                    isOwnProfile: follower.id === currentUserId,
                    isFollowing,
                };
            });

            return res.status(200).json({ followers: followersWithStatus });
        }

        // Not authenticated - return without follow status
        const followersWithoutStatus = followers?.map(follower => ({
            ...follower,
            isOwnProfile: false,
            isFollowing: false,
        }));

        res.status(200).json({ followers: followersWithoutStatus });
    } catch (error) {
        console.error('Get followers error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Get following list
export const getFollowing = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.userId;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const supabase = await getDatabase();

        // Get all users this user follows (where user_one_id = userId)
        const { data: friendships, error: friendshipError } = await supabase
            .from('friends')
            .select('user_one_id, user_two_id')
            .eq('user_one_id', userId)
            .eq('status', 'accepted');

        if (friendshipError) {
            throw friendshipError;
        }

        if (!friendships || friendships.length === 0) {
            return res.status(200).json({ following: [] });
        }

        // Get user details for following
        const followingIds = friendships.map(f => f.user_two_id);
        const { data: following, error: usersError } = await supabase
            .from('users')
            .select('id, username, display_name, bio, is_public')
            .in('id', followingIds);

        if (usersError) {
            throw usersError;
        }

        // If current user is authenticated, add follow status
        if (currentUserId && following) {
            const followingUserIds = following.map(f => f.id);

            // Get friendships where current user follows any of these users
            const { data: currentUserFriendships } = await supabase
                .from('friends')
                .select('user_one_id, user_two_id')
                .eq('user_one_id', currentUserId)
                .in('user_two_id', followingUserIds)
                .eq('status', 'accepted');

            const followingWithStatus = following.map(user => {
                const isFollowing = currentUserFriendships?.some(
                    f => f.user_two_id === user.id
                ) || false;

                return {
                    ...user,
                    isOwnProfile: user.id === currentUserId,
                    isFollowing,
                };
            });

            return res.status(200).json({ following: followingWithStatus });
        }

        // Not authenticated - return without follow status
        const followingWithoutStatus = following?.map(user => ({
            ...user,
            isOwnProfile: false,
            isFollowing: false,
        }));

        res.status(200).json({ following: followingWithoutStatus });
    } catch (error) {
        console.error('Get following error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

// Check if current user is following a specific user
export const checkFollowingStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.userId;

        if (!currentUserId) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const supabase = await getDatabase();

        // Check if current user follows target user (currentUserId is user_one_id, userId is user_two_id)
        const { data: friendship, error: checkError } = await supabase
            .from('friends')
            .select('status')
            .eq('user_one_id', currentUserId)
            .eq('user_two_id', userId)
            .eq('status', 'accepted')
            .maybeSingle();

        if (checkError) {
            throw checkError;
        }

        const isFollowing = !!friendship;

        res.status(200).json({ isFollowing });
    } catch (error) {
        console.error('Check following status error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};


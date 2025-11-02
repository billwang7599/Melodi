import { Response } from 'express';
import { getDatabase } from '../db';
import { AuthRequest } from '../middleware/auth';


// Delete a comment (only the comment author can delete)
export const deleteComment = async (req: AuthRequest, res: Response) => {
    try {
        const { commentId } = req.params;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ 
                message: 'Authentication required' 
            });
        }

        if (!commentId) {
            return res.status(400).json({ 
                message: 'Comment ID is required' 
            });
        }

        const supabase = await getDatabase();

        // Verify comment exists and belongs to the user
        const { data: comment } = await supabase
            .from('comments')
            .select('id, user_id')
            .eq('id', commentId)
            .single();

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.user_id !== userId) {
            return res.status(403).json({ 
                message: 'You are not authorized to delete this comment' 
            });
        }

        // Delete the comment
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId);

        if (error) {
            console.error('Error deleting comment:', error);
            return res.status(500).json({ 
                message: 'Failed to delete comment',
                error: error.message 
            });
        }

        return res.status(200).json({
            message: 'Comment deleted successfully'
        });

    } catch (error) {
        console.error('Error in deleteComment:', error);
        return res.status(500).json({ 
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Update a comment (only the comment author can update)
export const updateComment = async (req: AuthRequest, res: Response) => {
    try {
        const { commentId } = req.params;
        const { body } = req.body;
        const userId = req.userId;

        if (!userId) {
            return res.status(401).json({ 
                message: 'Authentication required' 
            });
        }

        if (!commentId) {
            return res.status(400).json({ 
                message: 'Comment ID is required' 
            });
        }

        if (!body || body.trim() === '') {
            return res.status(400).json({ 
                message: 'Comment body is required' 
            });
        }

        const supabase = await getDatabase();

        // Verify comment exists and belongs to the user
        const { data: comment } = await supabase
            .from('comments')
            .select('id, user_id')
            .eq('id', commentId)
            .single();

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.user_id !== userId) {
            return res.status(403).json({ 
                message: 'You are not authorized to update this comment' 
            });
        }

        // Update the comment
        const { data: updatedComment, error } = await supabase
            .from('comments')
            .update({ body: body.trim() })
            .eq('id', commentId)
            .select(`
                id,
                created_at,
                post_id,
                body,
                user_id,
                users (
                    id,
                    display_name,
                    username
                )
            `)
            .single();

        if (error) {
            console.error('Error updating comment:', error);
            return res.status(500).json({ 
                message: 'Failed to update comment',
                error: error.message 
            });
        }

        return res.status(200).json({
            message: 'Comment updated successfully',
            comment: updatedComment
        });

    } catch (error) {
        console.error('Error in updateComment:', error);
        return res.status(500).json({ 
            message: 'Internal server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

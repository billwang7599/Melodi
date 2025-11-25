import { Request, Response } from "express";
import { getDatabase } from "../db";
import { AuthRequest } from "../middleware/auth";
import { createOrGetSong } from "./songsController";

// Create a new post
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { content, spotifyId, albumId, albumRankings, visibility = "public" } = req.body;
    const userId = req.userId; // Get user ID from authenticated request

    // Validate required fields
    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Must have either spotifyId (for single song) or albumId (for album ranking)
    if (!spotifyId && !albumId) {
      return res.status(400).json({
        message: "Either Spotify ID (for song) or Album ID (for album ranking) is required",
      });
    }

    const supabase = await getDatabase();

    // Verify user exists
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let topSongId: bigint | null = null;
    let postAlbumId: string | null = null;

    // Handle single song post
    if (spotifyId) {
      const song = await createOrGetSong(spotifyId, supabase);
      topSongId = song.song_id;
    }

    // Handle album ranking post
    if (albumId) {
      postAlbumId = albumId;
      
      // Validate album rankings
      if (!albumRankings || !Array.isArray(albumRankings) || albumRankings.length === 0) {
        return res.status(400).json({
          message: "Album rankings are required when posting an album",
        });
      }

      // Ensure we have a top song from the rankings (use rank 1)
      const topRankedSong = albumRankings.find((r: any) => r.rank === 1);
      if (topRankedSong) {
        const song = await createOrGetSong(topRankedSong.spotifyId, supabase);
        topSongId = song.song_id;
      }
    }

    // Create the post
    const { data: newPost, error } = await supabase
      .from("posts")
      .insert([
        {
          user_id: userId,
          content,
          top_song_id: topSongId,
          album_id: postAlbumId,
          visibility,
          like_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select(
        `
                post_id,
                user_id,
                content,
                top_song_id,
                album_id,
                like_count,
                visibility,
                created_at,
                updated_at,
                users:user_id (
                    id,
                    username,
                    display_name
                ),
                songs:top_song_id (
                    song_id,
                    spotify_id,
                    song_name,
                    artist_name,
                    album_name,
                    cover_art_url
                )
            `
      )
      .single();

    if (error) {
      console.error("Error creating post:", error);
      throw error;
    }

    // Create album rankings if provided
    if (albumRankings && albumRankings.length > 0 && newPost.post_id) {
      const rankingInserts = albumRankings.map((ranking: any) => ({
        post_id: newPost.post_id,
        spotify_id: ranking.spotifyId,
        rank: ranking.rank,
        created_at: new Date().toISOString(),
      }));

      const { error: rankingError } = await supabase
        .from("album_rankings")
        .insert(rankingInserts);

      if (rankingError) {
        console.error("Error creating album rankings:", rankingError);
        // Don't fail the post creation, but log the error
      }
    }

    // Fetch the post with album rankings if it's an album post
    let postWithRankings: any = newPost;
    if (postAlbumId) {
      const { data: rankings } = await supabase
        .from("album_rankings")
        .select("*")
        .eq("post_id", newPost.post_id)
        .order("rank", { ascending: true });

      postWithRankings = {
        ...newPost,
        albumRankings: rankings || [],
      };
    }

    res.status(201).json({
      message: "Post created successfully",
      post: postWithRankings,
    });
  } catch (error) {
    console.error("Error in createPost:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get posts for a specific user
export const getPostsByUserId = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const supabase = await getDatabase();

    // Verify user exists
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get posts for the user with related data
    const {
      data: posts,
      error,
      count,
    } = await supabase
      .from("posts")
      .select(
        `
                post_id,
                user_id,
                content,
                top_song_id,
                album_id,
                like_count,
                visibility,
                created_at,
                updated_at,
                users:user_id (
                    id,
                    username,
                    display_name
                ),
                songs:top_song_id (
                    song_id,
                    spotify_id,
                    song_name,
                    artist_name,
                    album_name,
                    cover_art_url
                )
            `,
        { count: "exact" }
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }

    // Fetch album rankings for posts that have album_id
    const postsWithRankings = await Promise.all(
      (posts || []).map(async (post: any) => {
        if (post.album_id) {
          const { data: rankings } = await supabase
            .from("album_rankings")
            .select("*")
            .eq("post_id", post.post_id)
            .order("rank", { ascending: true });
          return { ...post, albumRankings: rankings || [] };
        }
        return post;
      })
    );

    res.status(200).json({
      message: "Posts retrieved successfully",
      posts: postsWithRankings,
      pagination: {
        total: count || 0,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: (count || 0) > Number(offset) + Number(limit),
      },
    });
  } catch (error) {
    console.error("Error in getPostsByUserId:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get all posts (for feed functionality - bonus)
export const getAllPosts = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 20, offset = 0, visibility = "public", following = "false" } = req.query;
    const userId = req.userId; // Optional user ID for like status

    const supabase = await getDatabase();

    // If filtering by following, get the list of users the current user follows
    let followingUserIds: string[] = [];
    if (following === "true" && userId) {
      const { data: friendships } = await supabase
        .from("friends")
        .select("user_two_id")
        .eq("user_one_id", userId)
        .eq("status", "accepted");

      followingUserIds = friendships?.map((f) => f.user_two_id) || [];

      // If user follows no one, return empty array
      if (followingUserIds.length === 0) {
        return res.status(200).json({
          message: "Posts retrieved successfully",
          posts: [],
          pagination: {
            total: 0,
            limit: Number(limit),
            offset: Number(offset),
            hasMore: false,
          },
        });
      }
    }

    // Get all posts with related data
    let query = supabase
      .from("posts")
      .select(
        `
                post_id,
                user_id,
                content,
                top_song_id,
                album_id,
                like_count,
                visibility,
                created_at,
                updated_at,
                users:user_id (
                    id,
                    username,
                    display_name
                ),
                songs:top_song_id (
                    song_id,
                    spotify_id,
                    song_name,
                    artist_name,
                    album_name,
                    cover_art_url
                ),
                likes!left (
                    user_id
                )
            `,
        { count: "exact" }
      )
      .eq("visibility", visibility);

    // Filter by following users if requested
    if (following === "true" && followingUserIds.length > 0) {
      query = query.in("user_id", followingUserIds);
    }

    const {
      data: posts,
      error,
      count,
    } = await query
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      console.error("Error fetching all posts:", error);
      throw error;
    }

    // Fetch album rankings for posts that have album_id
    const postsWithRankings = await Promise.all(
      (posts || []).map(async (post: any) => {
        let albumRankings = [];
        if (post.album_id) {
          const { data: rankings } = await supabase
            .from("album_rankings")
            .select("*")
            .eq("post_id", post.post_id)
            .order("rank", { ascending: true });
          albumRankings = rankings || [];
        }
        return { ...post, albumRankings };
      })
    );

    // Process posts to add isLiked field for the current user
    const processedPosts =
      postsWithRankings?.map((post) => ({
        ...post,
        isLiked: userId
          ? post.likes?.some((like: any) => like.user_id === userId)
          : false,
      })) || [];

    res.status(200).json({
      message: "Posts retrieved successfully",
      posts: processedPosts,
      pagination: {
        total: count || 0,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: (count || 0) > Number(offset) + Number(limit),
      },
    });
  } catch (error) {
    console.error("Error in getAllPosts:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Like or unlike a post
export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId; // Get user ID from authenticated request

    // Validate required fields
    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!postId) {
      return res.status(400).json({
        message: "Post ID is required",
      });
    }

    const supabase = await getDatabase();

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("post_id, like_count")
      .eq("post_id", postId)
      .single();

    if (postError || !post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user has already liked this post
    const { data: existingLike, error: likeError } = await supabase
      .from("likes")
      .select("user_id, post_id")
      .eq("user_id", userId)
      .eq("post_id", postId)
      .single();

    if (likeError && likeError.code !== "PGRST116") {
      console.error("Error checking existing like:", likeError);
      throw likeError;
    }

    let newLikeCount = post.like_count;
    let action = "";

    if (existingLike) {
      // Unlike the post
      const { error: deleteError } = await supabase
        .from("likes")
        .delete()
        .eq("user_id", userId)
        .eq("post_id", postId);

      if (deleteError) {
        console.error("Error removing like:", deleteError);
        throw deleteError;
      }

      newLikeCount = Math.max(0, post.like_count - 1);
      action = "unliked";
    } else {
      // Like the post
      const { error: insertError } = await supabase.from("likes").insert([
        {
          user_id: userId,
          post_id: parseInt(postId),
          created_at: new Date().toISOString(),
        },
      ]);

      if (insertError) {
        console.error("Error adding like:", insertError);
        throw insertError;
      }

      newLikeCount = post.like_count + 1;
      action = "liked";
    }

    // Update the like count in the posts table
    const { error: updateError } = await supabase
      .from("posts")
      .update({
        like_count: newLikeCount,
        updated_at: new Date().toISOString(),
      })
      .eq("post_id", postId);

    if (updateError) {
      console.error("Error updating like count:", updateError);
      throw updateError;
    }

    res.status(200).json({
      message: `Post ${action} successfully`,
      likeCount: newLikeCount,
      action: action,
      isLiked: action === "liked",
    });
  } catch (error) {
    console.error("Error in toggleLike:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Create a new comment on a post
export const createComment = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const { body } = req.body;
    const userId = req.userId; // Get user ID from authenticated request

    // Validate required fields
    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!body || body.trim() === "") {
      return res.status(400).json({
        message: "Comment body is required",
      });
    }

    if (!postId) {
      return res.status(400).json({
        message: "Post ID is required",
      });
    }

    const supabase = await getDatabase();

    // Verify user exists
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify post exists
    const { data: post } = await supabase
      .from("posts")
      .select("post_id")
      .eq("post_id", postId)
      .single();

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Create the comment
    const { data: newComment, error } = await supabase
      .from("comments")
      .insert([
        {
          post_id: parseInt(postId),
          body: body.trim(),
          user_id: userId,
        },
      ])
      .select(
        `
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
            `
      )
      .single();

    if (error) {
      console.error("Error creating comment:", error);
      return res.status(500).json({
        message: "Failed to create comment",
        error: error.message,
      });
    }

    return res.status(201).json({
      message: "Comment created successfully",
      comment: newComment,
    });
  } catch (error) {
    console.error("Error in createComment:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get all comments for a specific post
export const getCommentsByPostId = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;

    if (!postId) {
      return res.status(400).json({
        message: "Post ID is required",
      });
    }

    const supabase = await getDatabase();

    // Verify post exists
    const { data: post } = await supabase
      .from("posts")
      .select("post_id")
      .eq("post_id", postId)
      .single();

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Get all comments for the post
    const { data: comments, error } = await supabase
      .from("comments")
      .select(
        `
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
            `
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return res.status(500).json({
        message: "Failed to fetch comments",
        error: error.message,
      });
    }

    return res.status(200).json({
      message: "Comments retrieved successfully",
      comments: comments || [],
    });
  } catch (error) {
    console.error("Error in getCommentsByPostId:", error);
    return res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

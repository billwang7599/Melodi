import { NextFunction, Request, Response } from 'express';
import { getDatabase } from '../db';

// Extend Express Request to include userId
export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Middleware to authenticate requests using Supabase JWT tokens
 * Extracts the user ID from the token and attaches it to the request
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Access token required',
        error: 'No authorization token provided'
      });
    }

    // For Supabase tokens, we need to verify using Supabase's JWT secret
    const supabase = await getDatabase();
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ 
        message: 'Invalid or expired token',
        error: error?.message || 'Token verification failed'
      });
    }

    // Attach the user ID to the request for use in controllers
    req.userId = user.id;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ 
      message: 'Authentication failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 * Extracts the user ID from the token if present and attaches it to the request
 */
export const optionalAuthenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      // No token provided - continue without authentication
      req.userId = undefined;
      return next();
    }

    // For Supabase tokens, we need to verify using Supabase's JWT secret
    const supabase = await getDatabase();
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      // Invalid token - continue without authentication
      req.userId = undefined;
      return next();
    }

    // Attach the user ID to the request for use in controllers
    req.userId = user.id;
    
    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    // On error, continue without authentication
    req.userId = undefined;
    next();
  }
};

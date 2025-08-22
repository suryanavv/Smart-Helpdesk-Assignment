import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/User.js';

export interface AuthPayload { userId: string; role: 'admin' | 'agent' | 'user' }

declare global {
	namespace Express {
		interface Request { auth?: AuthPayload }
	}
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
	// Try to get token from Authorization header first
	const header = req.headers.authorization || '';
	const bearer = header.startsWith('Bearer ') ? header.slice(7) : undefined;
	
	// Then try to get from cookies
	const cookieToken = (req as any).cookies?.access_token as string | undefined;
	
	// Use bearer token if available, otherwise fall back to cookie
	const token = bearer || cookieToken;
	
	if (!token) {
		// Check if we have a refresh token and try to refresh
		const refreshToken = (req as any).cookies?.refresh_token as string | undefined;
		if (refreshToken) {
			console.log('No access token, but refresh token found. Attempting to refresh...');
			try {
				const payload = jwt.verify(refreshToken, config.refreshJwtSecret) as AuthPayload;
				
				// Verify the user still exists in the database
				const userExists = await User.exists({ _id: payload.userId });
				if (!userExists) {
					console.log('User no longer exists in database:', payload.userId);
					// Clear the invalid refresh token
					res.clearCookie('refresh_token', { path: '/' });
					return res.status(401).json({ error: 'Unauthorized - User no longer exists' });
				}
				
				// Generate new access token
				const newAccessToken = jwt.sign(
					{ userId: payload.userId, role: payload.role }, 
					config.jwtSecret, 
					{ expiresIn: config.accessTokenTtlSec }
				);
				
				// Set new access token cookie
				const cookieOptions = {
					httpOnly: true, 
					sameSite: 'lax' as const, 
					secure: config.cookieSecure, 
					maxAge: config.accessTokenTtlSec * 1000, 
					path: '/'
				};
				
				// For local development, don't set domain to ensure cookies work
				if (process.env.NODE_ENV !== 'development') {
					(cookieOptions as any).domain = config.cookieDomain;
				}
				
				res.cookie('access_token', newAccessToken, cookieOptions);
				
				// Set auth payload and continue
				req.auth = payload;
				console.log('Token refreshed successfully for user:', payload.userId);
				return next();
			} catch (refreshError) {
				console.log('Token refresh failed:', refreshError);
				return res.status(401).json({ error: 'Unauthorized - Invalid refresh token' });
			}
		}
		
		// Only log when there are no tokens at all (not for every request)
		if (!refreshToken) {
			console.log('No authentication tokens found');
		}
		return res.status(401).json({ error: 'Unauthorized - No token provided' });
	}
	
	try {
		const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
		
		// Verify the user still exists in the database
		const userExists = await User.exists({ _id: payload.userId });
		if (!userExists) {
			console.log('User no longer exists in database:', payload.userId);
			// Clear the invalid tokens
			res.clearCookie('access_token', { path: '/' });
			res.clearCookie('refresh_token', { path: '/' });
			return res.status(401).json({ error: 'Unauthorized - User no longer exists' });
		}
		
		req.auth = payload;
		return next();
	} catch (error) {
		console.log('Token verification failed:', error);
		return res.status(401).json({ error: 'Unauthorized - Invalid token' });
	}
}

export function requireRole(...roles: Array<'admin'|'agent'|'user'>) {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!req.auth) return res.status(401).json({ error: 'Unauthorized' });
		if (!roles.includes(req.auth.role)) return res.status(403).json({ error: 'Forbidden' });
		return next();
	};
}



import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

const registerSchema = z.object({
	name: z.string().min(1),
	email: z.string().email(),
	password: z.string().min(6),
});

router.post('/register', async (req: any, res: any) => {
	const parsed = registerSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const { name, email, password } = parsed.data;
	const existing = await User.findOne({ email }).lean();
	if (existing) return res.status(409).json({ error: 'Email already in use' });
	const passwordHash = await bcrypt.hash(password, 10);
	const user = await User.create({ name, email, passwordHash, role: 'user' });
	const userOut = { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
	const access = jwt.sign({ userId: user._id.toString(), role: user.role }, config.jwtSecret, { expiresIn: config.accessTokenTtlSec });
	const refresh = jwt.sign({ userId: user._id.toString(), role: user.role }, config.refreshJwtSecret, { expiresIn: config.refreshTokenTtlSec });
	
	// Set cookies with proper configuration for local development
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
	
	res.cookie('access_token', access, cookieOptions);
	res.cookie('refresh_token', refresh, cookieOptions);
	return res.json({ user: userOut });
});

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(6) });

router.post('/login', async (req: any, res: any) => {
	const parsed = loginSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const { email, password } = parsed.data;
	const user = await User.findOne({ email });
	if (!user) return res.status(401).json({ error: 'Invalid credentials' });
	const ok = await bcrypt.compare(password, user.passwordHash);
	if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
	const userOut = { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
	const access = jwt.sign({ userId: user._id.toString(), role: user.role }, config.jwtSecret, { expiresIn: config.accessTokenTtlSec });
	const refresh = jwt.sign({ userId: user._id.toString(), role: user.role }, config.refreshJwtSecret, { expiresIn: config.refreshTokenTtlSec });
	
	// Set cookies with proper configuration for local development
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
	
	res.cookie('access_token', access, cookieOptions);
	res.cookie('refresh_token', refresh, cookieOptions);
	return res.json({ user: userOut });
});

router.get('/me', requireAuth, async (req: any, res: any) => {
	// Only log in development
	if (process.env.NODE_ENV === 'development') {
		console.log('Auth middleware passed, user ID:', req.auth?.userId);
	}
	
	const user = await User.findById(req.auth!.userId).lean();
	
	if (!user) {
		console.log('User not found in database for ID:', req.auth!.userId);
		return res.status(404).json({ error: 'Not found' });
	}
	
	const userOut = { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
	return res.json({ user: userOut });
});

router.post('/logout', (_req: any, res: any) => {
	// Clear both cookies with proper paths
	const clearOptions = { path: '/' };
	
	// For local development, don't set domain to ensure cookies are cleared properly
	if (process.env.NODE_ENV !== 'development') {
		(clearOptions as any).domain = config.cookieDomain;
	}
	
	res.clearCookie('access_token', clearOptions);
	res.clearCookie('refresh_token', clearOptions);
	return res.status(204).send();
});

router.post('/refresh', (req: any, res: any) => {
	const token = req.cookies?.refresh_token as string | undefined;
	if (!token) return res.status(401).json({ error: 'Unauthorized' });
	try {
		const payload = jwt.verify(token, config.refreshJwtSecret) as { userId: string; role: string };
		const access = jwt.sign({ userId: payload.userId, role: payload.role }, config.jwtSecret, { expiresIn: config.accessTokenTtlSec });
		
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
		
		res.cookie('access_token', access, cookieOptions);
		return res.json({ ok: true });
	} catch {
		return res.status(401).json({ error: 'Unauthorized' });
	}
});

export default router;



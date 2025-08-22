import 'dotenv/config';

export const config = {
	port: Number(process.env.PORT || 8080),
	mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/helpdesk',
	jwtSecret: process.env.JWT_SECRET || 'change-me',
	refreshJwtSecret: process.env.REFRESH_JWT_SECRET || process.env.JWT_SECRET || 'change-me-refresh',
	autoCloseEnabled: (process.env.AUTO_CLOSE_ENABLED || 'true').toLowerCase() === 'true',
	confidenceThreshold: Number(process.env.CONFIDENCE_THRESHOLD || 0.78),
	stubMode: (process.env.STUB_MODE || 'true').toLowerCase() === 'true',
	redisUrl: process.env.REDIS_URL || '',
	corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
	cookieDomain: process.env.COOKIE_DOMAIN || undefined,
	cookieSecure: (process.env.COOKIE_SECURE || 'false').toLowerCase() === 'true',
	accessTokenTtlSec: Number(process.env.ACCESS_TTL_SEC || 15 * 60),
	refreshTokenTtlSec: Number(process.env.REFRESH_TTL_SEC || 7 * 24 * 60 * 60),
};



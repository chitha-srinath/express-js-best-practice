import 'dotenv/config';
import { z } from 'zod';

/**
 * Environment schema with comprehensive validation using Zod.
 * Defines types, defaults, and validation rules for all environment variables.
 */
const envSchema = z.object({
  // Required core variables
  PORT: z.coerce.number().min(1).max(65535),
  DATABASE_URL: z.url(),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT access secret must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT refresh secret must be at least 16 characters'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Optional variables with defaults
  FRONTEND_URL: z.url().optional(),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // OAuth credentials (optional)
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_REDIRECT_URI: z.string().url(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Security options with defaults
  ARGON2_MEMORY_COST: z.coerce.number().default(65536),
  ARGON2_TIME_COST: z.coerce.number().default(3),
  ARGON2_PARALLELISM: z.coerce.number().default(1),

  // AWS S3 configuration (optional)
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  TOKEN_REDIRECT_URL: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
});

/**
 * Validates environment variables and exits process if validation fails.
 */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  parsed.error.issues.forEach((error) => {
    console.error(`  ${error.path.join('.')}: ${error.message}`);
  });
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;

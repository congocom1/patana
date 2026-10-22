import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  CUSTOMER_ORIGIN: z.string().url().optional(),
  OWNER_ORIGIN: z.string().url().optional(),
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  REFRESH_SECRET: z.string().min(32, 'REFRESH_SECRET must be at least 32 characters').optional(),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  PASSWORD_PEPPER: z.string().optional(),
  THROTTLE_TTL: z.coerce.number().int().positive().default(60000),
  THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
  STRIPE_API_VERSION: z.string().default('2024-12-18.acacia'),
  ADMIN_WEBHOOK_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${errors}`);
  }
  return result.data;
}
import { z } from 'zod';

/**
 * Environment configuration schema with validation
 * Uses Zod for runtime type-safety
 */
const envSchema = z.object({
  // AWS Configuration
  AWS_REGION: z.string().default('us-east-2'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),

  // DynamoDB Table Names
  DYNAMODB_PRODUCTS_TABLE: z.string().default('fixit-products'),
  DYNAMODB_SERVICE_PROFILES_TABLE: z.string().default('fixit-service-profiles'),
  DYNAMODB_SERVICE_REQUESTS_TABLE: z.string().default('fixit-service-requests'),
  DYNAMODB_CHAT_TABLE: z.string().default('fixit-chat'),
  DYNAMODB_USERS_TABLE: z.string().default('fixit-users'),

  // Gemini AI
  GEMINI_API_KEY: z.string().optional(),

  // Server
  PORT: z.string().default('3000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Validated environment configuration
 * Throws on missing required variables
 */
function loadConfig(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    console.error(result.error.format());
    throw new Error('Invalid environment configuration');
  }

  return result.data;
}

export const config = loadConfig();

/**
 * Check if running in production
 */
export const isProduction = config.NODE_ENV === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = config.NODE_ENV === 'development';

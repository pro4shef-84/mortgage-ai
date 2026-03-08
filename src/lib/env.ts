// ============================================================
// ENV VALIDATION — fail fast if required env vars are missing
// ============================================================

import { z } from 'zod'

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required').optional(),
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required').optional(),
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required').optional(),
  EMAIL_FROM: z.string().email().optional().default('noreply@mortgage-ai.com'),
  NEXT_PUBLIC_APP_URL: z.string().url().optional().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    parsed.error.issues.forEach((err) => {
      console.error(`  ${err.path.join('.')}: ${err.message}`)
    })
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment configuration')
    }
  }
  return (parsed.success ? parsed.data : (process.env as unknown as Env))
}

export const env = validateEnv()

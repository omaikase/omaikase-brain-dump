import type { Config } from 'drizzle-kit'

declare const process: { env: Record<string, string | undefined> }

export default {
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env['DATABASE_URL'] as string },
} satisfies Config

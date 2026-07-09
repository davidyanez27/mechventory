import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

// drizzle-kit (generate/migrate/push/studio) runs locally / in CI — not in
// Lambda. Point DATABASE_URL at the DIRECT (non-pooled) Neon endpoint here, as
// the pooler doesn't support all migration DDL.
export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

import dotenv from "dotenv";
import { defineConfig } from 'drizzle-kit';

dotenv.config({path: '.env.local'});
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required. Add it to .env.local before running Drizzle Studio.');
}

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
});

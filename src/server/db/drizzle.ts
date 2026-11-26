import env from "@/server/config/env";
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export const db = drizzle(env.DATABASE_URL, { schema });

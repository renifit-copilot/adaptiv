import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });


const pool = new Pool({
  connectionString: process.env.DATABASE_URL?.toString() ?? '',
});





export const db = drizzle(pool, { schema });
export type { InferModel } from 'drizzle-orm';

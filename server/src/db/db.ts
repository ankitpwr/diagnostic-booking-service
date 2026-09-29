import "dotenv/config";
import net from "node:net";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

// Bun's multi-address connect logic misbehaves in the container
net.setDefaultAutoSelectFamily(false);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 60000,
});

//@ts-ignore
export const db = drizzle({ client: pool, schema });

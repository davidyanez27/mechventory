import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import * as schema from './schema/index.js';

// Pool (WebSocket) instead of neon() (HTTP): the invoice flow needs real
// interactive transactions. Node 22 ships a global WebSocket, so no ws dep.
neonConfig.webSocketConstructor = globalThis.WebSocket;

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });

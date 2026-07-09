import type { NextFunction, Request, Response } from 'express';
import { getCurrentInvoke } from '@codegenie/serverless-express';
import { and, eq } from 'drizzle-orm';
import { db } from '../db/client.js';
import { companies, companyMembers, users } from '../db/schema/index.js';
import type { CompanyRole } from '../db/schema/index.js';

// Same shape Backend-main's AuthMiddleware attached to `req`, minus `appRole`
// (app-level roles are Cognito groups now).
export type Identity = {
  userId: number;
  userUuid: string;
  fullName: string;
  companyId: number;
  companyUuid: string;
  companyName: string;
  companyRole: CompanyRole;
};

declare global {
  namespace Express {
    interface Request {
      identity: Identity;
    }
  }
}

type JwtClaims = { sub?: string; email?: string };

// The Cognito JWT authorizer already validated the token; API Gateway passes
// the verified claims through the Lambda event.
const getClaims = (): JwtClaims => {
  const event = getCurrentInvoke().event as
    | { requestContext?: { authorizer?: { jwt?: { claims?: JwtClaims } } } }
    | undefined;
  return event?.requestContext?.authorizer?.jwt?.claims ?? {};
};

// Replaces Backend-main's 15-min LRU. Short TTL: a Lambda container only lives
// minutes, and 60s still bounds deactivated members to one stale minute.
const CACHE_TTL_MS = 60_000;
const identityCache = new Map<string, { identity: Identity; expires: number }>();

const resolveIdentity = async (sub: string): Promise<Identity | null> => {
  const cached = identityCache.get(sub);
  if (cached && cached.expires > Date.now()) return cached.identity;

  // Single-active-membership assumption (as in Backend-main, where the org
  // came from the token). TODO: multi-company support would need an org claim.
  const [identity] = await db
    .select({
      userId: users.id,
      userUuid: users.uuid,
      fullName: users.fullName,
      companyId: companies.id,
      companyUuid: companies.uuid,
      companyName: companies.name,
      companyRole: companyMembers.companyRole,
    })
    .from(companyMembers)
    .innerJoin(users, eq(companyMembers.userId, users.id))
    .innerJoin(companies, eq(companyMembers.companyId, companies.id))
    .where(
      and(
        eq(users.cognitoSub, sub),
        eq(users.isActive, true),
        eq(companyMembers.isActive, true),
        eq(companies.isActive, true),
      ),
    )
    .limit(1);

  if (!identity) return null;

  identityCache.set(sub, { identity, expires: Date.now() + CACHE_TTL_MS });
  return identity;
};

export const identityMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // CORS preflights arrive through an unauthenticated API Gateway route and
  // never carry Authorization — ack them before the token check so the browser
  // gets its 2xx (API Gateway adds the CORS headers to the response).
  if (req.method === 'OPTIONS') return res.sendStatus(204);

  const { sub } = getClaims();
  if (!sub) return res.status(401).json({ error: 'Missing authentication token' });

  const identity = await resolveIdentity(sub);
  if (!identity) {
    return res.status(403).json({ error: 'User does not belong to an active company' });
  }

  req.identity = identity;
  return next();
};

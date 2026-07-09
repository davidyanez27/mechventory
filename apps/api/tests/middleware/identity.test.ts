import type { NextFunction, Request, Response } from 'express';
import { getCurrentInvoke } from '@codegenie/serverless-express';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { identityMiddleware } from '../../src/middleware/identity.js';

// Chainable stand-in for the Drizzle query builder: every step returns the
// builder and limit() resolves with the configured rows.
const { dbMock, limitMock, selectMock } = vi.hoisted(() => {
  const limit = vi.fn();
  const select = vi.fn();
  const builder: Record<string, unknown> = {};
  builder.select = (...args: unknown[]) => {
    select(...args);
    return builder;
  };
  builder.from = () => builder;
  builder.innerJoin = () => builder;
  builder.where = () => builder;
  builder.limit = limit;
  return { dbMock: builder, limitMock: limit, selectMock: select };
});

vi.mock('../../src/db/client.js', () => ({ db: dbMock }));
vi.mock('@codegenie/serverless-express', () => ({ getCurrentInvoke: vi.fn() }));

const mockClaims = (sub?: string) => {
  vi.mocked(getCurrentInvoke).mockReturnValue({
    event: { requestContext: { authorizer: { jwt: { claims: { sub } } } } },
    context: {},
  } as unknown as ReturnType<typeof getCurrentInvoke>);
};

const identityRow = (sub: string) => ({
  userId: 7,
  userUuid: `uuid-${sub}`,
  fullName: 'Member Seven',
  companyId: 3,
  companyUuid: 'company-uuid',
  companyName: 'Test Workshop',
  companyRole: 'MEMBER',
});

const makeRes = () => {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    sendStatus(code: number) {
      res.statusCode = code;
      return res;
    },
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(payload: unknown) {
      res.body = payload;
      return res;
    },
  };
  return res;
};

const run = async (method = 'GET') => {
  const req = { method } as Request;
  const res = makeRes();
  const next = vi.fn() as NextFunction;
  await identityMiddleware(req, res as unknown as Response, next);
  return { req, res, next };
};

beforeEach(() => {
  limitMock.mockReset();
  selectMock.mockClear();
});

describe('identityMiddleware', () => {
  test('should ack CORS preflights with 204 before any token check', async () => {
    const { res, next } = await run('OPTIONS');

    expect(res.statusCode).toBe(204);
    expect(next).not.toHaveBeenCalled();
  });

  test('should answer 401 when the event carries no sub claim', async () => {
    mockClaims(undefined);

    const { res, next } = await run();

    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('should answer 403 when the sub matches no active membership', async () => {
    mockClaims('sub-unknown');
    limitMock.mockResolvedValue([]);

    const { res, next } = await run();

    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('should attach the resolved identity and call next', async () => {
    mockClaims('sub-attach');
    limitMock.mockResolvedValue([identityRow('sub-attach')]);

    const { req, res, next } = await run();

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(0);
    expect(req.identity.userId).toBe(7);
    expect(req.identity.companyRole).toBe('MEMBER');
  });

  test('should cache the identity so a second call skips the database', async () => {
    mockClaims('sub-cached');
    limitMock.mockResolvedValue([identityRow('sub-cached')]);

    await run();
    await run();

    expect(selectMock).toHaveBeenCalledOnce();
  });
});

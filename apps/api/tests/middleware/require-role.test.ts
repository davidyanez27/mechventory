import type { Request, Response } from 'express';
import { describe, expect, test, vi } from 'vitest';
import type { Identity } from '../../src/middleware/identity.js';
import { requireCompanyRole } from '../../src/middleware/require-role.js';

const makeRes = () => {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
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

const makeReq = (companyRole?: Identity['companyRole']) =>
  ({
    identity: companyRole ? ({ companyRole } as Identity) : undefined,
  }) as unknown as Request;

describe('requireCompanyRole', () => {
  test('should call next when the role is allowed', () => {
    const next = vi.fn();
    const res = makeRes();

    requireCompanyRole('OWNER', 'ADMIN')(makeReq('ADMIN'), res as unknown as Response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(0);
  });

  test('should answer 403 when the role is not allowed', () => {
    const next = vi.fn();
    const res = makeRes();

    requireCompanyRole('OWNER', 'ADMIN')(makeReq('MEMBER'), res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  test('should answer 401 when there is no identity on the request', () => {
    const next = vi.fn();
    const res = makeRes();

    requireCompanyRole('OWNER')(makeReq(), res as unknown as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });
});

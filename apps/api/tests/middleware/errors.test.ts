import type { Request, Response } from 'express';
import { UsernameExistsException } from '@aws-sdk/client-cognito-identity-provider';
import { inviteMemberSchema } from '@serveless/shared/user';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { CustomError } from '../../src/lib/errors.js';
import {
  cognitoErrorMiddleware,
  customErrorMiddleware,
  pgErrorMiddleware,
  serverErrorMiddleware,
  zodErrorMiddleware,
} from '../../src/middleware/errors.js';

type Problem = { status: number; detail: string };

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

const req = {} as Request;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('customErrorMiddleware', () => {
  test('should map a CustomError to its status code', () => {
    const res = makeRes();
    const next = vi.fn();

    customErrorMiddleware(CustomError.conflict('Already exists'), req, res as unknown as Response, next);

    expect(res.statusCode).toBe(409);
    expect((res.body as Problem).detail).toBe('Already exists');
    expect(next).not.toHaveBeenCalled();
  });

  test('should pass other errors to the next handler', () => {
    const next = vi.fn();
    const err = new Error('boom');

    customErrorMiddleware(err, req, makeRes() as unknown as Response, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('zodErrorMiddleware', () => {
  test('should answer 400 with the validation problem', () => {
    const parsed = inviteMemberSchema.safeParse({ email: 'nope', fullName: '', role: 'OWNER' });
    expect(parsed.success).toBe(false);
    if (parsed.success) return;

    const res = makeRes();
    zodErrorMiddleware(parsed.error, req, res as unknown as Response, vi.fn());

    expect(res.statusCode).toBe(400);
    expect((res.body as Problem).detail).toBe('Please fix the highlighted fields.');
  });
});

describe('pgErrorMiddleware', () => {
  test('should map a unique violation (23505) to 409', () => {
    const res = makeRes();
    const err = Object.assign(new Error('duplicate key'), { code: '23505' });

    pgErrorMiddleware(err, req, res as unknown as Response, vi.fn());

    expect(res.statusCode).toBe(409);
  });

  test('should read the code from err.cause (Drizzle wraps the pg error)', () => {
    const res = makeRes();
    const cause = Object.assign(new Error('fk violation'), { code: '23503' });
    const err = new Error('query failed', { cause });

    pgErrorMiddleware(err, req, res as unknown as Response, vi.fn());

    expect(res.statusCode).toBe(409);
  });

  test('should pass errors without a pg code to the next handler', () => {
    const next = vi.fn();
    const err = new Error('not a pg error');

    pgErrorMiddleware(err, req, makeRes() as unknown as Response, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('cognitoErrorMiddleware', () => {
  test('should map UsernameExistsException to 409', () => {
    const res = makeRes();
    const err = new UsernameExistsException({ message: 'User account already exists', $metadata: {} });

    cognitoErrorMiddleware(err, req, res as unknown as Response, vi.fn());

    expect(res.statusCode).toBe(409);
    expect((res.body as Problem).detail).toBe('A user with this email already exists.');
  });

  test('should pass other errors to the next handler', () => {
    const next = vi.fn();
    const err = new Error('unrelated');

    cognitoErrorMiddleware(err, req, makeRes() as unknown as Response, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('serverErrorMiddleware', () => {
  test('should answer a generic 500 and never echo internals', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const res = makeRes();

    serverErrorMiddleware(new Error('SELECT * FROM secrets failed'), req, res as unknown as Response, vi.fn());

    expect(res.statusCode).toBe(500);
    expect((res.body as Problem).detail).toBe('Unexpected error');
  });
});

import type { NextFunction, Request, Response } from 'express';
import { UsernameExistsException } from '@aws-sdk/client-cognito-identity-provider';
import { ZodError } from '@serveless/shared/common';
import { CustomError } from '../lib/errors.js';
import { makeProblem, problemType, zodIssuesToProblem } from '../lib/problems.js';

export function customErrorMiddleware(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (!(err instanceof CustomError)) return next(err);

  const problem = makeProblem({
    type: problemType('domain-error'),
    title: 'Request failed',
    status: err.statusCode ?? 500,
    detail: err.message,
  });

  return res.status(problem.status).json(problem);
}

export function zodErrorMiddleware(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (!(err instanceof ZodError)) return next(err);

  const { fields, form } = zodIssuesToProblem(err.issues);
  const problem = makeProblem({
    type: problemType('validation'),
    title: 'Validation failed',
    status: 400,
    detail: 'Please fix the highlighted fields.',
    errors: { form, fields },
  });

  return res.status(problem.status).json(problem);
}

// Replaces Backend-main's prisma-error middleware: maps raw Postgres error
// codes (surfaced by @neondatabase/serverless as `err.code`) to problem JSON.
const PG_UNIQUE_VIOLATION = '23505';
const PG_FOREIGN_KEY_VIOLATION = '23503';

export function pgErrorMiddleware(err: unknown, _req: Request, res: Response, next: NextFunction) {
  // Drizzle wraps the raw pg error in DrizzleQueryError; the Postgres code
  // then lives on `err.cause`, not on the wrapper itself.
  const withCode = (e: unknown) => (e instanceof Error ? (e as Error & { code?: unknown }).code : undefined);
  const code = withCode(err) ?? withCode(err instanceof Error ? err.cause : undefined);

  if (code === PG_UNIQUE_VIOLATION) {
    const problem = makeProblem({
      type: problemType('conflict'),
      title: 'Conflict',
      status: 409,
      detail: 'A record with these values already exists.',
    });
    return res.status(problem.status).json(problem);
  }

  if (code === PG_FOREIGN_KEY_VIOLATION) {
    const problem = makeProblem({
      type: problemType('conflict'),
      title: 'Conflict',
      status: 409,
      detail: 'The record is referenced by (or references) another record.',
    });
    return res.status(problem.status).json(problem);
  }

  return next(err);
}

// Same idea as the pg mapper, for the Cognito side of the invite flow:
// controllers stay if/throw only, the SDK exception becomes a 409 here.
export function cognitoErrorMiddleware(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (!(err instanceof UsernameExistsException)) return next(err);

  const problem = makeProblem({
    type: problemType('conflict'),
    title: 'Conflict',
    status: 409,
    detail: 'A user with this email already exists.',
  });
  return res.status(problem.status).json(problem);
}

export function notFoundMiddleware(req: Request, res: Response, _next: NextFunction) {
  const problem = makeProblem({
    type: problemType('not-found'),
    title: 'Not Found',
    status: 404,
    detail: `Cannot ${req.method} ${req.originalUrl}`,
  });
  return res.status(problem.status).json(problem);
}

export function serverErrorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Full error goes to CloudWatch only — the response must never echo
  // internals (Drizzle messages contain the failed SQL).
  console.error(err);
  const problem = makeProblem({
    type: problemType('internal-error'),
    title: 'Internal Server Error',
    status: 500,
    detail: 'Unexpected error',
  });
  return res.status(problem.status).json(problem);
}

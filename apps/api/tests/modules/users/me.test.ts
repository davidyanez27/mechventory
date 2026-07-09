import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { Identity } from '../../../src/middleware/identity.js';

const identityState = vi.hoisted(() => ({
  current: {
    userId: 1,
    userUuid: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    fullName: 'Owner One',
    companyId: 1,
    companyUuid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    companyName: 'Test Workshop',
    companyRole: 'OWNER',
  },
}));

vi.mock('../../../src/middleware/identity.js', () => ({
  identityMiddleware: (req: Request, _res: Response, next: NextFunction) => {
    req.identity = identityState.current as Identity;
    next();
  },
}));

vi.mock('../../../src/modules/users/repository.js', () => ({
  findAll: vi.fn(),
  findByUuid: vi.fn(),
  updateFullName: vi.fn(),
  deactivate: vi.fn(),
  findSelf: vi.fn(),
}));

import { app } from '../../../src/app.js';
import * as repository from '../../../src/modules/users/repository.js';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /users/me', () => {
  test('should merge the profile with the company context from the identity', async () => {
    vi.mocked(repository.findSelf).mockResolvedValue({
      uuid: identityState.current.userUuid,
      email: 'owner@example.com',
      fullName: 'Owner One',
      isActive: true,
      createdAt: new Date('2026-07-01T00:00:00.000Z'),
      updatedAt: new Date('2026-07-02T00:00:00.000Z'),
    });

    const response = await request(app).get('/users/me');

    expect(response.status).toBe(200);
    expect(response.body.company).toEqual({
      uuid: identityState.current.companyUuid,
      name: 'Test Workshop',
      role: 'OWNER',
    });
  });

  test('should never expose the internal id or cognitoSub', async () => {
    vi.mocked(repository.findSelf).mockResolvedValue({
      uuid: identityState.current.userUuid,
      email: 'owner@example.com',
      fullName: 'Owner One',
      isActive: true,
      createdAt: new Date('2026-07-01T00:00:00.000Z'),
      updatedAt: new Date('2026-07-02T00:00:00.000Z'),
    });

    const response = await request(app).get('/users/me');

    expect(response.body).not.toHaveProperty('id');
    expect(response.body).not.toHaveProperty('cognitoSub');
  });

  test('should answer 404 when the user row is gone', async () => {
    vi.mocked(repository.findSelf).mockResolvedValue(null);

    const response = await request(app).get('/users/me');

    expect(response.status).toBe(404);
  });
});

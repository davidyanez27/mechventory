import type { NextFunction, Request, Response } from 'express';
import { UsernameExistsException } from '@aws-sdk/client-cognito-identity-provider';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Identity } from '../../../src/middleware/identity.js';

// The route tests exercise the real app (routes, role guard, zod validation,
// error chain); identity, the DB repository and Cognito are the mocked edges.
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

vi.mock('../../../src/modules/companies/repository.js', () => ({
  findAll: vi.fn(),
  findByUuid: vi.fn(),
  update: vi.fn(),
  emailTaken: vi.fn(),
  addMember: vi.fn(),
}));

vi.mock('../../../src/lib/cognito.js', () => ({
  inviteCognitoUser: vi.fn(),
  deleteCognitoUser: vi.fn(),
}));

import { app } from '../../../src/app.js';
import { deleteCognitoUser, inviteCognitoUser } from '../../../src/lib/cognito.js';
import * as repository from '../../../src/modules/companies/repository.js';

const inviteDto = {
  email: 'new.member@example.com',
  fullName: 'New Member',
  role: 'MEMBER',
};

beforeEach(() => {
  vi.clearAllMocks();
  identityState.current.companyRole = 'OWNER';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('POST /companies/invite', () => {
  test('should create the Cognito user and the membership rows', async () => {
    vi.mocked(repository.emailTaken).mockResolvedValue(false);
    vi.mocked(inviteCognitoUser).mockResolvedValue('cognito-sub-123');
    vi.mocked(repository.addMember).mockResolvedValue(undefined);

    const response = await request(app).post('/companies/invite').send(inviteDto);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ message: 'Invitation sent successfully' });
    expect(inviteCognitoUser).toHaveBeenCalledWith(inviteDto.email, inviteDto.fullName);
    expect(repository.addMember).toHaveBeenCalledWith(1, inviteDto, 'cognito-sub-123');
  });

  test('should answer 409 without touching Cognito when the email is taken', async () => {
    vi.mocked(repository.emailTaken).mockResolvedValue(true);

    const response = await request(app).post('/companies/invite').send(inviteDto);

    expect(response.status).toBe(409);
    expect(inviteCognitoUser).not.toHaveBeenCalled();
    expect(repository.addMember).not.toHaveBeenCalled();
  });

  test('should answer 409 when Cognito reports an orphaned existing username', async () => {
    vi.mocked(repository.emailTaken).mockResolvedValue(false);
    vi.mocked(inviteCognitoUser).mockRejectedValue(
      new UsernameExistsException({ message: 'User account already exists', $metadata: {} }),
    );

    const response = await request(app).post('/companies/invite').send(inviteDto);

    expect(response.status).toBe(409);
    expect(repository.addMember).not.toHaveBeenCalled();
  });

  test('should roll the Cognito user back when the DB insert fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.mocked(repository.emailTaken).mockResolvedValue(false);
    vi.mocked(inviteCognitoUser).mockResolvedValue('cognito-sub-456');
    vi.mocked(repository.addMember).mockRejectedValue(new Error('connection lost'));
    vi.mocked(deleteCognitoUser).mockResolvedValue(undefined);

    const response = await request(app).post('/companies/invite').send(inviteDto);

    expect(response.status).toBe(500);
    expect(deleteCognitoUser).toHaveBeenCalledWith(inviteDto.email);
  });

  test('should answer 403 when a MEMBER tries to invite', async () => {
    identityState.current.companyRole = 'MEMBER';

    const response = await request(app).post('/companies/invite').send(inviteDto);

    expect(response.status).toBe(403);
    expect(inviteCognitoUser).not.toHaveBeenCalled();
  });

  test('should answer 400 when the payload grants a forbidden role', async () => {
    const response = await request(app)
      .post('/companies/invite')
      .send({ ...inviteDto, role: 'OWNER' });

    expect(response.status).toBe(400);
    expect(inviteCognitoUser).not.toHaveBeenCalled();
  });
});

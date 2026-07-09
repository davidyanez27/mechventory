import { z } from 'zod';

// Session state for the current user, derived from the Cognito session.
export const AuthStatus = z.enum(['checking', 'authenticated', 'not-authenticated']);

// The current user's identity, derived from the Cognito session.
export const authUserSchema = z.object({
  username: z.string(),
  sub: z.string(),
  email: z.email().optional(),
  name: z.string().optional(),
});

// Federated identity providers we expose. Only Google is wired today; add more
// here once their IdPs are configured in Cognito.
export const AuthProvider = z.enum(['Google']);

export type AuthStatus = z.infer<typeof AuthStatus>;
export type AuthUser = z.infer<typeof authUserSchema>;
export type AuthProvider = z.infer<typeof AuthProvider>;

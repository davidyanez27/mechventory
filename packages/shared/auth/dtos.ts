import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

// Multi-step create-account wizard (/register). Password must satisfy the
// Cognito pool policy (>= 8 chars) and match the confirmation field. The tenant
// (company) is auto-created server-side on first sign-in and renamed later from
// the "My Company" screen — it is not collected here. Messages are English
// defaults; the frontend maps them to translated copy per field.
export const registerSchema = z
  .object({
    email: z.email('Please enter a valid email'),
    name: z.string().min(2, 'Please enter your full name'),
    password: z.string().min(8, 'Use at least 8 characters'),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

// 6-digit verification code Cognito emails after sign-up.
export const confirmSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code we sent you'),
});

// Fields sent to Cognito sign-up — the /register wizard's inputs minus the
// confirm check. The tenant (company) is auto-created server-side, not here.
export const signUpSchema = z.object({
  email: z.email('Please enter a valid email'),
  name: z.string().min(2, 'Please enter your full name'),
  password: z.string().min(8, 'Use at least 8 characters'),
});

// Step 1 of the /forgot-password flow: request the reset code by email. Cognito
// always responds the same way whether or not the address exists (no account
// enumeration), so this just needs a valid-looking email.
export const forgotPasswordSchema = z.object({
  email: z.email('Please enter a valid email'),
});

// Step 2: the 6-digit code Cognito emailed plus the new password. Same password
// policy (>= 8 chars) and confirm-match rule as sign-up.
export const resetPasswordSchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^\d{6}$/, 'Enter the 6-digit code we sent you'),
    password: z.string().min(8, 'Use at least 8 characters'),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
export type ConfirmDto = z.infer<typeof confirmSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

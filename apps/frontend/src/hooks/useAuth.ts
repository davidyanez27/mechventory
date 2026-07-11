import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  signIn,
  confirmSignIn,
  signInWithRedirect,
  signOut,
  signUp,
  confirmSignUp,
  autoSignIn,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchUserAttributes,
} from 'aws-amplify/auth';
import type { AuthProvider, AuthStatus, AuthUser, LoginDto, SignUpInput } from '@serveless/shared/auth';
import type { Company } from '@serveless/shared/company';
import type { Me } from '@serveless/shared/user';
import InventoryApi from '@/infrastructure/api/api-client';

const sessionKey = ['auth', 'session'] as const;
const meKey = ['auth', 'me'] as const;
const companyKey = ['auth', 'company'] as const;
const authTime = 1000 * 60 * 15; // 15 min

// Source of truth for the session: returns the Cognito identity, or null when
// there is no active session. React Query caches and re-validates it.
const fetchSession = async (): Promise<AuthUser | null> => {
  try {
    const { username, userId } = await getCurrentUser();
    const attrs = await fetchUserAttributes();
    return { username, sub: userId, email: attrs.email, name: attrs.name };
  } catch {
    return null;
  }
};

export const useAuth = () => {
  const qc = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: sessionKey,
    queryFn: fetchSession,
    staleTime: authTime,
    retry: false,
  });

  // DB profile + workspace, fetched from the API once a session exists. This
  // keeps the `user`/`company` shape the profile and invoice pages consume.
  const meQuery = useQuery({
    queryKey: meKey,
    queryFn: async () => (await InventoryApi.get<Me>('/users/me')).data,
    enabled: !!sessionQuery.data,
    staleTime: authTime,
    retry: false,
  });

  const companyQuery = useQuery({
    queryKey: companyKey,
    queryFn: async () =>
      (await InventoryApi.get<Company>(`/companies/find/${meQuery.data!.company.uuid}`)).data,
    enabled: !!meQuery.data,
    staleTime: authTime,
    retry: false,
  });

  const authStatus: AuthStatus = sessionQuery.isPending
    ? 'checking'
    : sessionQuery.data
      ? 'authenticated'
      : 'not-authenticated';

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: LoginDto) => signIn({ username: email, password }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth'] }),
  });

  // Second half of an invited user's first sign-in: Cognito created them with
  // a temporary password (FORCE_CHANGE_PASSWORD), so signIn answers with the
  // NEW_PASSWORD_REQUIRED step and this call completes it.
  const newPasswordMutation = useMutation({
    mutationFn: (newPassword: string) => confirmSignIn({ challengeResponse: newPassword }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth'] }),
  });

  // Federated sign-in. Redirects to the Cognito Hosted UI / provider consent
  // screen; requires a Hosted UI domain + the provider's IdP configured in
  // Cognito. TODO(infra): add the Hosted UI domain + Google IdP in Terraform.
  const providerMutation = useMutation({
    mutationFn: (provider: AuthProvider) => signInWithRedirect({ provider }),
  });

  // Account creation for the /register wizard. The company workspace is a
  // backend concept: the post-confirmation trigger creates it (unique name)
  // and it can be renamed via the API — nothing company-related goes to
  // Cognito.
  const signupMutation = useMutation({
    mutationFn: ({ email, password, name }: SignUpInput) =>
      signUp({
        username: email,
        password,
        // autoSignIn lets confirmSignUp finish with a real session, so the user
        // reaches the dashboard straight after entering the code — no second login.
        options: { userAttributes: { email, name }, autoSignIn: true },
      }),
  });

  // Cognito creates the user as UNCONFIRMED and emails a code; this verifies it
  // and then completes the pending autoSignIn so a session exists. Invalidating
  // ['auth'] refetches the session/profile queries the redirect relies on.
  const confirmMutation = useMutation({
    mutationFn: async ({ email, code }: { email: string; code: string }) => {
      const { nextStep } = await confirmSignUp({ username: email, confirmationCode: code });
      if (nextStep.signUpStep === 'COMPLETE_AUTO_SIGN_IN') {
        await autoSignIn();
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth'] }),
  });

  const resendCodeMutation = useMutation({
    mutationFn: (email: string) => resendSignUpCode({ username: email }),
  });

  // Forgot-password, step 1: Cognito emails a reset code. Returns the nextStep
  // so the UI knows whether a code is required (it normally is).
  const resetPasswordMutation = useMutation({
    mutationFn: (email: string) => resetPassword({ username: email }),
  });

  // Forgot-password, step 2: verify the emailed code and set the new password.
  const confirmResetMutation = useMutation({
    mutationFn: ({
      email,
      code,
      newPassword,
    }: {
      email: string;
      code: string;
      newPassword: string;
    }) => confirmResetPassword({ username: email, confirmationCode: code, newPassword }),
  });

  const logoutMutation = useMutation({
    mutationFn: () => signOut(),
    onSuccess: () => {
      qc.setQueryData(sessionKey, null);
      qc.removeQueries({ queryKey: ['auth'] });
    },
  });

  return {
    // data
    session: sessionQuery.data ?? null,
    user: meQuery.data ?? null,
    company: companyQuery.data ?? null,
    authStatus,
    isLoading: sessionQuery.isPending,

    // actions
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isLoggingError: loginMutation.isError,
    loginErrorMessage: loginMutation.error,

    completeNewPassword: newPasswordMutation.mutateAsync,
    isSettingNewPassword: newPasswordMutation.isPending,

    loginWithProvider: providerMutation.mutateAsync,
    isProviderLoading: providerMutation.isPending,

    signUpAccount: signupMutation.mutateAsync,
    isSigningUp: signupMutation.isPending,

    confirmRegister: confirmMutation.mutateAsync,
    isConfirming: confirmMutation.isPending,

    resendCode: resendCodeMutation.mutateAsync,

    requestPasswordReset: resetPasswordMutation.mutateAsync,
    isRequestingReset: resetPasswordMutation.isPending,

    confirmPasswordReset: confirmResetMutation.mutateAsync,
    isConfirmingReset: confirmResetMutation.isPending,

    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,

    refreshMe: () => qc.invalidateQueries({ queryKey: ['auth'] }),
  };
};

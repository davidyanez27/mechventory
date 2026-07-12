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
  fetchAuthSession,
} from 'aws-amplify/auth';
import type { AuthProvider, AuthStatus, AuthUser, LoginDto, SignUpInput } from '@serveless/shared/auth';
import type { Company } from '@serveless/shared/company';
import type { Me } from '@serveless/shared/user';
import InventoryApi from '@/infrastructure/api/api-client';

const sessionKey = ['auth', 'session'] as const;
const meKey = ['auth', 'me'] as const;
const companyKey = ['auth', 'company'] as const;
const authTime = 1000 * 60 * 15; // 15 min


const fetchSession = async (): Promise<AuthUser | null> => {
  try {
    const { username, userId } = await getCurrentUser();
    const { tokens } = await fetchAuthSession();
    const claims = tokens?.idToken?.payload;
    return {
      username,
      sub: userId,
      email: claims?.email as string | undefined,
      name: claims?.name as string | undefined,
    };
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

  const newPasswordMutation = useMutation({
    mutationFn: (newPassword: string) => confirmSignIn({ challengeResponse: newPassword }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth'] }),
  });

  const providerMutation = useMutation({
    mutationFn: (provider: AuthProvider) => signInWithRedirect({ provider }),
  });

  const signupMutation = useMutation({
    mutationFn: ({ email, password, name }: SignUpInput) =>
      signUp({
        username: email,
        password,
        options: { userAttributes: { email, name }, autoSignIn: true },
      }),
  });


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

  const resetPasswordMutation = useMutation({
    mutationFn: (email: string) => resetPassword({ username: email }),
  });

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

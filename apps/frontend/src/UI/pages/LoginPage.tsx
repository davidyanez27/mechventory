import { useState } from 'react';
import type { FormEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { loginSchema  } from '@serveless/shared/auth';
import type {LoginDto} from '@serveless/shared/auth';
import { BRAND_NAME, Logo } from '@/UI/components/branding/Logo';
import { useAuth } from '@/hooks';
import { AuthBackdrop, GoogleMark } from '@/UI/components/auth';
import {
  mvScreen,
  mvCard,
  mvLabel,
  mvInput,
  mvError,
  mvBtnPrimary,
  mvBtnGhost,
} from '@/UI/data';

/**
 * Sign-in screen. Uses the shared mv-* design tokens (styles.css) so it stays
 * pixel-identical and in sync with the register screen.
 */
export const LoginPage = () => {
  const navigate = useNavigate();
  const {
    login,
    isLoggingIn,
    loginWithProvider,
    isProviderLoading,
    completeNewPassword,
    isSettingNewPassword,
  } = useAuth();

  const [authError, setAuthError] = useState<string | null>(null);

  // Invited users sign in with the temporary password from their email;
  // Cognito then requires them to choose their own before issuing a session.
  const [needsNewPassword, setNeedsNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const {register, handleSubmit,formState: { errors }} = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSignIn = async (data: LoginDto) => {
    setAuthError(null);
    try {
      const { isSignedIn, nextStep } = await login(data);
      if (isSignedIn) {
        await navigate({ to: '/dashboard' });
      } else if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        setNeedsNewPassword(true);
      } else {
        setAuthError('Additional verification is required to sign in.');
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
    }
  };

  const onSetNewPassword = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (newPassword.length < 8) {
      setAuthError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }
    try {
      const { isSignedIn } = await completeNewPassword(newPassword);
      if (isSignedIn) {
        await navigate({ to: '/dashboard' });
      } else {
        setAuthError('Additional verification is required to sign in.');
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to set the new password.');
    }
  };

  const onSSO = async (provider: 'Google') => {
    setAuthError(null);
    try {
      await loginWithProvider(provider);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : `Unable to continue with ${provider}.`);
    }
  };

  return (
    <div className={mvScreen}>
      <AuthBackdrop />

      <main className={`${mvCard} w-full max-w-[380px] px-9 pt-9 pb-7 display-flex flex-col items-center sm:items-start`}>
        <Logo className="mb-6 justify-center sm:justify-start" />

        {needsNewPassword ? (
          <>
            <h1 className="mb-[7px] text-[22px] font-semibold tracking-[-0.02em]">Set a new password</h1>
            <p className="mb-7 text-[13.5px] leading-relaxed text-mv-muted">
              Your temporary password was accepted. Choose your own to finish signing in.
            </p>

            <form onSubmit={onSetNewPassword}>
              <div className="mb-[15px]">
                <label htmlFor="mv-new-password" className={mvLabel}>
                  New password
                </label>
                <input
                  id="mv-new-password"
                  className={mvInput}
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="mb-[15px]">
                <label htmlFor="mv-confirm-password" className={mvLabel}>
                  Confirm password
                </label>
                <input
                  id="mv-confirm-password"
                  className={mvInput}
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {authError && (
                <p className={`${mvError} mb-1`} role="alert">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                className={`${mvBtnPrimary} mt-[7px] w-full`}
                disabled={isSettingNewPassword}
              >
                {isSettingNewPassword ? 'Saving…' : 'Set password & sign in'}
              </button>
            </form>
          </>
        ) : (
          <>
        <h1 className="mb-[7px] text-[22px] font-semibold tracking-[-0.02em]">Sign In</h1>
        <p className="mb-7 text-[13.5px] leading-relaxed text-mv-muted">
          The best projects management app.
        </p>

        <form onSubmit={handleSubmit(onSignIn)}>
          <div className="mb-[15px]">
            <label htmlFor="mv-email" className={mvLabel}>
              Email
            </label>
            <input
              id="mv-email"
              className={mvInput}
              type="email"
              autoComplete="email"
              placeholder="you@workshop.com"
              {...register('email')}
            />
            {errors.email && <p className={mvError}>{errors.email.message}</p>}
          </div>

          <div className="mb-[15px]">
            <div className="mb-2 flex items-baseline justify-between">
              <label htmlFor="mv-password" className="text-[13px] font-[450] text-mv-fg">
                Password
              </label>
              <a className="text-[12.5px] text-mv-muted transition-colors hover:text-mv-fg" href="#">
                Forgot password?
              </a>
            </div>
            <input
              id="mv-password"
              className={mvInput}
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...register('password')}
            />
            {errors.password && <p className={mvError}>{errors.password.message}</p>}
          </div>

          {authError && (
            <p className={`${mvError} mb-1`} role="alert">
              {authError}
            </p>
          )}

          <button type="submit" className={`${mvBtnPrimary} mt-[7px] w-full`} disabled={isLoggingIn}>
            {isLoggingIn ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3.5 text-[11px] uppercase tracking-[0.08em] text-mv-muted-2 before:h-px before:flex-1 before:bg-mv-line-2 before:content-[''] after:h-px after:flex-1 after:bg-mv-line-2 after:content-['']">
          or
        </div>

        <button
          type="button"
          className={`${mvBtnGhost} w-full`}
          onClick={() => onSSO('Google')}
          disabled={isProviderLoading}
        >
          <GoogleMark />
          {isProviderLoading ? 'Redirecting…' : 'Continue with Google'}
        </button>

        <p className="mt-6 text-center text-[13px] text-mv-muted">
          New to {BRAND_NAME}?{' '}
          <Link to="/register" className="text-mv-fg underline-offset-[3px] hover:underline">
            Create an account
          </Link>
        </p>
          </>
        )}
      </main>
    </div>
  );
};

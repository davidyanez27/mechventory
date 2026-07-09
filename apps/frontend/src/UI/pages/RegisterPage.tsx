import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Logo } from '@/UI/components/branding/Logo';
import { useAuth } from '@/hooks';
import { AuthBackdrop, ConfirmCodeCard, GoogleMark, STEPS, Stepper } from '@/UI/components/auth';
import {
  mvScreen,
  mvCard,
  mvLabel,
  mvInput,
  mvHint,
  mvError,
  mvBtnPrimary,
  mvBtnGhost,
} from '@/UI/data';

const emptyForm = { email: '', name: '', password: '', confirm: '' };

/**
 * Create-account flow: a 3-step wizard (email → details → password) that ends
 * by creating the Cognito user, then the ConfirmCodeCard for the emailed
 * verification code. The workspace is created server-side by the
 * post-confirmation trigger — nothing company-related is collected here.
 */
export const RegisterPage = () => {
  const navigate = useNavigate();
  const { signUpAccount, isSigningUp, loginWithProvider, isProviderLoading } = useAuth();

  const [phase, setPhase] = useState<'wizard' | 'confirm'>('wizard');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Per-step validity (gates the Next / Create account button).
  const emailValid = /\S+@\S+\.\S+/.test(form.email);
  const nameValid = form.name.trim().length > 1;
  const passwordValid = form.password.length >= 8 && form.password === form.confirm;
  const stepValid = [emailValid, nameValid, passwordValid][step];

  // Inline field errors — only once the user has typed something.
  const emailFieldError = form.email && !emailValid ? 'Please enter a valid email' : null;
  const nameFieldError = form.name && !nameValid ? 'Please enter your full name' : null;
  const passwordFieldError =
    form.password && form.password.length < 8 ? 'Use at least 8 characters' : null;
  const confirmFieldError =
    form.confirm && form.password !== form.confirm ? 'Passwords do not match' : null;

  const back = () => setStep((s) => Math.max(0, s - 1));

  const createAccount = async () => {
    setSubmitError(null);
    try {
      await signUpAccount({
        email: form.email,
        password: form.password,
        name: form.name.trim(),
      });
      setPhase('confirm');
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Could not create your account. Please try again.',
      );
    }
  };

  // Submitting the active step advances it (Enter-key friendly).
  const onStepSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stepValid) return;
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      void createAccount();
    }
  };

  const onSSO = async (provider: 'Google') => {
    setSubmitError(null);
    try {
      await loginWithProvider(provider);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : `Unable to continue with ${provider}.`);
    }
  };

  if (phase === 'confirm') {
    return (
      <ConfirmCodeCard email={form.email} onConfirmed={() => void navigate({ to: '/login' })} />
    );
  }

  return (
    <div className={mvScreen}>
      <AuthBackdrop />
      <main
        className={`${mvCard} w-full max-w-[440px] px-9 pt-[34px] pb-7 max-[520px]:px-[22px] max-[520px]:pt-7 max-[520px]:pb-[22px]`}
      >
        <Logo size={20} className="mb-[22px] justify-center" />

        <div className="text-center">
          <h1 className="mb-[7px] text-[23px] font-semibold tracking-[-0.02em]">
            Create an account
          </h1>
          <p className="mb-[26px] text-[13.5px] text-mv-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-mv-fg underline-offset-[3px] hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <Stepper current={step} />

        <form onSubmit={onStepSubmit} className="animate-[mv-fade_0.25s_ease_both]" key={step}>
          {step === 0 && (
            <>
              <div className="mb-[15px]">
                <label htmlFor="mv-email" className={mvLabel}>
                  What&apos;s your email?
                </label>
                <input
                  id="mv-email"
                  className={mvInput}
                  type="email"
                  autoComplete="email"
                  placeholder="you@workshop.com"
                  value={form.email}
                  onChange={set('email')}
                />
                {emailFieldError && <p className={mvError}>{emailFieldError}</p>}
              </div>

              <div className="mt-[18px] flex gap-2.5">
                <button type="submit" className={`${mvBtnPrimary} flex-1`} disabled={!stepValid}>
                  Next
                </button>
              </div>

              <div className="my-[22px] flex items-center gap-3.5 text-[11px] tracking-[0.08em] text-mv-muted-2 before:h-px before:flex-1 before:bg-mv-line-2 before:content-[''] after:h-px after:flex-1 after:bg-mv-line-2 after:content-['']">
                OR
              </div>

              <button
                type="button"
                className={`${mvBtnGhost} w-full`}
                onClick={() => onSSO('Google')}
                disabled={isProviderLoading}
              >
                <GoogleMark />
                {isProviderLoading ? 'Redirecting…' : `Sign up with Google`}
              </button>
            </>
          )}

          {step === 1 && (
            <>
              <div className="mb-[15px]">
                <label htmlFor="mv-name" className={mvLabel}>
                  Full name
                </label>
                <input
                  id="mv-name"
                  className={mvInput}
                  autoComplete="name"
                  placeholder="Jordan Reyes"
                  value={form.name}
                  onChange={set('name')}
                />
                {nameFieldError && <p className={mvError}>{nameFieldError}</p>}
                <p className={mvHint}>
                  Your workspace is created automatically — you can rename it later in settings.
                </p>
              </div>

              <div className="mt-[18px] flex gap-2.5">
                <button type="button" className={`${mvBtnGhost} px-[18px]`} onClick={back}>
                  Back
                </button>
                <button type="submit" className={`${mvBtnPrimary} flex-1`} disabled={!stepValid}>
                  Next
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="mb-[15px]">
                <label htmlFor="mv-pass" className={mvLabel}>
                  Create a password
                </label>
                <input
                  id="mv-pass"
                  className={mvInput}
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={set('password')}
                />
                {passwordFieldError ? (
                  <p className={mvError}>{passwordFieldError}</p>
                ) : (
                  <p className={mvHint}>Use at least 8 characters.</p>
                )}
              </div>

              <div className="mb-[15px]">
                <label htmlFor="mv-confirm" className={mvLabel}>
                  Confirm password
                </label>
                <input
                  id="mv-confirm"
                  className={mvInput}
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={set('confirm')}
                />
                {confirmFieldError && <p className={mvError}>{confirmFieldError}</p>}
              </div>

              {submitError && (
                <p className={`${mvError} mb-1`} role="alert">
                  {submitError}
                </p>
              )}

              <div className="mt-[18px] flex gap-2.5">
                <button type="button" className={`${mvBtnGhost} px-[18px]`} onClick={back}>
                  Back
                </button>
                <button
                  type="submit"
                  className={`${mvBtnPrimary} flex-1`}
                  disabled={!stepValid || isSigningUp}
                >
                  {isSigningUp ? 'Creating…' : 'Create account'}
                </button>
              </div>
            </>
          )}
        </form>
      </main>
    </div>
  );
};

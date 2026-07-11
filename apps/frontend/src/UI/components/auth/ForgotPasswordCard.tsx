import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Logo } from '@/UI/components/branding/Logo';
import { useAuth } from '@/hooks';
import { mvScreen, mvCard, mvLabel, mvInput, mvHint, mvError, mvBtnPrimary } from '@/UI/data';
import { AuthBackdrop } from './AuthBackdrop';

/**
 * Forgot-password flow: step 1 collects the email and asks Cognito to email a
 * reset code; step 2 takes that code plus a new password and updates it. On
 * success it hands control back to LoginPage (which shows a "sign in" notice) —
 * Cognito does not create a session here, so the user still signs in afterwards.
 */
export const ForgotPasswordCard = ({
  defaultEmail = '',
  onCancel,
  onReset,
}: {
  defaultEmail?: string;
  onCancel: () => void;
  onReset: (email: string) => void;
}) => {
  const { t } = useTranslation();
  const { requestPasswordReset, isRequestingReset, confirmPasswordReset, isConfirmingReset } =
    useAuth();

  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const emailValid = /\S+@\S+\.\S+/.test(email);
  const passwordValid = password.length >= 8 && password === confirm;
  const confirmFieldError = confirm && password !== confirm ? t('auth.forgot.passwordMismatch') : null;

  const onRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!emailValid) return;
    setError(null);
    try {
      const { nextStep } = await requestPasswordReset(email);
      // Almost always a code step; if Cognito says it's already done, skip ahead.
      if (nextStep.resetPasswordStep === 'DONE') onReset(email);
      else setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.forgot.requestError'));
    }
  };

  const onConfirm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!code.trim() || !passwordValid) return;
    setError(null);
    try {
      await confirmPasswordReset({ email, code: code.trim(), newPassword: password });
      onReset(email);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.forgot.confirmError'));
    }
  };

  return (
    <div className={mvScreen}>
      <AuthBackdrop />
      <main
        className={`${mvCard} w-full max-w-[440px] px-9 pt-[34px] pb-7 max-[520px]:px-[22px] max-[520px]:pt-7 max-[520px]:pb-[22px]`}
      >
        <Logo size={20} className="mb-[22px] justify-center" />

        {step === 'request' ? (
          <>
            <div className="text-center">
              <h1 className="mb-[7px] text-[23px] font-semibold tracking-[-0.02em]">
                {t('auth.forgot.requestTitle')}
              </h1>
              <p className="mb-[26px] text-[13.5px] text-mv-muted">
                {t('auth.forgot.requestSubtitle')}
              </p>
            </div>

            <form onSubmit={onRequest} className="text-left">
              <div className="mb-[15px]">
                <label htmlFor="mv-reset-email" className={mvLabel}>
                  {t('auth.forgot.email')}
                </label>
                <input
                  id="mv-reset-email"
                  className={mvInput}
                  type="email"
                  autoComplete="email"
                  placeholder={t('auth.forgot.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {error && (
                <p className={`${mvError} mb-1`} role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className={`${mvBtnPrimary} mt-[7px] w-full`}
                disabled={!emailValid || isRequestingReset}
              >
                {isRequestingReset ? t('auth.forgot.sending') : t('auth.forgot.sendCode')}
              </button>
            </form>

            <p className="mt-6 text-center text-[13px] text-mv-muted">
              <button
                type="button"
                onClick={onCancel}
                className="text-mv-fg underline-offset-[3px] hover:underline"
              >
                {t('auth.forgot.backToSignIn')}
              </button>
            </p>
          </>
        ) : (
          <>
            <div className="text-center">
              <h1 className="mb-[7px] text-[23px] font-semibold tracking-[-0.02em]">
                {t('auth.forgot.confirmTitle')}
              </h1>
              <p className="mb-[26px] text-[13.5px] text-mv-muted">
                <Trans
                  i18nKey="auth.forgot.confirmSubtitle"
                  values={{ email }}
                  components={{ em: <span className="text-mv-fg" /> }}
                />
              </p>
            </div>

            <form onSubmit={onConfirm} className="text-left">
              <div className="mb-[15px]">
                <label htmlFor="mv-reset-code" className={mvLabel}>
                  {t('auth.forgot.code')}
                </label>
                <input
                  id="mv-reset-code"
                  className={`${mvInput} text-center font-mv-mono tracking-[0.3em]`}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder={t('auth.forgot.codePlaceholder')}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <div className="mb-[15px]">
                <label htmlFor="mv-reset-password" className={mvLabel}>
                  {t('auth.forgot.newPassword')}
                </label>
                <input
                  id="mv-reset-password"
                  className={mvInput}
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('auth.forgot.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className={mvHint}>{t('auth.forgot.passwordHint')}</p>
              </div>

              <div className="mb-[15px]">
                <label htmlFor="mv-reset-confirm" className={mvLabel}>
                  {t('auth.forgot.confirmPassword')}
                </label>
                <input
                  id="mv-reset-confirm"
                  className={mvInput}
                  type="password"
                  autoComplete="new-password"
                  placeholder={t('auth.forgot.passwordPlaceholder')}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
                {confirmFieldError && <p className={mvError}>{confirmFieldError}</p>}
              </div>

              {error && (
                <p className={`${mvError} mb-1`} role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className={`${mvBtnPrimary} mt-[7px] w-full`}
                disabled={!code.trim() || !passwordValid || isConfirmingReset}
              >
                {isConfirmingReset ? t('auth.forgot.submitting') : t('auth.forgot.submit')}
              </button>
            </form>

            <p className="mt-6 text-center text-[13px] text-mv-muted">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep('request');
                }}
                className="text-mv-fg underline-offset-[3px] hover:underline"
              >
                {t('auth.forgot.back')}
              </button>
            </p>
          </>
        )}
      </main>
    </div>
  );
};

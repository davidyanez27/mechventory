import { useState } from 'react';
import { Logo } from '@/UI/components/branding/Logo';
import { useAuth } from '@/hooks';
import { mvScreen, mvCard, mvLabel, mvInput, mvError, mvBtnPrimary } from '@/UI/data';
import { AuthBackdrop } from './AuthBackdrop';

/**
 * Post-signup verification screen: Cognito created the user as UNCONFIRMED
 * and emailed a 6-digit code; this confirms it and hands control back to the
 * page via onConfirmed.
 */
export const ConfirmCodeCard = ({
  email,
  onConfirmed,
}: {
  email: string;
  onConfirmed: () => void;
}) => {
  const { confirmRegister, isConfirming, resendCode } = useAuth();

  const [code, setCode] = useState('');
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const onConfirm = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!code.trim()) return;
    setConfirmError(null);
    try {
      await confirmRegister({ email, code: code.trim() });
      onConfirmed();
    } catch (err) {
      setConfirmError(
        err instanceof Error ? err.message : 'That code did not work. Please try again.',
      );
    }
  };

  const onResend = async () => {
    setConfirmError(null);
    try {
      await resendCode(email);
    } catch (err) {
      setConfirmError(err instanceof Error ? err.message : 'Could not resend the code.');
    }
  };

  return (
    <div className={mvScreen}>
      <AuthBackdrop />
      <main
        className={`${mvCard} w-full max-w-[440px] px-9 pt-[34px] pb-7 text-center max-[520px]:px-[22px] max-[520px]:pt-7 max-[520px]:pb-[22px]`}
      >
        <Logo size={20} className="mb-[22px] justify-center" />
        <h1 className="mb-[7px] text-[23px] font-semibold tracking-[-0.02em]">Check your email</h1>
        <p className="mb-7 text-[13.5px] text-mv-muted">
          Enter the 6-digit code we sent to <span className="text-mv-fg">{email}</span>.
        </p>

        <form onSubmit={onConfirm} className="text-left">
          <div className="mb-[15px]">
            <label htmlFor="mv-code" className={mvLabel}>
              Verification code
            </label>
            <input
              id="mv-code"
              className={`${mvInput} text-center font-mv-mono tracking-[0.3em]`}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          {confirmError && (
            <p className={`${mvError} mb-1`} role="alert">
              {confirmError}
            </p>
          )}

          <button
            type="submit"
            className={`${mvBtnPrimary} mt-[7px] w-full`}
            disabled={isConfirming || !code.trim()}
          >
            {isConfirming ? 'Verifying…' : 'Confirm account'}
          </button>
        </form>

        <p className="mt-6 text-[13px] text-mv-muted">
          Didn&apos;t get it?{' '}
          <button
            type="button"
            onClick={onResend}
            className="text-mv-fg underline-offset-[3px] hover:underline"
          >
            Resend code
          </button>
        </p>
      </main>
    </div>
  );
};

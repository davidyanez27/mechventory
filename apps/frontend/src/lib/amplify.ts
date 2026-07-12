import { Amplify } from 'aws-amplify';
import { Hub } from 'aws-amplify/utils';

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

// OAuth / Google Hosted UI config. Empty until Google sign-in is provisioned in
// Terraform (VITE_COGNITO_DOMAIN drives whether the oauth block is attached).
const domain = import.meta.env.VITE_COGNITO_DOMAIN as string | undefined;

// The redirect env vars are comma-separated (one origin per environment, e.g.
// localhost + the Amplify URL). Amplify picks the entry matching the current
// origin at runtime; fall back to the live origin when they are unset.
const parseOrigins = (raw?: string): string[] => {
  const list = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : [window.location.origin];
};

if (!userPoolId || !userPoolClientId) {
  // Fail loudly in dev rather than silently rendering a broken login form.
  console.warn(
    '[amplify] Missing VITE_COGNITO_USER_POOL_ID / VITE_COGNITO_CLIENT_ID. ' +
      'Copy them from `terraform output` into apps/frontend/.env',
  );
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
      loginWith: {
        email: true,
        // Only wire the Hosted UI when a domain is configured — otherwise
        // "Continue with Google" is simply unavailable and native auth is fine.
        ...(domain
          ? {
              oauth: {
                domain,
                scopes: ['email', 'openid', 'profile'],
                redirectSignIn: parseOrigins(import.meta.env.VITE_COGNITO_REDIRECT_SIGN_IN),
                redirectSignOut: parseOrigins(import.meta.env.VITE_COGNITO_REDIRECT_SIGN_OUT),
                responseType: 'code',
                providers: ['Google'],
              },
            }
          : {}),
      },
    },
  },
});

// --- Google / Hosted-UI redirect outcome -----------------------------------
// After Google, the browser lands on `/?code=...` and Amplify exchanges that code
// for a session automatically. It reports the result ONLY through a Hub event, so
// with no listener a *failed* exchange (bad state, PKCE mismatch, token-endpoint
// error) is completely silent — the user is stranded on a blank page. We record
// the outcome here, registered right after `configure` so the listener is live
// before the async exchange can resolve, and let the `/` landing consume it.
type OAuthOutcome = 'success' | { error: string };

let recordedOutcome: OAuthOutcome | null = null;
const waiters = new Set<(o: OAuthOutcome) => void>();

const settle = (outcome: OAuthOutcome) => {
  recordedOutcome = outcome;
  waiters.forEach((w) => w(outcome));
  waiters.clear();
};

Hub.listen('auth', ({ payload }) => {
  if (payload.event === 'signInWithRedirect') {
    settle('success');
  } else if (payload.event === 'signInWithRedirect_failure') {
    const error = (payload as { data?: { error?: unknown } }).data?.error;
    const message =
      error instanceof Error ? error.message : String(error ?? 'Google sign-in failed');
    // Surfaced so the actual Cognito reason is visible instead of a blank page.
    console.error('[oauth] signInWithRedirect_failure:', error);
    settle({ error: message });
  }
});

// Resolves as soon as the Hosted-UI code→token exchange succeeds or fails —
// whether that already happened (event fired before the caller subscribed) or is
// still in flight. Never rejects; callers pair it with their own timeout for the
// one path Amplify reports nothing on (no in-flight flag → silent no-op).
export const awaitOAuthOutcome = (): Promise<OAuthOutcome> =>
  recordedOutcome ? Promise.resolve(recordedOutcome) : new Promise((res) => waiters.add(res));

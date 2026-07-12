import { Amplify } from 'aws-amplify';
import { Hub } from 'aws-amplify/utils';
import { signInWithRedirect } from 'aws-amplify/auth';

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
const domain = import.meta.env.VITE_COGNITO_DOMAIN as string | undefined;

const parseOrigins = (raw?: string): string[] => {
  const list = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : [window.location.origin];
};

if (!userPoolId || !userPoolClientId) {

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

if (typeof signInWithRedirect !== 'function') {
  throw new Error('[amplify] aws-amplify/auth signInWithRedirect is unavailable');
}

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
    console.error('[oauth] signInWithRedirect_failure:', error);
    settle({ error: message });
  }
});


export const awaitOAuthOutcome = (): Promise<OAuthOutcome> =>
  recordedOutcome ? Promise.resolve(recordedOutcome) : new Promise((res) => waiters.add(res));

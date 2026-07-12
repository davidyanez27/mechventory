import { Amplify } from 'aws-amplify';

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

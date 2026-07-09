import { Amplify } from 'aws-amplify';

const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

if (!userPoolId || !userPoolClientId) {
  // Fail loudly in dev rather than silently rendering a broken login form.
  console.warn(
    '[amplify] Missing VITE_COGNITO_USER_POOL_ID / VITE_COGNITO_CLIENT_ID. ' +
      'Copy them from `terraform output` into apps/Frontend-main/.env',
  );
}

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId,
      userPoolClientId,
      loginWith: { email: true },
    },
  },
});

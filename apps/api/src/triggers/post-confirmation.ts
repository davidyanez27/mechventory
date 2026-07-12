import { provisionWorkspace } from '../lib/provisioning.js';

// Minimal structural type for the Cognito PostConfirmation event — enough for
// what we read, without pulling in @types/aws-lambda.
type PostConfirmationEvent = {
  triggerSource: string;
  request: { userAttributes: Record<string, string | undefined> };
};

// Runs once when a native (email/password) user confirms their signup code,
// before their first login. Provisions the user + company + OWNER membership +
// seed walk-in customer. Federated (Google) users never reach this trigger —
// identityMiddleware provisions them lazily on their first API call instead.
export const handler = async (event: PostConfirmationEvent): Promise<PostConfirmationEvent> => {
  // Also fires for forgot-password confirmations — only provision on signup.
  if (event.triggerSource !== 'PostConfirmation_ConfirmSignUp') return event;

  const attributes = event.request.userAttributes;
  const sub = attributes.sub;
  const email = attributes.email;
  const fullName = attributes.name ?? email;

  if (!sub || !email || !fullName) {
    throw new Error('PostConfirmation event is missing required attributes (sub, email)');
  }

  await provisionWorkspace({ sub, email, fullName });

  return event;
};

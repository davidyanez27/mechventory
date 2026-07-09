import {
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient({});
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID ?? '';

export const inviteCognitoUser = async (email: string, fullName: string): Promise<string> => {
  const { User } = await client.send(
    new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      DesiredDeliveryMediums: ['EMAIL'],
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: fullName },
      ],
    }),
  );

  const sub = User?.Attributes?.find((attr) => attr.Name === 'sub')?.Value;
  if (!sub) throw new Error('Cognito did not return a sub for the invited user');
  return sub;
};

// Compensation for a half-done invite: if the DB insert fails after the
// Cognito user was created, removing it keeps the invite retryable.
export const deleteCognitoUser = async (email: string): Promise<void> => {
  await client.send(new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: email }));
};

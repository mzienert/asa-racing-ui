import { CognitoUserPool } from 'amazon-cognito-identity-js';

const createUserPool = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || !process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID) {
    console.error('Environment variables not found:', {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    });
    return null;
  }

  try {
    const userPool = new CognitoUserPool({
      UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
      ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
    });

    return userPool;
  } catch (error) {
    console.error('Error creating Cognito User Pool:', error);
    return null;
  }
};

export const userPool = createUserPool();

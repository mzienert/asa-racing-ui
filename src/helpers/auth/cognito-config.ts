import { CognitoUserPool } from 'amazon-cognito-identity-js';

const createUserPool = () => {
    if (typeof window === 'undefined') {
        return null;
    }

    if (!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || !process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID) {
        console.error('Environment variables not found:', {
            userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
            clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
        });
        return null;
    }

    return new CognitoUserPool({
        UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
        ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
    });
};

export const userPool = createUserPool();
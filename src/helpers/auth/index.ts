import { CognitoUser, CognitoUserPool, CognitoUserSession } from 'amazon-cognito-identity-js';
import { AuthenticationDetails } from 'amazon-cognito-identity-js';

if (!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || !process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID) {
    console.error('Environment variables not found:', {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
        clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
    });
    throw new Error('Cognito configuration missing. Please check your environment variables.');
}

const userPool = new CognitoUserPool({
    UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
    ClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
});

export async function initiateLogin(email: string): Promise<{ 
    success: boolean; 
    message: string; 
    sessionData?: string;
}> {
    try {
        const normalizedEmail = email.toLowerCase();
        
        const cognitoUser = new CognitoUser({
            Username: normalizedEmail,
            Pool: userPool
        });
        
        const result = await new Promise<any>((resolve, reject) => {
            cognitoUser.initiateAuth(new AuthenticationDetails({
                Username: normalizedEmail,
                ValidationData: {
                    'CUSTOM_CHALLENGE': 'INIT'
                }
            }), {
                onSuccess: (session) => resolve({ cognitoUser, session }),
                onFailure: reject,
                customChallenge: (challengeParameters) => resolve({ cognitoUser, challengeParameters })
            });
        });

        return {
            success: true,
            message: 'OTP sent to email',
            sessionData: result.cognitoUser.Session
        };
    } catch (error: any) {
        console.error('Auth error:', error);
        return {
            success: false,
            message: error.message || 'Failed to initiate login'
        };
    }
}

export async function verifyOTP(email: string, otp: string, sessionData: string | null) {
    if (!sessionData) {
        return {
            success: false,
            message: 'Invalid session'
        };
    }

    try {
        const normalizedEmail = email.toLowerCase();
        
        const cognitoUser = new CognitoUser({
            Username: normalizedEmail,
            Pool: userPool
        });

        (cognitoUser as any).Session = sessionData;
        
        const result = await new Promise((resolve, reject) => {
            cognitoUser.sendCustomChallengeAnswer(otp, {
                onSuccess: resolve,
                onFailure: reject
            });
        });
        
        return {
            success: true,
            message: 'Login successful'
        };
    } catch (error: any) {
        console.error('Error verifying OTP:', error);
        return {
            success: false,
            message: error.message || 'Invalid OTP'
        };
    }
} 
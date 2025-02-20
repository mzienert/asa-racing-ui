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

// Keep a reference to the current authentication attempt
let currentCognitoUser: CognitoUser | null = null;

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
        // Handle specific Cognito errors
        if (error.name === 'NotAuthorizedException') {
            return {
                success: false,
                message: 'Email not found. Please check and try again.'
            };
        }
        if (error.name === 'UserNotFoundException') {
            return {
                success: false,
                message: 'Email not found. Please check and try again.'
            };
        }
        // Log unexpected errors but return a user-friendly message
        console.error('Unexpected auth error:', error);
        return {
            success: false,
            message: 'Unable to process request. Please try again later.'
        };
    }
}

// TODO: Fix session handling for multiple verification attempts
// Currently, the session is not properly maintained between failed verification attempts,
// forcing users to request a new code after an incorrect attempt.
// Bug: https://linear.app/megatron/issue/MEG-16/fix-session-when-user-enters-invalid-auth-code

export async function verifyOTP(email: string, otp: string, sessionData: string | null) {
    console.log('Starting verifyOTP with session:', !!sessionData);
    
    if (!sessionData) {
        return {
            success: false,
            message: 'Session expired. Please request a new code.'
        };
    }

    try {
        const normalizedEmail = email.toLowerCase();
        const cognitoUser = new CognitoUser({
            Username: normalizedEmail,
            Pool: userPool
        });

        // Set the raw session string
        (cognitoUser as any).Session = sessionData;
        
        const result = await new Promise<CognitoUserSession>((resolve, reject) => {
            cognitoUser.sendCustomChallengeAnswer(otp, {
                onSuccess: (session: CognitoUserSession) => resolve(session),
                onFailure: (err) => {
                    // Keep the session valid for incorrect codes
                    if (err.message === 'Incorrect username or password.') {
                        (cognitoUser as any).Session = sessionData;
                    }
                    reject(err);
                }
            });
        });

        if (!result || !result.getIdToken()) {
            throw new Error('Failed to get valid session');
        }
        
        const accessToken = result.getAccessToken().getJwtToken();
        const idToken = result.getIdToken().getJwtToken();
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/session`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ accessToken, idToken })
        });

        const sessionResult = await response.json();
        
        const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/session/verify`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const verifyResult = await verifyResponse.json();
        
        return {
            success: true,
            message: 'Login successful'
        };
    } catch (error: any) {
        console.log('Caught error:', error.name, error.message);
        
        if (error.message === 'Incorrect username or password.') {
            return {
                success: false,
                message: 'Incorrect verification code. Please try again.'
            };
        }

        return {
            success: false,
            message: 'Session expired. Please request a new code.'
        };
    }
}

export async function signOut() {
    try {
        const user = userPool.getCurrentUser();
        if (user) {
            user.signOut();
            // Clear any cookies we've set
            document.cookie = 'sessionToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            return { success: true };
        }
        return { success: false, message: 'No user found' };
    } catch (error: any) {
        console.error('Signout error:', error);
        return { success: false, message: error.message };
    }
} 
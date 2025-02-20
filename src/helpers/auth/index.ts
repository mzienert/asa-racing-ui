import { CognitoUser, CognitoUserSession, AuthenticationDetails } from 'amazon-cognito-identity-js';
import { userPool } from './cognito-config';

if (!process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || !process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID) {
    console.error('Environment variables not found:', {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID,
        clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
    });
    throw new Error('Cognito configuration missing. Please check your environment variables.');
}

type AuthError = {
    name: string;
    message: string;
};

type AuthResponse = {
    success: boolean;
    message: string;
    sessionData?: string;
};

type CognitoUserWithSession = CognitoUser & {
    Session: string;
};

type InitAuthResult = {
    cognitoUser: CognitoUserWithSession;
    session?: CognitoUserSession;
    challengeParameters?: Record<string, string>;
};

export async function initiateLogin(email: string): Promise<AuthResponse> {
    try {
        if (!userPool) {
            return {
                success: false,
                message: 'Authentication service not available'
            };
        }

        const normalizedEmail = email.toLowerCase();
        
        const cognitoUser = new CognitoUser({
            Username: normalizedEmail,
            Pool: userPool!
        }) as CognitoUserWithSession;
        
        const result = await new Promise<InitAuthResult>((resolve, reject) => {
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
    } catch (error: unknown) {
        const authError = error as AuthError;
        // Handle specific Cognito errors
        if (authError.name === 'NotAuthorizedException') {
            return {
                success: false,
                message: 'Email not found. Please check and try again.'
            };
        }
        if (authError.name === 'UserNotFoundException') {
            return {
                success: false,
                message: 'Email not found. Please check and try again.'
            };
        }
        // Log unexpected errors but return a user-friendly message
        console.error('Unexpected auth error:', authError);
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

export async function verifyOTP(email: string, otp: string, sessionData: string | null): Promise<AuthResponse> {
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
            Pool: userPool!
        });

        // Set the raw session string
        (cognitoUser as unknown as CognitoUserWithSession).Session = sessionData;
        
        const result = await new Promise<CognitoUserSession>((resolve, reject) => {
            cognitoUser.sendCustomChallengeAnswer(otp, {
                onSuccess: (session: CognitoUserSession) => resolve(session),
                onFailure: (err: AuthError) => {
                    if (err.message === 'Incorrect username or password.') {
                        (cognitoUser as unknown as CognitoUserWithSession).Session = sessionData;
                    }
                    reject(err);
                }
            });
        });

        const accessToken = result.getAccessToken().getJwtToken();
        const idToken = result.getIdToken().getJwtToken();
        
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_STAGE}/auth/session`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ accessToken, idToken })
        });

        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_STAGE}/auth/session/verify`, {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        return {
            success: true,
            message: 'Login successful'
        };
    } catch (error: unknown) {
        const authError = error as AuthError;
        console.log('Caught error:', authError.name, authError.message);
        
        if (authError.message === 'Incorrect username or password.') {
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

export async function signOut(): Promise<{ success: boolean; message?: string }> {
    try {
        if (!userPool) {
            return { success: false, message: 'Authentication service not available' };
        }
        const user = userPool.getCurrentUser();
        if (user) {
            user.signOut();
            // Clear any cookies we've set
            document.cookie = 'sessionToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
            return { success: true };
        }
        return { success: false, message: 'No user found' };
    } catch (error: unknown) {
        const authError = error as AuthError;
        console.error('Signout error:', authError);
        return { success: false, message: authError.message };
    }
} 
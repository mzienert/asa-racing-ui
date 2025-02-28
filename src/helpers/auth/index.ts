import { CognitoIdentityProviderClient, InitiateAuthCommand, RespondToAuthChallengeCommand } from '@aws-sdk/client-cognito-identity-provider';

// Check for required environment variables
const COGNITO_USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const COGNITO_CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Log the Cognito configuration for debugging
console.log('Auth Helper - Cognito Configuration:');
console.log('User Pool ID:', COGNITO_USER_POOL_ID);
console.log('Client ID:', COGNITO_CLIENT_ID);

if (!COGNITO_USER_POOL_ID || !COGNITO_CLIENT_ID) {
    console.error('Missing required environment variables: NEXT_PUBLIC_COGNITO_USER_POOL_ID or NEXT_PUBLIC_COGNITO_CLIENT_ID');
}

// Memory storage for tokens
let memoryTokens: { accessToken?: string; refreshToken?: string } = {};

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({
    region: 'us-west-1', // Make sure this matches your Cognito region
});

// Function to initiate login
export async function initiateLogin(email: string) {
    try {
        // Log the client ID being used for this request
        console.log('Initiating login with Client ID:', COGNITO_CLIENT_ID);
        
        const command = new InitiateAuthCommand({
            AuthFlow: 'CUSTOM_AUTH',
            ClientId: COGNITO_CLIENT_ID,
            AuthParameters: {
                USERNAME: email,
            },
        });

        const response = await cognitoClient.send(command);
        console.log('Login initiated successfully:', response);
        
        return {
            success: true,
            session: response.Session,
            challengeName: response.ChallengeName,
        };
    } catch (error: any) {
        console.error('Error initiating login:', error);
        
        if (error.name === 'NotAuthorizedException') {
            return {
                success: false,
                error: 'Invalid credentials',
            };
        } else if (error.name === 'UserNotFoundException') {
            return {
                success: false,
                error: 'User not found',
            };
        }
        
        return {
            success: false,
            error: error.message || 'An error occurred during login',
        };
    }
}

// Function to verify OTP
export async function verifyOTP(email: string, otp: string, session: string) {
    try {
        // Log the client ID being used for this request
        console.log('Verifying OTP with Client ID:', COGNITO_CLIENT_ID);
        
        const command = new RespondToAuthChallengeCommand({
            ChallengeName: 'CUSTOM_CHALLENGE',
            ClientId: COGNITO_CLIENT_ID,
            ChallengeResponses: {
                USERNAME: email,
                ANSWER: otp,
            },
            Session: session,
        });

        const response = await cognitoClient.send(command);
        console.log('OTP verification response:', response);

        if (response.AuthenticationResult) {
            const { AccessToken, RefreshToken } = response.AuthenticationResult;
            
            // Store tokens in memory
            memoryTokens = {
                accessToken: AccessToken,
                refreshToken: RefreshToken,
            };
            
            // Also store in localStorage for persistence
            if (typeof window !== 'undefined') {
                localStorage.setItem('accessToken', AccessToken || '');
                localStorage.setItem('refreshToken', RefreshToken || '');
            }
            
            return {
                success: true,
                accessToken: AccessToken,
                refreshToken: RefreshToken,
            };
        } else if (response.ChallengeName) {
            // Still in challenge flow
            return {
                success: false,
                challengeName: response.ChallengeName,
                session: response.Session,
                error: 'Additional challenge required',
            };
        }
        
        return {
            success: false,
            error: 'Verification failed',
        };
    } catch (error: any) {
        console.error('Error verifying OTP:', error);
        
        if (error.name === 'CodeMismatchException') {
            return {
                success: false,
                error: 'Incorrect verification code',
            };
        } else if (error.name === 'ExpiredCodeException') {
            return {
                success: false,
                error: 'Verification code has expired',
            };
        }
        
        return {
            success: false,
            error: error.message || 'An error occurred during verification',
        };
    }
}

// Function to get auth tokens
export function getAuthTokens() {
    // First try memory
    if (memoryTokens.accessToken) {
        return memoryTokens;
    }
    
    // Then try localStorage
    if (typeof window !== 'undefined') {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (accessToken) {
            memoryTokens = { accessToken, refreshToken: refreshToken || undefined };
            return memoryTokens;
        }
    }
    
    return { accessToken: undefined, refreshToken: undefined };
}

// Function to check if user is authenticated
export async function isAuthenticated() {
    const { accessToken } = getAuthTokens();
    
    if (!accessToken) {
        return false;
    }
    
    try {
        // Verify token with backend
        const response = await fetch(`${API_URL}/auth/verify`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Important for CORS
        });
        
        if (response.ok) {
            return true;
        }
        
        // If token is invalid, clear it
        signOut();
        return false;
    } catch (error) {
        console.error('Error verifying authentication:', error);
        // Don't sign out on network errors to allow offline usage
        return !!accessToken;
    }
}

// Function to sign out
export function signOut() {
    memoryTokens = {};
    
    if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }
}

// Function to make authenticated API requests
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
    const { accessToken } = getAuthTokens();
    
    if (!accessToken) {
        throw new Error('Not authenticated');
    }
    
    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
    };
    
    return fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Important for CORS
    });
} 
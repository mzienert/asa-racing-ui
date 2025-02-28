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
    } catch (error: unknown) {
        console.error('Error initiating login:', error);
        
        // Type guard for error object
        if (error && typeof error === 'object' && 'name' in error) {
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
            
            // Safe access to message property
            return {
                success: false,
                error: 'message' in error && typeof error.message === 'string' 
                    ? error.message 
                    : 'An error occurred during login',
            };
        }
        
        return {
            success: false,
            error: 'An error occurred during login',
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
    } catch (error: unknown) {
        console.error('Error verifying OTP:', error);
        
        // Type guard for error object
        if (error && typeof error === 'object' && 'name' in error) {
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
            
            // Safe access to message property
            return {
                success: false,
                error: 'message' in error && typeof error.message === 'string' 
                    ? error.message 
                    : 'An error occurred during verification',
            };
        }
        
        return {
            success: false,
            error: 'An error occurred during verification',
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
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    // Get the token from our auth helper
    const { accessToken } = getAuthTokens();
    
    if (!accessToken) {
      console.log('No access token found, user is not authenticated');
      return false;
    }
    
    // Format the API URL correctly
    let apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://xtxfuhrel1.execute-api.us-west-1.amazonaws.com/prod';
    if (!apiUrl.endsWith('/')) {
      apiUrl += '/';
    }
    
    console.log('Using API URL:', apiUrl);
    
    // Call the verify endpoint
    const verifyEndpoint = `${apiUrl}auth/verify`;
    console.log('Calling verify endpoint:', verifyEndpoint);
    
    const response = await fetch(verifyEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    console.log('Verify response status:', response.status);
    
    if (!response.ok) {
      console.error('Token verification failed:', response.status);
      // If the response is not OK, try to parse the error message
      try {
        const errorData = await response.json();
        console.error('Error details:', errorData);
      } catch (parseError) {
        console.error('Could not parse error response');
      }
      return false;
    }
    
    // Parse the response
    const data = await response.json();
    console.log('Verification response:', data);
    
    // Check if the token is valid
    return data.valid === true;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

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
        // Don't include credentials for CORS requests to avoid preflight issues
        // credentials: 'include',
    });
} 
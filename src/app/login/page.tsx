'use client';
import MainCard from '@/components/MainCard';
import { setUser } from '../../store/features/authSlice';
import { useAppDispatch } from '../../store/hooks';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { initiateLogin, verifyOTP, isAuthenticated } from '@/helpers/auth';
import { LoadingButton } from '@/components/ui/loading-button';
import { AlertCircle } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 50;
const MAX_CODE_LENGTH = 6;

export default function Page() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [session, setSession] = useState<string | null>(null);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [isCodeSubmitting, setIsCodeSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const validateEmail = (value: string): boolean => {
    if (!EMAIL_REGEX.test(value)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    if (value.length > MAX_EMAIL_LENGTH) {
      setEmailError(`Email must be less than ${MAX_EMAIL_LENGTH} characters`);
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_EMAIL_LENGTH) {
      setEmail(value);
      if (emailError) {
        setEmailError(null);
      }
    }
  };

  const handleEmailBlur = () => {
    if (email) {
      validateEmail(email);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail(email)) {
      return;
    }

    setIsEmailSubmitting(true);
    try {
      const result = await initiateLogin(email);
      if (result.success) {
        setSession(result.session as string);
        setShowCode(true);
      } else {
        setEmailError(result.error || 'Email not found. Please check and try again.');
      }
    } catch (error: unknown) {
      setEmailError(`An unexpected error occurred. Please try again later.`);
      console.error('Error during email submission:', error);
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError(null);

    if (code.length !== MAX_CODE_LENGTH) {
      setVerificationError(`Verification code must be ${MAX_CODE_LENGTH} digits`);
      return;
    }

    setIsCodeSubmitting(true);

    try {
      // Verify the OTP code using our existing function
      const result = await verifyOTP(email, code, session || '');

      if (result.success && result.accessToken) {
        // Check if the user is authenticated with the API
        try {
          const isAuth = await isAuthenticated();

          if (isAuth) {
            // Dispatch user to Redux store
            // We don't have user details from the token yet, so use email
            dispatch(
              setUser({
                id: email, // Using email as ID
                email: email,
              })
            );

            // Redirect to admin page
            router.push('/admin');
          } else {
            console.error('API authentication failed');
            setVerificationError('Authentication failed. Please try again.');
          }
        } catch (authError) {
          console.error('Error checking authentication:', authError);
          setVerificationError('Authentication check failed. Please try again.');
        }
      } else {
        console.error('OTP verification failed');
        setVerificationError(result.error || 'Invalid verification code. Please try again.');
      }
    } catch (error) {
      console.error('Error during OTP verification:', error);
      setVerificationError('Verification failed. Please try again.');
    } finally {
      setIsCodeSubmitting(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CODE_LENGTH) {
      setCode(value);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <MainCard>
        <div className="space-y-8 w-full max-w-sm mx-auto">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">Welcome Back</h2>
            <p className="text-sm text-muted-foreground">
              Enter your email to receive a secure login code
            </p>
          </div>

          <div className="bg-secondary/50 rounded-lg p-6 space-y-6">
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  disabled={showCode || isEmailSubmitting}
                  className={`w-full ${emailError ? 'border-red-500' : ''}`}
                  maxLength={MAX_EMAIL_LENGTH}
                />
                {emailError && (
                  <div className="flex items-center text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {emailError}
                  </div>
                )}
              </div>
              {!showCode && (
                <LoadingButton
                  type="submit"
                  isLoading={isEmailSubmitting}
                  text="Send Code"
                  className="w-full"
                />
              )}
            </form>

            {showCode && (
              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Enter verification code"
                    value={code}
                    onChange={handleCodeChange}
                    disabled={isCodeSubmitting}
                    className={`w-full ${verificationError ? 'border-red-500' : ''}`}
                    maxLength={MAX_CODE_LENGTH}
                  />
                  {verificationError && (
                    <div className="flex items-center text-red-500 text-sm">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {verificationError}
                    </div>
                  )}
                </div>
                <LoadingButton
                  type="submit"
                  isLoading={isCodeSubmitting}
                  text="Verify & Login"
                  className="w-full"
                />
              </form>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
            >
              Back to home
            </button>
          </div>
        </div>
      </MainCard>
    </div>
  );
}

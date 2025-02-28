"use client";
import MainCard from "@/components/MainCard";
import { setUser } from "../store/features/authSlice";
import { useAppDispatch } from "../store/hooks";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { initiateLogin, verifyOTP } from "@/helpers/auth";
import { LoadingButton } from "@/components/ui/loading-button";
import { AlertCircle } from "lucide-react";

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

    const cardTitle = "ASA Racing Login";
    
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
        } catch (error) {
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
            const result = await verifyOTP(email, code, session || '');
            if (result.success) {
                dispatch(setUser({ id: '1', email: email }));
                router.push('/admin');
            } else {
                setVerificationError(result.error || 'Invalid verification code. Please try again.');
            }
        } catch (error) {
            setVerificationError('An unexpected error occurred. Please try again later.');
            console.error('Error during code submission:', error);
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
        <MainCard title={cardTitle}>
            <div className="space-y-6 w-full max-w-sm mx-auto">
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
                        />
                    </form>
                )}
            </div>
        </MainCard>
    )
}

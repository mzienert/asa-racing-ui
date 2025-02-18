"use client";
import MainCard from "@/components/MainCard";
import { setUser } from "../store/features/authSlice";
import { useAppDispatch } from "../store/hooks";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { initiateLogin, verifyCode } from "../api/auth";

export default function Page() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [showCode, setShowCode] = useState(false);

    const cardTitle = "ASA Racing Login";
    
    const handleEmailSubmit = async (e: React.FormEvent) => {
/*         e.preventDefault();
        const result = await initiateLogin(email);
        if (result) {
            setShowCode(true);
        } */
    };

    const handleCodeSubmit = async (e: React.FormEvent) => {
/*         e.preventDefault();
        const result = await verifyCode(email, code);
        if (result) {
            dispatch(
                setUser({
                    id: '1',
                    email: email,
                })
            );
            router.push('/');
        } */





            
    };
      
    return (
        <MainCard title={cardTitle}>
            <div className="space-y-6 w-full max-w-sm mx-auto">
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <Input
                        type="string"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={showCode}
                        className="w-full"
                    />
                    {!showCode && (
                        <button 
                            type="submit"
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md"
                        >
                            Send Code
                        </button>
                    )}
                </form>

                {showCode && (
                    <form onSubmit={handleCodeSubmit} className="space-y-4">
                        <Input
                            type="text"
                            placeholder="Enter verification code"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full"
                        />
                        <button 
                            type="submit"
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md"
                        >
                            Verify & Login
                        </button>
                    </form>
                )}
            </div>
        </MainCard>
    )
}

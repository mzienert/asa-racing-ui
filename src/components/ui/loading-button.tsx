import { ButtonHTMLAttributes } from 'react';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading: boolean;
    text: string;
    loadingText?: string;
}

export function LoadingButton({ 
    isLoading, 
    text, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    loadingText,
    className = '', 
    disabled,
    ...props 
}: LoadingButtonProps) {
    return (
        <button 
            disabled={isLoading || disabled}
            className={`w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md disabled:opacity-50 flex items-center justify-center ${className}`}
            {...props}
        >
            {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
                text
            )}
        </button>
    );
}
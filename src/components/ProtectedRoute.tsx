import { useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '../helpers/auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authenticated = await isAuthenticated();

        if (!authenticated) {
          // Redirect to home page if not authenticated
          router.push('/');
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        // Redirect on error as a safety measure
        router.push('/');
      }
    };

    checkAuth();
  }, [router]);

  // Show nothing while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If we get here, user is authenticated
  return <>{children}</>;
}

'use client';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/features/authSlice';
import MainCard from '@/components/MainCard';
import { LogIn, Flag, Timer } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector(state => state.auth.user);
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

  const cardTitle = 'ASA Racing';

  const handleLogout = () => {
    dispatch(logout());
  };

  return isAuthenticated ? (
    <>
      <p>Welcome, {user?.email}</p>
      <button onClick={handleLogout}>Logout</button>
    </>
  ) : (
    <>
      <div className="min-h-screen w-full flex items-center justify-center">
        <MainCard title={cardTitle}>
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-8">Welcome to ASA Racing</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer">
                <Timer className="w-8 h-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold">Race Times</h3>
                  <p className="text-sm text-muted-foreground">Check schedules</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer">
                <Flag className="w-8 h-8 text-red-500" />
                <div>
                  <h3 className="font-semibold">Events</h3>
                  <p className="text-sm text-muted-foreground">Upcoming races</p>
                </div>
              </div>
            </div>

            <div className="text-center mt-6">
              <button
                onClick={() => router.push('/login')}
                className="text-sm text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors"
              >
                Sign in to access all features
              </button>
            </div>
          </div>
        </MainCard>
      </div>
      <div className="absolute bottom-4 left-4">
        <button
          onClick={() => router.push('/login')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Login"
        >
          <LogIn className="w-6 h-6" />
        </button>
      </div>
    </>
  );
}

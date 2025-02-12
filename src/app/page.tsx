'use client'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { logout, setUser } from './store/features/authSlice'
import MainCard from '@/components/MainCard'
import { LogIn } from "lucide-react";
import { useRouter } from 'next/navigation'

export default function Page() {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const user = useAppSelector((state) => state.auth.user)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  const cardTitle = "ASA Racing";

  const handleLogin = () => {
    dispatch(
      setUser({
        id: '1',
        email: 'user@example.com',
      })
    )
  }
  
  const handleLogout = () => {
    dispatch(logout())
  }

  return isAuthenticated ? (
    <>
      <p>Welcome, {user?.email}</p>
      <button onClick={handleLogout}>Logout</button>
    </>
  ) : (
    <>
      <MainCard title={cardTitle}>
        <p>Hello</p>
      </MainCard>
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
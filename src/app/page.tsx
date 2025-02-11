'use client'
import { useAppDispatch, useAppSelector } from './store/hooks'
import { setUser, logout } from './store/features/authSlice'

import Link from 'next/link'

export default function Page() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  console.log('process.env.NODE_ENV', process.env.NODE_ENV)
  const handleLogin = () => {
    dispatch(setUser({
      id: '1',
      email: 'user@example.com'
    }))
  }

  const handleLogout = () => {
    dispatch(logout())
  }

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user?.email}</p>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
      {/*<Link href="/blog/">Blog</Link>*/}
    </div>
  )
}
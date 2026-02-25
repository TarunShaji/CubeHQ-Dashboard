'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function App() {
  const router = useRouter()
  useEffect(() => {
    const token = localStorage.getItem('agency_token')
    if (token) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }, [])
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-400">Loading...</div>
    </div>
  )
}

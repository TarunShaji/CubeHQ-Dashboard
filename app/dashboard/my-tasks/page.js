'use client'

import { useEffect, useState } from 'react'
import { apiFetch, getUser } from '@/lib/auth'
import AllTasksPage from '../tasks/page'

export default function MyTasksPage() {
    const [user, setUser] = useState(null)

    useEffect(() => {
        setUser(getUser())
    }, [])

    if (!user) return <div className="p-6 text-gray-400">Loading your tasks...</div>

    return <AllTasksPage initialAssigneeId={user.id} />
}

'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '@/lib/auth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const statusColors = {
  'Completed': 'bg-green-100 text-green-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'To Be Approved': 'bg-amber-100 text-amber-700',
  'Blocked': 'bg-red-100 text-red-700',
  'To Be Started': 'bg-gray-100 text-gray-600',
  'Recurring': 'bg-purple-100 text-purple-700',
}

export default function TeamPage() {
  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [selectedMember, setSelectedMember] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([apiFetch('/api/team'), apiFetch('/api/tasks')])
      .then(([mr, tr]) => Promise.all([mr.json(), tr.json()]))
      .then(([m, t]) => {
        setMembers(m || [])
        setTasks(t || [])
        setLoading(false)
      })
  }, [])

  const filtered = selectedMember
    ? tasks.filter(t => t.assigned_to === selectedMember)
    : tasks

  // Group by client
  const byClient = filtered.reduce((acc, task) => {
    const key = task.client_name || 'Unknown'
    if (!acc[key]) acc[key] = []
    acc[key].push(task)
    return acc
  }, {})

  const selectedMemberData = members.find(m => m.id === selectedMember)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Team View</h1>
        <p className="text-gray-500 text-sm mt-1">Tasks by team member</p>
      </div>

      {/* Member Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {members.map(m => {
          const memberTasks = tasks.filter(t => t.assigned_to === m.id)
          const inProgress = memberTasks.filter(t => t.status === 'In Progress').length
          return (
            <button
              key={m.id}
              onClick={() => setSelectedMember(selectedMember === m.id ? '' : m.id)}
              className={`text-left p-3 rounded-lg border transition-all ${
                selectedMember === m.id
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-blue-700 font-semibold text-sm">{m.name.charAt(0)}</span>
              </div>
              <div className="text-sm font-medium text-gray-900">{m.name}</div>
              <div className="text-xs text-gray-400">{m.role}</div>
              <div className="text-xs text-gray-500 mt-1">{memberTasks.length} tasks • {inProgress} active</div>
            </button>
          )
        })}
      </div>

      {/* Tasks by Client */}
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byClient).map(([clientName, clientTasks]) => (
            <Card key={clientName} className="border border-gray-200">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  {clientName}
                  <span className="ml-2 text-xs font-normal text-gray-400">({clientTasks.length} tasks)</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-gray-50">
                    {clientTasks.map(task => (
                      <tr key={task.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-800">{task.title}</td>
                        <td className="px-4 py-2 text-gray-400">{task.category}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            statusColors[task.status] || 'bg-gray-100 text-gray-600'
                          }`}>{task.status}</span>
                        </td>
                        <td className="px-4 py-2 text-gray-400">{task.eta_end || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}
          {Object.keys(byClient).length === 0 && (
            <div className="text-center py-12 text-gray-400">
              {selectedMember ? 'No tasks assigned to this member' : 'No tasks found'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

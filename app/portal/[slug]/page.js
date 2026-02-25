'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExternalLink, BarChart3, CheckCircle2, Clock, Loader2, Lock, ChevronDown, ChevronRight } from 'lucide-react'

const statusColors = {
  'Completed': 'bg-green-100 text-green-700 border-green-200',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
  'To Be Approved': 'bg-amber-100 text-amber-700 border-amber-200',
  'Blocked': 'bg-red-100 text-red-700 border-red-200',
  'To Be Started': 'bg-gray-100 text-gray-600 border-gray-200',
  'Recurring': 'bg-purple-100 text-purple-700 border-purple-200',
}

const typeColors = {
  'Monthly SEO Report': 'bg-blue-50 text-blue-700',
  'Weekly Update': 'bg-green-50 text-green-700',
  'Audit Report': 'bg-purple-50 text-purple-700',
  'Ad Performance': 'bg-orange-50 text-orange-700',
  'Custom': 'bg-gray-50 text-gray-600',
}

export default function ClientPortalPage() {
  const { slug } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [needsPassword, setNeedsPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [clientName, setClientName] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState({})

  const fetchPortal = async (pwd = null) => {
    const headers = { 'Content-Type': 'application/json' }
    if (pwd) headers['X-Portal-Password'] = pwd
    const res = await fetch(`/api/portal/${slug}`, { headers })
    const json = await res.json()

    if (res.status === 401 && json.has_password) {
      setNeedsPassword(true)
      setClientName(json.client_name || '')
      setLoading(false)
      return
    }
    if (!res.ok) {
      setError(json.error || 'Failed to load portal')
      setLoading(false)
      return
    }
    setData(json)
    setNeedsPassword(false)
    setLoading(false)
  }

  useEffect(() => { if (slug) fetchPortal() }, [slug])

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setLoading(true)
    await fetchPortal(password)
    if (needsPassword) {
      setPasswordError('Incorrect password')
      setLoading(false)
    }
  }

  const toggleCategory = (cat) => {
    setCollapsedCategories(c => ({ ...c, [cat]: !c[cat] }))
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
    </div>
  )

  if (needsPassword) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{clientName || 'Client Portal'}</h1>
          <p className="text-slate-400 mt-1">This portal is password protected</p>
        </div>
        <Card className="border-0 shadow-2xl">
          <CardContent className="p-6">
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter portal password"
                  required
                  className="mt-1"
                  autoFocus
                />
              </div>
              {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Access Portal'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-300 text-6xl mb-4">404</div>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  )

  if (!data) return null

  const { client, tasks, reports } = data
  const completed = tasks.filter(t => t.status === 'Completed').length
  const progress = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0

  // Group tasks by category
  const byCategory = tasks.reduce((acc, task) => {
    const cat = task.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(task)
    return acc
  }, {})

  const lastUpdated = tasks.length > 0
    ? new Date(Math.max(...tasks.map(t => new Date(t.updated_at || t.created_at)))).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">{client.name.charAt(0)}</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-900">{client.name}</h1>
                <p className="text-xs text-gray-400">{client.service_type} • Agency Dashboard</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                {client.service_type}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Progress Banner */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Overall Progress</h2>
                <span className="text-sm text-gray-500">{completed}/{tasks.length} tasks completed</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #3b82f6, #1d4ed8)'
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{progress}% complete</span>
                {lastUpdated && <span className="text-xs text-gray-400">Last updated: {lastUpdated}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            {[['Completed', 'text-green-700'], ['In Progress', 'text-blue-700'], ['To Be Approved', 'text-amber-700'], ['Blocked', 'text-red-700']].map(([s, color]) => (
              <div key={s} className="text-center">
                <div className={`text-lg font-bold ${color}`}>
                  {tasks.filter(t => t.status === s).length}
                </div>
                <div className="text-xs text-gray-400">{s}</div>
              </div>
            ))}
          </div>
        </div>

        <Tabs defaultValue="progress">
          <TabsList className="mb-6">
            <TabsTrigger value="progress" className="gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Project Progress
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-1.5">
              <BarChart3 className="w-4 h-4" /> Reports {reports.length > 0 && `(${reports.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress">
            {Object.keys(byCategory).length === 0 ? (
              <div className="text-center py-16 text-gray-400">No tasks available yet.</div>
            ) : (
              <div className="space-y-3">
                {Object.entries(byCategory).map(([category, categoryTasks]) => (
                  <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
                      onClick={() => toggleCategory(category)}
                    >
                      <div className="flex items-center gap-3">
                        {collapsedCategories[category]
                          ? <ChevronRight className="w-4 h-4 text-gray-400" />
                          : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        <span className="font-semibold text-gray-800 text-sm">{category}</span>
                        <span className="text-xs text-gray-400">({categoryTasks.length})</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {categoryTasks.filter(t => t.status === 'Completed').length}/{categoryTasks.length} done
                      </span>
                    </button>

                    {!collapsedCategories[category] && (
                      <table className="w-full text-sm border-t border-gray-100">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left px-5 py-2 text-xs font-semibold text-gray-500">Task</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Status</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">ETA</th>
                            <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {categoryTasks.map(task => (
                            <tr key={task.id} className="hover:bg-gray-50">
                              <td className="px-5 py-2.5">
                                <span className="font-medium text-gray-800 text-sm">{task.title}</span>
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                  statusColors[task.status] || 'bg-gray-100 text-gray-600 border-gray-200'
                                }`}>{task.status}</span>
                              </td>
                              <td className="px-4 py-2.5 text-xs text-gray-500">
                                {task.eta_end ? task.eta_end : '—'}
                              </td>
                              <td className="px-4 py-2.5 text-xs text-gray-500">
                                {task.remarks || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports">
            {reports.length === 0 ? (
              <div className="text-center py-16">
                <BarChart3 className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">No reports available yet.</p>
                <p className="text-gray-300 text-sm mt-1">Reports will appear here when your agency adds them.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.map(report => (
                  <Card key={report.id} className="border border-gray-200 hover:shadow-md transition-all">
                    <CardContent className="p-5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mb-3 ${
                        typeColors[report.report_type] || 'bg-gray-50 text-gray-600'
                      }`}>{report.report_type}</span>
                      <h3 className="font-semibold text-gray-900">{report.title}</h3>
                      <p className="text-sm text-gray-400 mt-0.5">{report.report_date}</p>
                      {report.notes && <p className="text-sm text-gray-500 mt-2">{report.notes}</p>}
                      <a
                        href={report.report_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        View Report <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center text-xs text-gray-300">
          Powered by Agency Hub
        </div>
      </div>
    </div>
  )
}

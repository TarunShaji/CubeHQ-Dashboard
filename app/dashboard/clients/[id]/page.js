'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, ExternalLink, Trash2, Save, Link2, Settings, BarChart3 } from 'lucide-react'

const STATUSES = ['To Be Started', 'In Progress', 'To Be Approved', 'Completed', 'Recurring', 'Blocked']
const CATEGORIES = ['SEO & Content', 'Design', 'Development', 'Page Speed', 'Technical SEO', 'Link Building', 'Paid Ads', 'Email Marketing', 'LLM SEO', 'Reporting', 'Other']
const PRIORITIES = ['P0', 'P1', 'P2', 'P3']
const REPORT_TYPES = ['Monthly SEO Report', 'Weekly Update', 'Audit Report', 'Ad Performance', 'Custom']
const SERVICE_TYPES = ['SEO', 'Email Marketing', 'Paid Ads', 'SEO + Email', 'SEO + Paid Ads', 'All']

const statusColors = {
  'Completed': 'bg-green-100 text-green-700 border-green-200',
  'In Progress': 'bg-blue-100 text-blue-700 border-blue-200',
  'To Be Approved': 'bg-amber-100 text-amber-700 border-amber-200',
  'Blocked': 'bg-red-100 text-red-700 border-red-200',
  'To Be Started': 'bg-gray-100 text-gray-600 border-gray-200',
  'Recurring': 'bg-purple-100 text-purple-700 border-purple-200',
}

const priorityColors = {
  'P0': 'bg-red-100 text-red-700',
  'P1': 'bg-orange-100 text-orange-700',
  'P2': 'bg-yellow-100 text-yellow-700',
  'P3': 'bg-gray-100 text-gray-600',
}

function EditableCell({ value, type = 'text', options = [], onSave, className = '' }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(value || '')
  const inputRef = useRef(null)

  useEffect(() => { setVal(value || '') }, [value])
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus() }, [editing])

  const save = () => {
    setEditing(false)
    if (val !== (value || '')) onSave(val)
  }

  if (editing) {
    if (type === 'select') {
      return (
        <Select value={val} onValueChange={v => { setVal(v); setEditing(false); if (v !== (value || '')) onSave(v) }}>
          <SelectTrigger className="h-7 text-xs border-blue-400 shadow-sm min-w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map(o => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}
          </SelectContent>
        </Select>
      )
    }
    return (
      <input
        ref={inputRef}
        type={type === 'date' ? 'date' : 'text'}
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={e => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') { setVal(value || ''); setEditing(false) }
        }}
        className={`w-full px-2 py-1 text-xs border border-blue-400 rounded shadow-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 ${className}`}
      />
    )
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className={`cursor-pointer hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 rounded px-1 py-0.5 min-h-[24px] min-w-[60px] transition-all ${className}`}
      title="Click to edit"
    >
      {type === 'status' ? (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
          statusColors[val] || 'bg-gray-100 text-gray-600 border-gray-200'
        }`}>{val || '—'}</span>
      ) : type === 'priority' ? (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          priorityColors[val] || 'bg-gray-100 text-gray-600'
        }`}>{val || '—'}</span>
      ) : (
        <span className="text-xs text-gray-700">{val || <span className="text-gray-300">—</span>}</span>
      )}
    </div>
  )
}

export default function ClientDetailPage() {
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [tasks, setTasks] = useState([])
  const [reports, setReports] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [newTask, setNewTask] = useState({ title: '' })
  const [addingTask, setAddingTask] = useState(false)
  const [showAddReport, setShowAddReport] = useState(false)
  const [reportForm, setReportForm] = useState({ title: '', report_type: 'Monthly SEO Report', report_url: '', report_date: '', notes: '' })
  const [showSettings, setShowSettings] = useState(false)
  const [settingsForm, setSettingsForm] = useState({})
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || ''

  const loadData = async () => {
    const [clientRes, tasksRes, reportsRes, membersRes] = await Promise.all([
      apiFetch(`/api/clients/${id}`),
      apiFetch(`/api/tasks?client_id=${id}`),
      apiFetch(`/api/reports?client_id=${id}`),
      apiFetch('/api/team')
    ])
    const [clientData, tasksData, reportsData, membersData] = await Promise.all([
      clientRes.json(), tasksRes.json(), reportsRes.json(), membersRes.json()
    ])
    setClient(clientData)
    setSettingsForm(clientData)
    setTasks(tasksData || [])
    setReports(reportsData || [])
    setMembers(membersData || [])
    setLoading(false)
  }

  useEffect(() => { if (id) loadData() }, [id])

  const updateTask = async (taskId, field, value) => {
    setSaving(s => ({ ...s, [taskId]: true }))
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, [field]: value } : t))
    await apiFetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ [field]: value })
    })
    setSaving(s => ({ ...s, [taskId]: false }))
  }

  const addTask = async () => {
    if (!newTask.title.trim()) return
    setAddingTask(true)
    const res = await apiFetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ ...newTask, client_id: id })
    })
    const task = await res.json()
    setTasks(ts => [...ts, task])
    setNewTask({ title: '' })
    setAddingTask(false)
  }

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return
    await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    setTasks(ts => ts.filter(t => t.id !== taskId))
  }

  const addReport = async (e) => {
    e.preventDefault()
    const res = await apiFetch('/api/reports', {
      method: 'POST',
      body: JSON.stringify({ ...reportForm, client_id: id })
    })
    const report = await res.json()
    setReports(rs => [...rs, report])
    setShowAddReport(false)
    setReportForm({ title: '', report_type: 'Monthly SEO Report', report_url: '', report_date: '', notes: '' })
  }

  const saveSettings = async (e) => {
    e.preventDefault()
    await apiFetch(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(settingsForm)
    })
    setClient(settingsForm)
    setShowSettings(false)
  }

  const deleteReport = async (reportId) => {
    if (!confirm('Delete this report?')) return
    await apiFetch(`/api/reports/${reportId}`, { method: 'DELETE' })
    setReports(rs => rs.filter(r => r.id !== reportId))
  }

  const completedTasks = tasks.filter(t => t.status === 'Completed').length
  const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
  const memberMap = Object.fromEntries(members.map(m => [m.id, m.name]))

  if (loading) return <div className="p-8 text-gray-400">Loading...</div>
  if (!client) return <div className="p-8 text-gray-400">Client not found</div>

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Link href="/dashboard/clients" className="hover:text-gray-600">Clients</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">{client.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              {client.service_type}
            </span>
            <a href={`${BASE_URL}/portal/${client.slug}`} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
              Portal Link <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="gap-1">
          <Settings className="w-4 h-4" /> Settings
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6 bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-500">{completedTasks}/{tasks.length} tasks completed</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-right mt-1 text-xs text-gray-400">{progress}%</div>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList className="mb-4">
          <TabsTrigger value="timeline">Timeline Tracker</TabsTrigger>
          <TabsTrigger value="reports" className="gap-1">
            <BarChart3 className="w-3.5 h-3.5" /> Reports {reports.length > 0 && `(${reports.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <div className="bg-white border border-gray-200 rounded-lg overflow-auto">
            <table className="w-full text-sm" style={{ minWidth: '900px' }}>
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600 w-8"></th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600" style={{minWidth:'180px'}}>Task</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Category</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Duration</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Status</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Priority</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600">ETA Start</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600">ETA End</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Assigned To</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Remarks</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Link</th>
                  <th className="px-3 py-2.5 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.map(task => (
                  <tr key={task.id} className="hover:bg-gray-50 group relative">
                    <td className="px-3 py-1.5">
                      {saving[task.id] && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                    </td>
                    <td className="px-3 py-1.5">
                      <EditableCell value={task.title} onSave={v => updateTask(task.id, 'title', v)} />
                    </td>
                    <td className="px-3 py-1.5">
                      <EditableCell value={task.category} type="select" options={CATEGORIES} onSave={v => updateTask(task.id, 'category', v)} />
                    </td>
                    <td className="px-3 py-1.5">
                      <EditableCell value={task.duration_days} onSave={v => updateTask(task.id, 'duration_days', v)} />
                    </td>
                    <td className="px-3 py-1.5">
                      <EditableCell value={task.status} type="status" options={STATUSES} onSave={v => updateTask(task.id, 'status', v)} />
                    </td>
                    <td className="px-3 py-1.5">
                      <EditableCell value={task.priority} type="priority" options={PRIORITIES} onSave={v => updateTask(task.id, 'priority', v)} />
                    </td>
                    <td className="px-3 py-1.5">
                      <EditableCell value={task.eta_start} type="date" onSave={v => updateTask(task.id, 'eta_start', v)} />
                    </td>
                    <td className="px-3 py-1.5">
                      <EditableCell value={task.eta_end} type="date" onSave={v => updateTask(task.id, 'eta_end', v)} />
                    </td>
                    <td className="px-3 py-1.5">
                      <EditableCell
                        value={memberMap[task.assigned_to] || ''}
                        type="select"
                        options={['', ...members.map(m => m.name)]}
                        onSave={v => {
                          const member = members.find(m => m.name === v)
                          updateTask(task.id, 'assigned_to', member?.id || null)
                        }}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <EditableCell value={task.remarks} onSave={v => updateTask(task.id, 'remarks', v)} />
                    </td>
                    <td className="px-3 py-1.5">
                      {task.link_url ? (
                        <div className="flex items-center gap-1">
                          <a href={task.link_url} target="_blank" rel="noopener noreferrer"
                             className="text-blue-600 hover:text-blue-800" onClick={e => e.stopPropagation()}>
                            <Link2 className="w-3.5 h-3.5" />
                          </a>
                          <EditableCell value={task.link_url} onSave={v => updateTask(task.id, 'link_url', v)} />
                        </div>
                      ) : (
                        <EditableCell value={task.link_url} onSave={v => updateTask(task.id, 'link_url', v)} />
                      )}
                    </td>
                    <td className="px-3 py-1.5">
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Add Row */}
                <tr className="bg-gray-50 border-t border-dashed border-gray-200">
                  <td className="px-3 py-2" colSpan={2}>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={e => setNewTask(n => ({ ...n, title: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && addTask()}
                      placeholder="+ Add a task..."
                      className="w-full text-xs px-2 py-1 bg-transparent border border-dashed border-gray-300 rounded focus:outline-none focus:border-blue-400 focus:bg-white"
                      disabled={addingTask}
                    />
                  </td>
                  <td colSpan={10} className="px-3 py-2">
                    <Button size="sm" variant="ghost" onClick={addTask} disabled={addingTask || !newTask.title.trim()} className="text-xs h-7">
                      <Plus className="w-3 h-3 mr-1" />{addingTask ? 'Adding...' : 'Add'}
                    </Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setShowAddReport(true)} className="gap-1" size="sm">
              <Plus className="w-4 h-4" /> Add Report
            </Button>
          </div>
          {reports.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-gray-200" />
              No reports yet. Add your first report.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map(report => (
                <Card key={report.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{report.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{report.report_type}</p>
                        <p className="text-xs text-gray-400 mt-1">{report.report_date}</p>
                        {report.notes && <p className="text-xs text-gray-500 mt-2">{report.notes}</p>}
                      </div>
                      <button onClick={() => deleteReport(report.id)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <a href={report.report_url} target="_blank" rel="noopener noreferrer"
                       className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700">
                      View Report <ExternalLink className="w-3 h-3" />
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Report Dialog */}
      <Dialog open={showAddReport} onOpenChange={setShowAddReport}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Report</DialogTitle></DialogHeader>
          <form onSubmit={addReport} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={reportForm.title} onChange={e => setReportForm(f => ({ ...f, title: e.target.value }))} required placeholder="May 2025 SEO Report" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select value={reportForm.report_type} onValueChange={v => setReportForm(f => ({ ...f, report_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{REPORT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Report URL</label>
              <Input value={reportForm.report_url} onChange={e => setReportForm(f => ({ ...f, report_url: e.target.value }))} required placeholder="https://docs.google.com/..." className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={reportForm.report_date} onChange={e => setReportForm(f => ({ ...f, report_date: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input value={reportForm.notes} onChange={e => setReportForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" className="mt-1" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddReport(false)}>Cancel</Button>
              <Button type="submit">Add Report</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader><DialogTitle>Client Settings</DialogTitle></DialogHeader>
          <form onSubmit={saveSettings} className="space-y-3">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={settingsForm.name || ''} onChange={e => setSettingsForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Service Type</label>
              <Select value={settingsForm.service_type || 'SEO'} onValueChange={v => setSettingsForm(f => ({ ...f, service_type: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>{SERVICE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Portal Password <span className="text-gray-400 text-xs">(leave empty for public)</span></label>
              <Input value={settingsForm.portal_password || ''} onChange={e => setSettingsForm(f => ({ ...f, portal_password: e.target.value }))} placeholder="Optional password" className="mt-1" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowSettings(false)}>Cancel</Button>
              <Button type="submit">Save Settings</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

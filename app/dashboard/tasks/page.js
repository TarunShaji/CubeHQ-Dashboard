'use client'

import { useEffect, useState, useRef } from 'react'
import { apiFetch } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, Trash2, RefreshCw, Link2 } from 'lucide-react'

const STATUS_OPTIONS = ['To Be Started', 'In Progress', 'To Be Approved', 'Completed', 'Recurring', 'Blocked']
const CATEGORY_OPTIONS = ['SEO & Content', 'Design', 'Development', 'Page Speed', 'Technical SEO', 'Link Building', 'Paid Ads', 'Email Marketing', 'LLM SEO', 'Reporting', 'Other']
const PRIORITY_OPTIONS = ['P0', 'P1', 'P2', 'P3']

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

function EditableCell({ value, type = 'text', options = [], onSave }) {
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
    if (type === 'select' || type === 'status' || type === 'priority') {
      return (
        <Select
          value={val || '__none__'}
          onValueChange={v => {
            const realVal = v === '__none__' ? '' : v
            setVal(realVal)
            setEditing(false)
            if (realVal !== (value || '')) onSave(realVal)
          }}
        >
          <SelectTrigger className="h-7 text-xs border-blue-400 shadow-sm min-w-[110px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__" className="text-xs text-gray-400">(none)</SelectItem>
            {options.map(o => (
              <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>
            ))}
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
        className="w-full px-2 py-1 text-xs border border-blue-400 rounded shadow-sm bg-white focus:outline-none min-w-[80px]"
      />
    )
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="cursor-pointer hover:bg-blue-50 hover:ring-1 hover:ring-blue-200 rounded px-1 py-0.5 min-h-[24px] min-w-[60px] transition-all"
      title="Click to edit"
    >
      {type === 'status' ? (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[val] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
          {val || '—'}
        </span>
      ) : type === 'priority' ? (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${priorityColors[val] || 'bg-gray-100 text-gray-600'}`}>
          {val || '—'}
        </span>
      ) : (
        <span className="text-xs text-gray-700 whitespace-nowrap">{val || <span className="text-gray-300">—</span>}</span>
      )}
    </div>
  )
}

function LinkCell({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState(value || '')
  const inputRef              = useRef(null)

  useEffect(() => setVal(value || ''), [value])
  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus() }, [editing])

  const save = () => {
    setEditing(false)
    if (val !== (value || '')) onSave(val)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="url"
        value={val}
        onChange={e => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={e => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') { setVal(value || ''); setEditing(false) }
        }}
        className="w-full px-2 py-1 text-xs border border-blue-400 rounded bg-white focus:outline-none min-w-[160px]"
        placeholder="https://..."
      />
    )
  }

  if (val) {
    return (
      <div className="flex items-center gap-1">
        <a
          href={val} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-medium transition-colors"
          title={val}
        >
          <Link2 className="w-3 h-3" /> Open
        </a>
        <button
          onClick={() => setEditing(true)}
          className="text-gray-300 hover:text-gray-500 p-0.5 rounded"
          title="Edit link"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="inline-flex items-center gap-1 text-xs text-gray-300 hover:text-blue-500 transition-colors px-1 py-0.5 rounded hover:bg-blue-50"
      title="Add link"
    >
      <Link2 className="w-3 h-3" /> Add link
    </button>
  )
}

export default function AllTasksPage() {
  const [tasks, setTasks] = useState([])
  const [clients, setClients] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [selected, setSelected] = useState([])
  const [bulkAction, setBulkAction] = useState('__none__')
  const [newTask, setNewTask] = useState({ title: '', client_id: '' })
  const [addingTask, setAddingTask] = useState(false)

  // Filters – use sentinel 'all' so SelectItem never gets value=""
  const [filterClient, setFilterClient] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterAssignee, setFilterAssignee] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir]     = useState('desc')

  const loadData = async () => {
    const params = new URLSearchParams()
    if (filterClient !== 'all') params.set('client_id', filterClient)
    if (filterStatus !== 'all') params.set('status', filterStatus)
    if (filterCategory !== 'all') params.set('category', filterCategory)
    if (filterAssignee !== 'all') params.set('assigned_to', filterAssignee)
    if (filterPriority !== 'all') params.set('priority', filterPriority)

    const [tasksRes, clientsRes, membersRes] = await Promise.all([
      apiFetch(`/api/tasks?${params.toString()}`),
      apiFetch('/api/clients'),
      apiFetch('/api/team'),
    ])
    const [tasksData, clientsData, membersData] = await Promise.all([
      tasksRes.json(), clientsRes.json(), membersRes.json(),
    ])
    setTasks(tasksData || [])
    setClients(clientsData || [])
    setMembers(membersData || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [filterClient, filterStatus, filterCategory, filterAssignee, filterPriority])

  const updateTask = async (taskId, field, value) => {
    setSaving(s => ({ ...s, [taskId]: true }))
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, [field]: value } : t))
    await apiFetch(`/api/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify({ [field]: value }) })
    setSaving(s => ({ ...s, [taskId]: false }))
  }

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return
    await apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' })
    setTasks(ts => ts.filter(t => t.id !== taskId))
  }

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])

  const handleBulkAction = async () => {
    if (!bulkAction || bulkAction === '__none__' || selected.length === 0) return
    const [field, value] = bulkAction.split(':')
    await apiFetch('/api/tasks/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ task_ids: selected, updates: { [field]: value } }),
    })
    setSelected([])
    setBulkAction('__none__')
    loadData()
  }

  const addTask = async () => {
    if (!newTask.title.trim() || !newTask.client_id) return
    setAddingTask(true)
    const res = await apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(newTask) })
    const task = await res.json()
    setTasks(ts => [task, ...ts])
    setNewTask(n => ({ ...n, title: '' }))
    setAddingTask(false)
  }

  const memberMap = Object.fromEntries(members.map(m => [m.id, m.name]))
  const anyFilter = filterClient !== 'all' || filterStatus !== 'all' || filterCategory !== 'all' || filterAssignee !== 'all' || filterPriority !== 'all'

  const sorted = [...tasks].sort((a, b) => {
    const va = a[sortField] || ''
    const vb = b[sortField] || ''
    return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
  })

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }) => (
    <span className="ml-1 text-gray-400">{sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : ''}</span>
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">{tasks.length} tasks across all clients</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-1">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4 p-3 bg-white border border-gray-200 rounded-lg">
        <Select value={filterClient} onValueChange={setFilterClient}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="All Clients" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Clients</SelectItem>
            {clients.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
            {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Categories</SelectItem>
            {CATEGORY_OPTIONS.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="h-8 text-xs w-36"><SelectValue placeholder="All Members" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Members</SelectItem>
            {members.map(m => <SelectItem key={m.id} value={m.id} className="text-xs">{m.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="h-8 text-xs w-28"><SelectValue placeholder="All Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Priority</SelectItem>
            {PRIORITY_OPTIONS.map(p => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
          </SelectContent>
        </Select>

        {anyFilter && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-400" onClick={() => {
            setFilterClient('all'); setFilterStatus('all'); setFilterCategory('all')
            setFilterAssignee('all'); setFilterPriority('all')
          }}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Bulk actions bar */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 mb-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm text-blue-700 font-medium">{selected.length} selected</span>
          <Select value={bulkAction} onValueChange={setBulkAction}>
            <SelectTrigger className="h-7 text-xs w-48 bg-white">
              <SelectValue placeholder="Bulk action..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__" className="text-xs text-gray-400">Choose action…</SelectItem>
              <SelectItem value="status:In Progress" className="text-xs">Set: In Progress</SelectItem>
              <SelectItem value="status:Completed" className="text-xs">Set: Completed</SelectItem>
              <SelectItem value="status:Blocked" className="text-xs">Set: Blocked</SelectItem>
              <SelectItem value="status:To Be Approved" className="text-xs">Set: To Be Approved</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="h-7 text-xs" onClick={handleBulkAction} disabled={bulkAction === '__none__'}>Apply</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected([])}>Clear</Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-auto">
        <table className="w-full text-sm" style={{ minWidth: '1100px' }}>
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-2.5 w-8">
                <Checkbox
                  checked={selected.length === tasks.length && tasks.length > 0}
                  onCheckedChange={v => setSelected(v ? tasks.map(t => t.id) : [])}
                />
              </th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600 cursor-pointer hover:text-gray-900 w-28" onClick={() => handleSort('client_name')}>
                Client <SortIcon field="client_name" />
              </th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600 cursor-pointer hover:text-gray-900" style={{ minWidth: '160px' }} onClick={() => handleSort('title')}>
                Task <SortIcon field="title" />
              </th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Category</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('status')}>
                Status <SortIcon field="status" />
              </th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('priority')}>
                Priority <SortIcon field="priority" />
              </th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Assigned To</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600 cursor-pointer hover:text-gray-900" onClick={() => handleSort('eta_end')}>
                ETA <SortIcon field="eta_end" />
              </th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Client Approval</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Link</th>
              <th className="text-left px-3 py-2.5 font-semibold text-gray-600">Remarks</th>
              <th className="px-3 py-2.5 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={12} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : sorted.length === 0 ? (
              <tr><td colSpan={12} className="px-4 py-8 text-center text-gray-400">No tasks found</td></tr>
            ) : sorted.map(task => (
              <tr key={task.id} className={`hover:bg-gray-50 group ${selected.includes(task.id) ? 'bg-blue-50' : ''}`}>
                <td className="px-3 py-1.5">
                  <Checkbox checked={selected.includes(task.id)} onCheckedChange={() => toggleSelect(task.id)} />
                </td>
                <td className="px-3 py-1.5">
                  <span className="text-xs font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                    {task.client_name || '?'}
                  </span>
                </td>
                <td className="px-3 py-1.5">
                  <EditableCell value={task.title} onSave={v => updateTask(task.id, 'title', v)} />
                </td>
                <td className="px-3 py-1.5">
                  <EditableCell value={task.category} type="select" options={CATEGORY_OPTIONS} onSave={v => updateTask(task.id, 'category', v)} />
                </td>
                <td className="px-3 py-1.5">
                  <EditableCell value={task.status} type="status" options={STATUS_OPTIONS} onSave={v => updateTask(task.id, 'status', v)} />
                </td>
                <td className="px-3 py-1.5">
                  <EditableCell value={task.priority} type="priority" options={PRIORITY_OPTIONS} onSave={v => updateTask(task.id, 'priority', v)} />
                </td>
                <td className="px-3 py-1.5">
                  <EditableCell
                    value={memberMap[task.assigned_to] || ''}
                    type="select"
                    options={members.map(m => m.name)}
                    onSave={v => {
                      const member = members.find(m => m.name === v)
                      updateTask(task.id, 'assigned_to', member?.id || null)
                    }}
                  />
                </td>
                <td className="px-3 py-1.5">
                  <EditableCell value={task.eta_end} type="date" onSave={v => updateTask(task.id, 'eta_end', v)} />
                </td>
                <td className="px-3 py-1.5">
                  {/* Client Approval badge (read-only in internal view — team sets it via client detail) */}
                  {task.client_approval && task.client_approval !== 'Pending Review' ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                      task.client_approval === 'Approved'
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-red-100 text-red-700 border-red-200'
                    }`}>{task.client_approval}</span>
                  ) : (
                    <span className="text-xs text-gray-300">Pending</span>
                  )}
                </td>
                <td className="px-3 py-1.5">
                  {task.link_url ? (
                    <a href={task.link_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-medium">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      Link
                    </a>
                  ) : <span className="text-xs text-gray-300">—</span>}
                </td>
                <td className="px-3 py-1.5">
                  <EditableCell value={task.remarks} onSave={v => updateTask(task.id, 'remarks', v)} />
                </td>
                <td className="px-3 py-1.5">
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-400 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}

            {/* Quick Add Row */}
            <tr className="bg-gray-50 border-t border-dashed border-gray-200">
              <td className="px-3 py-2"></td>
              <td className="px-3 py-2">
                <Select
                  value={newTask.client_id || '__none__'}
                  onValueChange={v => setNewTask(n => ({ ...n, client_id: v === '__none__' ? '' : v }))}
                >
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__" className="text-xs text-gray-400">Select client…</SelectItem>
                    {clients.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </td>
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
              <td colSpan={6} className="px-3 py-2">
                <Button
                  size="sm" variant="ghost" onClick={addTask}
                  disabled={addingTask || !newTask.title.trim() || !newTask.client_id || newTask.client_id === '__none__'}
                  className="text-xs h-7"
                >
                  <Plus className="w-3 h-3 mr-1" />{addingTask ? 'Adding...' : 'Add'}
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

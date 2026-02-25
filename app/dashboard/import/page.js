'use client'

import { useState } from 'react'
import { apiFetch } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEffect } from 'react'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'

const STATUS_MAP = {
  'implemented/ completed': 'Completed',
  'completed': 'Completed',
  'work in progress': 'In Progress',
  'in progress': 'In Progress',
  'to be approved': 'To Be Approved',
  'fixed': 'Completed',
  'recurring': 'Recurring',
  'blocked': 'Blocked',
  'to be started': 'To Be Started',
  'not started': 'To Be Started',
  'pending': 'To Be Started',
  'done': 'Completed',
}

function mapStatus(s) {
  if (!s) return 'To Be Started'
  return STATUS_MAP[s.toLowerCase().trim()] || 'To Be Started'
}

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase())
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const row = {}
    headers.forEach((h, i) => { row[h] = values[i] || '' })
    return row
  })
  return { headers, rows }
}

function parseTabSeparated(text) {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = lines[0].split('\t').map(h => h.trim().toLowerCase())
  const rows = lines.slice(1).map(line => {
    const values = line.split('\t').map(v => v.trim())
    const row = {}
    headers.forEach((h, i) => { row[h] = values[i] || '' })
    return row
  })
  return { headers, rows }
}

function rowToTask(row, headers, clientId) {
  // Try to auto-detect columns
  const titleField = headers.find(h => h.includes('to-do') || h.includes('todo') || h.includes('task') || h === 'title') || headers[0]
  const statusField = headers.find(h => h.includes('status'))
  const categoryField = headers.find(h => h.includes('category') || h.includes('type'))
  const durationField = headers.find(h => h.includes('duration') || h.includes('days'))
  const remarksField = headers.find(h => h.includes('remark') || h.includes('note') || h.includes('comment'))
  const etaField = headers.find(h => h.includes('eta') || h.includes('date') || h.includes('deadline'))

  return {
    client_id: clientId,
    title: row[titleField] || '',
    status: mapStatus(row[statusField] || ''),
    category: row[categoryField] || 'Other',
    duration_days: row[durationField] || '',
    remarks: row[remarksField] || '',
    eta_end: row[etaField] || null,
    priority: 'P2',
  }
}

export default function ImportPage() {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState('')
  const [rawData, setRawData] = useState('')
  const [preview, setPreview] = useState([])
  const [headers, setHeaders] = useState([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [pasteMode, setPasteMode] = useState(false)

  useEffect(() => {
    apiFetch('/api/clients').then(r => r.json()).then(d => setClients(d || []))
  }, [])

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const text = await file.text()
    processData(text, file.name.endsWith('.tsv') || text.includes('\t'))
  }

  const processData = (text, isTab = false) => {
    setRawData(text)
    const parsed = isTab ? parseTabSeparated(text) : parseCSV(text)
    if (!parsed || !parsed.rows) return
    setHeaders(parsed.headers)
    setPreview(parsed.rows.slice(0, 10))
  }

  const handlePaste = () => {
    processData(rawData, rawData.includes('\t'))
  }

  const handleImport = async () => {
    if (!selectedClient || preview.length === 0) return
    setImporting(true)
    const parsed = rawData.includes('\t') ? parseTabSeparated(rawData) : parseCSV(rawData)
    const tasks = parsed.rows
      .map(row => rowToTask(row, parsed.headers, selectedClient))
      .filter(t => t.title.trim())

    let success = 0
    let failed = 0
    for (const task of tasks) {
      const res = await apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(task) })
      if (res.ok) success++
      else failed++
    }
    setResult({ success, failed, total: tasks.length })
    setImporting(false)
    setPreview([])
    setRawData('')
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import Tasks</h1>
        <p className="text-gray-500 text-sm mt-1">Import tasks from CSV or paste from Google Sheets</p>
      </div>

      {result && (
        <div className={`mb-6 p-4 rounded-lg border flex items-center gap-3 ${
          result.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium text-gray-900">Import Complete!</p>
            <p className="text-sm text-gray-600">{result.success} tasks imported successfully. {result.failed > 0 ? `${result.failed} failed.` : ''}</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setResult(null)} className="ml-auto">Import More</Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Import */}
        <Card className="border border-gray-200">
          <CardHeader><CardTitle className="text-base">Import Data</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Target Client *</label>
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant={!pasteMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPasteMode(false)}
              >Upload CSV</Button>
              <Button
                variant={pasteMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPasteMode(true)}
              >Paste from Sheets</Button>
            </div>

            {!pasteMode ? (
              <div>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <Upload className="w-8 h-8 text-gray-300 mb-2" />
                  <span className="text-sm text-gray-400">Click to upload CSV/TSV file</span>
                  <input type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={handleFile} />
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={rawData}
                  onChange={e => setRawData(e.target.value)}
                  placeholder="Paste data from Google Sheets here (tab-separated)..."
                  className="w-full h-40 p-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 font-mono resize-none"
                />
                <Button size="sm" onClick={handlePaste} disabled={!rawData.trim()}>Parse Data</Button>
              </div>
            )}

            {preview.length > 0 && (
              <Button
                className="w-full"
                onClick={handleImport}
                disabled={importing || !selectedClient}
              >
                {importing ? 'Importing...' : `Import ${preview.length}+ Tasks`}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Right: Preview */}
        {preview.length > 0 && (
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="text-base">Preview <span className="text-sm font-normal text-gray-400">(first 10 rows)</span></CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-auto max-h-80">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      {headers.map(h => <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 capitalize">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {preview.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {headers.map(h => <td key={h} className="px-3 py-1.5 text-gray-700 max-w-[120px] truncate">{row[h]}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Format Guide */}
        {preview.length === 0 && (
          <Card className="border border-gray-100 bg-gray-50">
            <CardHeader><CardTitle className="text-base text-gray-600">Supported Formats</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-xs text-gray-500">
              <div>
                <p className="font-medium text-gray-700 mb-1">Format A (like Behno):</p>
                <code className="bg-white border border-gray-200 rounded px-2 py-1 block">To-dos, Duration (in Days), Status, ETA, Remarks</code>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">Format B (like Warehouse Group):</p>
                <code className="bg-white border border-gray-200 rounded px-2 py-1 block">Category, Task, Status, Notes / Comments</code>
              </div>
              <div>
                <p className="font-medium text-gray-700 mb-1">Auto Status Mapping:</p>
                <ul className="space-y-0.5">
                  <li>"Work in Progress" → <span className="text-blue-600">In Progress</span></li>
                  <li>"Implemented/Completed" → <span className="text-green-600">Completed</span></li>
                  <li>"To Be Approved" → <span className="text-amber-600">To Be Approved</span></li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// MongoDB connection
let client
let db

const JWT_SECRET = process.env.JWT_SECRET || 'agency-dashboard-secret-key-2025'
const DB_NAME = process.env.DB_NAME || 'agency_dashboard'

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(DB_NAME)
  }
  return db
}

function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

function verifyToken(request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  try {
    const token = authHeader.split(' ')[1]
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const database = await connectToMongo()

    // ===== AUTH ROUTES =====
    if (route === '/auth/login' && method === 'POST') {
      const body = await request.json()
      const { email, password } = body
      if (!email || !password) {
        return handleCORS(NextResponse.json({ error: 'Email and password required' }, { status: 400 }))
      }
      const member = await database.collection('team_members').findOne({ email, is_active: true })
      if (!member) {
        return handleCORS(NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }))
      }
      const valid = await bcrypt.compare(password, member.password_hash)
      if (!valid) {
        return handleCORS(NextResponse.json({ error: 'Invalid credentials' }, { status: 401 }))
      }
      const token = jwt.sign(
        { id: member.id, email: member.email, role: member.role, name: member.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      )
      return handleCORS(NextResponse.json({ token, user: { id: member.id, email: member.email, role: member.role, name: member.name } }))
    }

    if (route === '/auth/me' && method === 'GET') {
      const user = verifyToken(request)
      if (!user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      return handleCORS(NextResponse.json({ user }))
    }

    // ===== SEED DATA =====
    if (route === '/seed' && method === 'POST') {
      // Create admin user
      const existingAdmin = await database.collection('team_members').findOne({ email: 'admin@agency.com' })
      if (!existingAdmin) {
        const passwordHash = await bcrypt.hash('admin123', 10)
        const adminId = uuidv4()
        await database.collection('team_members').insertMany([
          { id: adminId, name: 'Admin User', email: 'admin@agency.com', role: 'Admin', password_hash: passwordHash, is_active: true, created_at: new Date() },
          { id: uuidv4(), name: 'Sarah Chen', email: 'sarah@agency.com', role: 'SEO', password_hash: await bcrypt.hash('pass123', 10), is_active: true, created_at: new Date() },
          { id: uuidv4(), name: 'Mike Torres', email: 'mike@agency.com', role: 'Design', password_hash: await bcrypt.hash('pass123', 10), is_active: true, created_at: new Date() },
          { id: uuidv4(), name: 'Priya Nair', email: 'priya@agency.com', role: 'Tech', password_hash: await bcrypt.hash('pass123', 10), is_active: true, created_at: new Date() },
          { id: uuidv4(), name: 'James Lee', email: 'james@agency.com', role: 'Account Manager', password_hash: await bcrypt.hash('pass123', 10), is_active: true, created_at: new Date() },
        ])
      }
      // Create sample clients
      const existingClients = await database.collection('clients').countDocuments()
      if (existingClients === 0) {
        const clientIds = [uuidv4(), uuidv4(), uuidv4()]
        const now = new Date()
        await database.collection('clients').insertMany([
          { id: clientIds[0], name: 'Bandolier', slug: 'bandolier', service_type: 'SEO + Email', portal_password: null, is_active: true, created_at: now },
          { id: clientIds[1], name: 'Behno', slug: 'behno', service_type: 'SEO', portal_password: 'behno2025', is_active: true, created_at: now },
          { id: clientIds[2], name: 'Warehouse Group', slug: 'warehouse-group', service_type: 'All', portal_password: null, is_active: true, created_at: now },
        ])
        const members = await database.collection('team_members').find({}).toArray()
        const getMemberId = (role) => members.find(m => m.role === role)?.id || null
        const tasks = [
          // Bandolier tasks
          { id: uuidv4(), client_id: clientIds[0], title: 'Publish 2 SEO Optimized Blogs', category: 'SEO & Content', status: 'In Progress', priority: 'P1', assigned_to: getMemberId('SEO'), duration_days: '5', eta_start: '2025-06-01', eta_end: '2025-06-07', remarks: 'Focus on long-tail keywords', link_url: null, created_at: now, updated_at: now },
          { id: uuidv4(), client_id: clientIds[0], title: 'Fix Core Web Vitals', category: 'Page Speed', status: 'To Be Approved', priority: 'P0', assigned_to: getMemberId('Tech'), duration_days: '3', eta_start: '2025-06-03', eta_end: '2025-06-06', remarks: 'LCP needs improvement', link_url: 'https://pagespeed.web.dev', created_at: now, updated_at: now },
          { id: uuidv4(), client_id: clientIds[0], title: 'Monthly Email Newsletter', category: 'Email Marketing', status: 'Completed', priority: 'P1', assigned_to: getMemberId('Design'), duration_days: '2', eta_start: '2025-05-28', eta_end: '2025-05-30', remarks: 'May edition sent', link_url: null, created_at: now, updated_at: now },
          { id: uuidv4(), client_id: clientIds[0], title: 'Schema Markup Implementation', category: 'Technical SEO', status: 'To Be Started', priority: 'P2', assigned_to: getMemberId('Tech'), duration_days: '2-3', eta_start: '2025-06-10', eta_end: '2025-06-12', remarks: null, link_url: null, created_at: now, updated_at: now },
          // Behno tasks
          { id: uuidv4(), client_id: clientIds[1], title: 'Keyword Research & Mapping', category: 'SEO & Content', status: 'Completed', priority: 'P0', assigned_to: getMemberId('SEO'), duration_days: '4', eta_start: '2025-05-20', eta_end: '2025-05-24', remarks: 'Completed - 150 keywords mapped', link_url: 'https://docs.google.com', created_at: now, updated_at: now },
          { id: uuidv4(), client_id: clientIds[1], title: 'Homepage Redesign', category: 'Design', status: 'In Progress', priority: 'P1', assigned_to: getMemberId('Design'), duration_days: '7', eta_start: '2025-06-02', eta_end: '2025-06-09', remarks: 'Wireframes approved', link_url: 'https://figma.com', created_at: now, updated_at: now },
          { id: uuidv4(), client_id: clientIds[1], title: 'Site Speed Optimization', category: 'Page Speed', status: 'Blocked', priority: 'P0', assigned_to: getMemberId('Tech'), duration_days: '3', eta_start: '2025-06-05', eta_end: '2025-06-08', remarks: 'Waiting for server access', link_url: null, created_at: now, updated_at: now },
          { id: uuidv4(), client_id: clientIds[1], title: 'Monthly SEO Report', category: 'Reporting', status: 'Recurring', priority: 'P1', assigned_to: getMemberId('Account Manager'), duration_days: '1', eta_start: null, eta_end: null, remarks: 'Every last Friday of month', link_url: null, created_at: now, updated_at: now },
          // Warehouse Group tasks
          { id: uuidv4(), client_id: clientIds[2], title: 'Google Ads Campaign Setup', category: 'Paid Ads', status: 'In Progress', priority: 'P0', assigned_to: getMemberId('Tech'), duration_days: '5', eta_start: '2025-06-01', eta_end: '2025-06-06', remarks: 'ROAS target: 4x', link_url: null, created_at: now, updated_at: now },
          { id: uuidv4(), client_id: clientIds[2], title: 'Link Building Outreach', category: 'Link Building', status: 'In Progress', priority: 'P2', assigned_to: getMemberId('SEO'), duration_days: '10', eta_start: '2025-06-01', eta_end: '2025-06-15', remarks: '20 prospects identified', link_url: null, created_at: now, updated_at: now },
          { id: uuidv4(), client_id: clientIds[2], title: 'LLM SEO Optimization', category: 'LLM SEO', status: 'To Be Started', priority: 'P1', assigned_to: getMemberId('SEO'), duration_days: '3', eta_start: '2025-06-15', eta_end: '2025-06-18', remarks: 'AI search optimization', link_url: null, created_at: now, updated_at: now },
        ]
        await database.collection('tasks').insertMany(tasks)
        // Reports
        await database.collection('reports').insertMany([
          { id: uuidv4(), client_id: clientIds[0], title: 'May 2025 SEO Report', report_type: 'Monthly SEO Report', report_url: 'https://docs.google.com', report_date: '2025-05-31', notes: 'Organic traffic up 23%', created_at: now },
          { id: uuidv4(), client_id: clientIds[1], title: 'Q1 Audit Report', report_type: 'Audit Report', report_url: 'https://docs.google.com', report_date: '2025-03-31', notes: 'Full technical audit', created_at: now },
          { id: uuidv4(), client_id: clientIds[2], title: 'May 2025 Ad Performance', report_type: 'Ad Performance', report_url: 'https://lookerstudio.google.com', report_date: '2025-05-31', notes: 'ROAS: 3.8x', created_at: now },
        ])
      }
      return handleCORS(NextResponse.json({ message: 'Seed data created successfully' }))
    }

    // ===== CLIENTS ROUTES =====
    if (route === '/clients' && method === 'GET') {
      const clients = await database.collection('clients').find({}).sort({ created_at: -1 }).toArray()
      // Add task counts
      const clientsWithCounts = await Promise.all(clients.map(async (c) => {
        const { _id, ...client } = c
        const taskCount = await database.collection('tasks').countDocuments({ client_id: client.id })
        const inProgressCount = await database.collection('tasks').countDocuments({ client_id: client.id, status: 'In Progress' })
        const approvalCount = await database.collection('tasks').countDocuments({ client_id: client.id, status: 'To Be Approved' })
        return { ...client, task_count: taskCount, in_progress_count: inProgressCount, approval_count: approvalCount }
      }))
      return handleCORS(NextResponse.json(clientsWithCounts))
    }

    if (route === '/clients' && method === 'POST') {
      const user = verifyToken(request)
      if (!user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const { name, service_type, portal_password } = body
      if (!name) return handleCORS(NextResponse.json({ error: 'Name required' }, { status: 400 }))
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const existing = await database.collection('clients').findOne({ slug })
      const finalSlug = existing ? `${slug}-${Date.now()}` : slug
      const client = {
        id: uuidv4(), name, slug: finalSlug,
        service_type: service_type || 'SEO',
        portal_password: portal_password || null,
        is_active: true,
        created_at: new Date()
      }
      await database.collection('clients').insertOne(client)
      return handleCORS(NextResponse.json(client))
    }

    const clientByIdMatch = route.match(/^\/clients\/([^/]+)$/)
    if (clientByIdMatch) {
      const clientId = clientByIdMatch[1]
      if (method === 'GET') {
        const client = await database.collection('clients').findOne({ id: clientId })
        if (!client) return handleCORS(NextResponse.json({ error: 'Client not found' }, { status: 404 }))
        const { _id, ...clientData } = client
        return handleCORS(NextResponse.json(clientData))
      }
      if (method === 'PUT') {
        const user = verifyToken(request)
        if (!user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
        const body = await request.json()
        const { _id, id, ...updateData } = body
        updateData.updated_at = new Date()
        await database.collection('clients').updateOne({ id: clientId }, { $set: updateData })
        const updated = await database.collection('clients').findOne({ id: clientId })
        const { _id: _, ...result } = updated
        return handleCORS(NextResponse.json(result))
      }
      if (method === 'DELETE') {
        const user = verifyToken(request)
        if (!user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
        await database.collection('clients').deleteOne({ id: clientId })
        await database.collection('tasks').deleteMany({ client_id: clientId })
        await database.collection('reports').deleteMany({ client_id: clientId })
        return handleCORS(NextResponse.json({ message: 'Client deleted' }))
      }
    }

    // ===== TASKS ROUTES =====
    if (route === '/tasks' && method === 'GET') {
      const url = new URL(request.url)
      const query = {}
      const clientId = url.searchParams.get('client_id')
      const status = url.searchParams.get('status')
      const category = url.searchParams.get('category')
      const assignedTo = url.searchParams.get('assigned_to')
      const priority = url.searchParams.get('priority')
      if (clientId) query.client_id = clientId
      if (status) query.status = status
      if (category) query.category = category
      if (assignedTo) query.assigned_to = assignedTo
      if (priority) query.priority = priority

      const tasks = await database.collection('tasks').find(query).sort({ created_at: -1 }).toArray()
      const cleanTasks = tasks.map(({ _id, ...t }) => t)

      // Enrich with client names and assignee names
      const clientIds = [...new Set(cleanTasks.map(t => t.client_id))]
      const assigneeIds = [...new Set(cleanTasks.map(t => t.assigned_to).filter(Boolean))]
      const clients = clientIds.length > 0 ? await database.collection('clients').find({ id: { $in: clientIds } }).toArray() : []
      const members = assigneeIds.length > 0 ? await database.collection('team_members').find({ id: { $in: assigneeIds } }).toArray() : []
      const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]))
      const memberMap = Object.fromEntries(members.map(m => [m.id, m.name]))

      const enriched = cleanTasks.map(t => ({
        ...t,
        client_name: clientMap[t.client_id] || 'Unknown',
        assigned_to_name: memberMap[t.assigned_to] || null
      }))
      return handleCORS(NextResponse.json(enriched))
    }

    if (route === '/tasks' && method === 'POST') {
      const user = verifyToken(request)
      if (!user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const { title, client_id } = body
      if (!title || !client_id) return handleCORS(NextResponse.json({ error: 'title and client_id required' }, { status: 400 }))
      const task = {
        id: uuidv4(),
        client_id,
        title,
        description: body.description || null,
        category: body.category || 'Other',
        status: body.status || 'To Be Started',
        priority: body.priority || 'P2',
        assigned_to: body.assigned_to || null,
        duration_days: body.duration_days || null,
        eta_start: body.eta_start || null,
        eta_end: body.eta_end || null,
        remarks: body.remarks || null,
        link_url: body.link_url || null,
        created_at: new Date(),
        updated_at: new Date()
      }
      await database.collection('tasks').insertOne(task)
      return handleCORS(NextResponse.json(task))
    }

    const taskByIdMatch = route.match(/^\/tasks\/([^/]+)$/)
    if (taskByIdMatch) {
      const taskId = taskByIdMatch[1]
      if (method === 'PUT') {
        const user = verifyToken(request)
        if (!user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
        const body = await request.json()
        const { _id, id, ...updateData } = body
        updateData.updated_at = new Date()
        await database.collection('tasks').updateOne({ id: taskId }, { $set: updateData })
        const updated = await database.collection('tasks').findOne({ id: taskId })
        const { _id: _, ...result } = updated
        return handleCORS(NextResponse.json(result))
      }
      if (method === 'DELETE') {
        const user = verifyToken(request)
        if (!user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
        await database.collection('tasks').deleteOne({ id: taskId })
        return handleCORS(NextResponse.json({ message: 'Task deleted' }))
      }
    }

    if (route === '/tasks/bulk-update' && method === 'POST') {
      const user = verifyToken(request)
      if (!user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const { task_ids, updates } = body
      if (!task_ids || !updates) return handleCORS(NextResponse.json({ error: 'task_ids and updates required' }, { status: 400 }))
      const { _id, id, ...updateData } = updates
      updateData.updated_at = new Date()
      await database.collection('tasks').updateMany({ id: { $in: task_ids } }, { $set: updateData })
      return handleCORS(NextResponse.json({ message: `Updated ${task_ids.length} tasks` }))
    }

    // ===== TEAM ROUTES =====
    if (route === '/team' && method === 'GET') {
      const members = await database.collection('team_members').find({}).sort({ name: 1 }).toArray()
      const clean = members.map(({ _id, password_hash, ...m }) => m)
      return handleCORS(NextResponse.json(clean))
    }

    if (route === '/team' && method === 'POST') {
      const user = verifyToken(request)
      if (!user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const { name, email, role, password } = body
      if (!name || !email || !role) return handleCORS(NextResponse.json({ error: 'name, email, role required' }, { status: 400 }))
      const existing = await database.collection('team_members').findOne({ email })
      if (existing) return handleCORS(NextResponse.json({ error: 'Email already exists' }, { status: 400 }))
      const passwordHash = await bcrypt.hash(password || 'changeme123', 10)
      const member = {
        id: uuidv4(), name, email, role,
        password_hash: passwordHash,
        is_active: true,
        created_at: new Date()
      }
      await database.collection('team_members').insertOne(member)
      const { _id, password_hash, ...result } = member
      return handleCORS(NextResponse.json(result))
    }

    const teamByIdMatch = route.match(/^\/team\/([^/]+)$/)
    if (teamByIdMatch) {
      const memberId = teamByIdMatch[1]
      if (method === 'PUT') {
        const user = verifyToken(request)
        if (!user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
        const body = await request.json()
        const { _id, id, password_hash, password, ...updateData } = body
        if (password) updateData.password_hash = await bcrypt.hash(password, 10)
        updateData.updated_at = new Date()
        await database.collection('team_members').updateOne({ id: memberId }, { $set: updateData })
        const updated = await database.collection('team_members').findOne({ id: memberId })
        const { _id: _, password_hash: __, ...result } = updated
        return handleCORS(NextResponse.json(result))
      }
      if (method === 'DELETE') {
        const user = verifyToken(request)
        if (!user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
        await database.collection('team_members').updateOne({ id: memberId }, { $set: { is_active: false } })
        return handleCORS(NextResponse.json({ message: 'Team member deactivated' }))
      }
    }

    // ===== REPORTS ROUTES =====
    if (route === '/reports' && method === 'GET') {
      const url = new URL(request.url)
      const clientId = url.searchParams.get('client_id')
      const query = clientId ? { client_id: clientId } : {}
      const reports = await database.collection('reports').find(query).sort({ report_date: -1 }).toArray()
      const clean = reports.map(({ _id, ...r }) => r)

      // Enrich with client names
      const clientIds = [...new Set(clean.map(r => r.client_id))]
      const clients = clientIds.length > 0 ? await database.collection('clients').find({ id: { $in: clientIds } }).toArray() : []
      const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]))
      const enriched = clean.map(r => ({ ...r, client_name: clientMap[r.client_id] || 'Unknown' }))
      return handleCORS(NextResponse.json(enriched))
    }

    if (route === '/reports' && method === 'POST') {
      const user = verifyToken(request)
      if (!user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
      const body = await request.json()
      const { title, client_id, report_url, report_date, report_type } = body
      if (!title || !client_id || !report_url) return handleCORS(NextResponse.json({ error: 'title, client_id, report_url required' }, { status: 400 }))
      const report = {
        id: uuidv4(), client_id, title,
        report_type: report_type || 'Custom',
        report_url, report_date: report_date || new Date().toISOString().split('T')[0],
        notes: body.notes || null,
        created_at: new Date()
      }
      await database.collection('reports').insertOne(report)
      return handleCORS(NextResponse.json(report))
    }

    const reportByIdMatch = route.match(/^\/reports\/([^/]+)$/)
    if (reportByIdMatch) {
      const reportId = reportByIdMatch[1]
      if (method === 'PUT') {
        const user = verifyToken(request)
        if (!user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
        const body = await request.json()
        const { _id, id, ...updateData } = body
        await database.collection('reports').updateOne({ id: reportId }, { $set: updateData })
        const updated = await database.collection('reports').findOne({ id: reportId })
        const { _id: _, ...result } = updated
        return handleCORS(NextResponse.json(result))
      }
      if (method === 'DELETE') {
        const user = verifyToken(request)
        if (!user) return handleCORS(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
        await database.collection('reports').deleteOne({ id: reportId })
        return handleCORS(NextResponse.json({ message: 'Report deleted' }))
      }
    }

    // ===== PORTAL ROUTES =====
    const portalMatch = route.match(/^\/portal\/([^/]+)$/)
    if (portalMatch && method === 'GET') {
      const slug = portalMatch[1]
      const client = await database.collection('clients').findOne({ slug, is_active: true })
      if (!client) return handleCORS(NextResponse.json({ error: 'Client not found' }, { status: 404 }))
      const { _id, portal_password: pp, ...clientData } = client
      const hasPassword = !!pp

      // Check auth for password-protected portals
      if (hasPassword) {
        const authHeader = request.headers.get('X-Portal-Password')
        if (!authHeader || authHeader !== pp) {
          return handleCORS(NextResponse.json({ error: 'Password required', has_password: true, client_name: clientData.name }, { status: 401 }))
        }
      }

      const tasks = await database.collection('tasks').find({ client_id: clientData.id }).sort({ category: 1, created_at: 1 }).toArray()
      const reports = await database.collection('reports').find({ client_id: clientData.id }).sort({ report_date: -1 }).toArray()
      const cleanTasks = tasks.map(({ _id, ...t }) => t)
      const cleanReports = reports.map(({ _id, ...r }) => r)

      return handleCORS(NextResponse.json({
        client: clientData,
        tasks: cleanTasks,
        reports: cleanReports
      }))
    }

    const portalAuthMatch = route.match(/^\/portal\/([^/]+)\/auth$/)
    if (portalAuthMatch && method === 'POST') {
      const slug = portalAuthMatch[1]
      const body = await request.json()
      const { password } = body
      const client = await database.collection('clients').findOne({ slug, is_active: true })
      if (!client) return handleCORS(NextResponse.json({ error: 'Client not found' }, { status: 404 }))
      if (!client.portal_password) return handleCORS(NextResponse.json({ success: true }))
      if (client.portal_password !== password) return handleCORS(NextResponse.json({ error: 'Wrong password' }, { status: 401 }))
      return handleCORS(NextResponse.json({ success: true }))
    }

    // ===== STATS =====
    if (route === '/stats' && method === 'GET') {
      const totalClients = await database.collection('clients').countDocuments({ is_active: true })
      const inProgress = await database.collection('tasks').countDocuments({ status: 'In Progress' })
      const toBeApproved = await database.collection('tasks').countDocuments({ status: 'To Be Approved' })
      const blocked = await database.collection('tasks').countDocuments({ status: 'Blocked' })
      const completed = await database.collection('tasks').countDocuments({ status: 'Completed' })
      const recentTasks = await database.collection('tasks').find({}).sort({ updated_at: -1 }).limit(20).toArray()
      const recentTasksClean = recentTasks.map(({ _id, ...t }) => t)
      const clientIds = [...new Set(recentTasksClean.map(t => t.client_id))]
      const clients = await database.collection('clients').find({ id: { $in: clientIds } }).toArray()
      const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]))
      const enrichedRecent = recentTasksClean.map(t => ({ ...t, client_name: clientMap[t.client_id] || 'Unknown' }))
      return handleCORS(NextResponse.json({ totalClients, inProgress, toBeApproved, blocked, completed, recentActivity: enrichedRecent }))
    }

    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ message: 'Agency Dashboard API v1.0' }))
    }

    return handleCORS(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 }))
  }
}

export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute

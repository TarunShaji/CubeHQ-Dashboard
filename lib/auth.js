export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('agency_token')
}

export function getUser() {
  if (typeof window === 'undefined') return null
  try {
    const u = localStorage.getItem('agency_user')
    return u ? JSON.parse(u) : null
  } catch {
    return null
  }
}

export function logout() {
  localStorage.removeItem('agency_token')
  localStorage.removeItem('agency_user')
}

export function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiFetch(url, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  }
  const res = await fetch(url, { ...options, headers })
  return res
}

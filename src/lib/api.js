// Cliente para llamar a los endpoints /api/*
// Maneja token de sesión, errores, y header Authorization

const TOKEN_KEY = 'genetica_token'

// ── Token storage ───────────────────────────────────────────────────────────
export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

// ── Helper genérico ─────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(path, { ...options, headers })

  let data
  try { data = await res.json() }
  catch { data = { ok: false, error: 'Respuesta inválida del servidor' } }

  if (!res.ok || !data.ok) {
    const err = new Error(data.error || `Error ${res.status}`)
    err.status = res.status
    throw err
  }
  return data
}

// ── Endpoints de autenticación ──────────────────────────────────────────────
export const authApi = {

  solicitarCodigo(correo, tipo) {
    return apiFetch('/api/auth/solicitar-codigo', {
      method: 'POST',
      body: JSON.stringify({ correo, tipo }),
    })
  },

  verificarCodigo(correo, codigo, tipo) {
    return apiFetch('/api/auth/verificar-codigo', {
      method: 'POST',
      body: JSON.stringify({ correo, codigo, tipo }),
    })
  },

  registrarPassword(token, password) {
    return apiFetch('/api/auth/registrar-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    })
  },

  async login(correo, password) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, password }),
    })
    setToken(data.token)
    return data
  },

  me() {
    return apiFetch('/api/auth/me', { method: 'GET' })
  },

  async logout() {
    try { await apiFetch('/api/auth/logout', { method: 'POST' }) }
    catch { /* ignorar errores al cerrar sesión */ }
    clearToken()
  },

  resetearPassword(token, password) {
    return apiFetch('/api/auth/resetear-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    })
  },
}
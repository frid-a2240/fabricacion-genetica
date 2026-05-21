// Utilidades comunes para los endpoints

// Lee el body JSON (en Vercel viene como string a veces, a veces parseado)
export async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body) } catch { return {} }
  }
  // Fallback: leer stream
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (c) => { data += c })
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')) } catch { resolve({}) }
    })
  })
}

// Solo permite POST
export function onlyPost(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Método no permitido' })
    return false
  }
  return true
}

// Solo permite GET
export function onlyGet(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Método no permitido' })
    return false
  }
  return true
}

// Wrapper para errores
export function errorResponse(res, status, mensaje) {
  return res.status(status).json({ ok: false, error: mensaje })
}

// Validador de email simple
export function emailValido(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
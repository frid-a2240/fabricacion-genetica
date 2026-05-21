// Lógica de autenticación: OTP, password hashing, JWT
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET           = process.env.JWT_SECRET
const OTP_DURACION_MIN     = parseInt(process.env.OTP_DURACION_MINUTOS || '10', 10)
const SESION_DURACION_DIAS = parseInt(process.env.SESION_DURACION_DIAS || '7', 10)

export const MAX_INTENTOS_OTP = parseInt(process.env.MAX_INTENTOS_OTP || '5', 10)

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET debe tener al menos 32 caracteres')
}

// ── Códigos OTP ─────────────────────────────────────────────────────────────
export function generarCodigoOTP() {
  // Genera entero entre 0 y 999999, lo formatea a 6 dígitos
  const n = crypto.randomInt(0, 1_000_000)
  return n.toString().padStart(6, '0')
}

export function fechaExpiracionOTP() {
  return new Date(Date.now() + OTP_DURACION_MIN * 60_000).toISOString()
}

// ── Contraseñas ─────────────────────────────────────────────────────────────
export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12)
  return bcrypt.hash(password, salt)
}

export async function verificarPassword(password, hash) {
  try { return await bcrypt.compare(password, hash) }
  catch { return false }
}

export function validarPasswordFuerte(password) {
  if (!password || password.length < 8) return { ok: false, msg: 'La contraseña debe tener al menos 8 caracteres' }
  if (!/[A-Z]/.test(password))           return { ok: false, msg: 'Debe incluir al menos una mayúscula' }
  if (!/[a-z]/.test(password))           return { ok: false, msg: 'Debe incluir al menos una minúscula' }
  if (!/[0-9]/.test(password))           return { ok: false, msg: 'Debe incluir al menos un número' }
  return { ok: true, msg: '' }
}

// ── Tokens JWT ──────────────────────────────────────────────────────────────
export function crearTokenSesion(usuarioId, correo) {
  const expiraSegundos = SESION_DURACION_DIAS * 24 * 60 * 60
  const expiraDate = new Date(Date.now() + expiraSegundos * 1000)
  const token = jwt.sign(
    { sub: usuarioId, correo, tipo: 'sesion' },
    JWT_SECRET,
    { expiresIn: `${SESION_DURACION_DIAS}d` }
  )
  return { token, expira: expiraDate }
}

export function crearTokenRegistro(correo) {
  return jwt.sign({ correo, tipo: 'registro' }, JWT_SECRET, { expiresIn: '15m' })
}

export function crearTokenReset(correo) {
  return jwt.sign({ correo, tipo: 'reset' }, JWT_SECRET, { expiresIn: '15m' })
}

export function decodificarToken(token, tipoEsperado = null) {
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (tipoEsperado && payload.tipo !== tipoEsperado) return null
    return payload
  } catch {
    return null
  }
}
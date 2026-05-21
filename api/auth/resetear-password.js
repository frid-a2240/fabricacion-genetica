// POST /api/auth/resetear-password
// Body: { token, password }
// Cambia la contraseña usando el token de reset (obtenido tras verificar OTP)
import { supabaseAdmin, getUsuarioPorCorreo } from '../_lib/supabase.js'
import { decodificarToken, hashPassword, validarPasswordFuerte } from '../_lib/auth.js'
import { readBody, onlyPost, errorResponse } from '../_lib/helpers.js'

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return

  try {
    const { token, password } = await readBody(req)

    if (!token)    return errorResponse(res, 400, 'Token requerido')
    if (!password) return errorResponse(res, 400, 'Contraseña requerida')

    const payload = decodificarToken(token, 'reset')
    if (!payload) return errorResponse(res, 400, 'Token inválido o expirado. Solicita un nuevo código.')

    const valid = validarPasswordFuerte(password)
    if (!valid.ok) return errorResponse(res, 400, valid.msg)

    const correo = payload.correo
    const pwdHash = await hashPassword(password)

    await supabaseAdmin
      .from('usuarios')
      .update({ password_hash: pwdHash, updated_at: new Date().toISOString() })
      .eq('correo', correo)

    // Invalidar todas las sesiones anteriores por seguridad
    const usuario = await getUsuarioPorCorreo(correo)
    if (usuario) {
      await supabaseAdmin.from('sesiones').delete().eq('usuario_id', usuario.id)
    }

    return res.status(200).json({ ok: true, mensaje: 'Contraseña actualizada. Inicia sesión con la nueva.' })

  } catch (err) {
    console.error('Error en resetear-password:', err)
    return errorResponse(res, 500, 'Error interno del servidor')
  }
}
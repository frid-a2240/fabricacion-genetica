// POST /api/auth/registrar-password
// Body: { token, password }
// Crea la contraseña inicial usando el token de registro
import { supabaseAdmin, getUsuarioPorCorreo } from '../_lib/supabase.js'
import { decodificarToken, hashPassword, validarPasswordFuerte } from '../_lib/auth.js'
import { enviarCorreo, plantillaBienvenida } from '../_lib/email.js'
import { readBody, onlyPost, errorResponse } from '../_lib/helpers.js'

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return

  try {
    const { token, password } = await readBody(req)

    if (!token)    return errorResponse(res, 400, 'Token requerido')
    if (!password) return errorResponse(res, 400, 'Contraseña requerida')

    const payload = decodificarToken(token, 'registro')
    if (!payload) return errorResponse(res, 400, 'Token inválido o expirado. Vuelve a empezar el registro.')

    const valid = validarPasswordFuerte(password)
    if (!valid.ok) return errorResponse(res, 400, valid.msg)

    const correo = payload.correo
    const usuario = await getUsuarioPorCorreo(correo)
    if (!usuario)             return errorResponse(res, 404, 'Usuario no encontrado')
    if (usuario.verificado)   return errorResponse(res, 400, 'Este correo ya está verificado')

    const pwdHash = await hashPassword(password)

    const { error } = await supabaseAdmin
      .from('usuarios')
      .update({
        password_hash: pwdHash,
        verificado: true,
        updated_at: new Date().toISOString(),
      })
      .eq('correo', correo)

    if (error) {
      console.error('Error actualizando usuario:', error)
      return errorResponse(res, 500, 'Error al guardar la contraseña')
    }

    // Correo de bienvenida (no bloquea si falla)
    try {
      const { asunto, html } = plantillaBienvenida(usuario.nombre)
      await enviarCorreo(correo, asunto, html)
    } catch (e) {
      console.warn('No se pudo enviar correo de bienvenida:', e.message)
    }

    return res.status(200).json({ ok: true, mensaje: 'Cuenta creada. Ya puedes iniciar sesión.' })

  } catch (err) {
    console.error('Error en registrar-password:', err)
    return errorResponse(res, 500, 'Error interno del servidor')
  }
}
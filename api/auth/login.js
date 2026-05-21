// POST /api/auth/login
// Body: { correo, password }
// Devuelve token de sesión (7 días)
import { supabaseAdmin, getUsuarioPorCorreo } from '../_lib/supabase.js'
import { verificarPassword, crearTokenSesion } from '../_lib/auth.js'
import { readBody, onlyPost, errorResponse, emailValido } from '../_lib/helpers.js'

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return

  try {
    const { correo, password } = await readBody(req)

    if (!emailValido(correo)) return errorResponse(res, 400, 'Correo inválido')
    if (!password)            return errorResponse(res, 400, 'Contraseña requerida')

    const correoLower = correo.toLowerCase()
    const usuario = await getUsuarioPorCorreo(correoLower)

    if (!usuario)             return errorResponse(res, 401, 'Correo o contraseña incorrectos')
    if (!usuario.activo)      return errorResponse(res, 403, 'Esta cuenta está deshabilitada')
    if (!usuario.verificado || !usuario.password_hash) {
      return errorResponse(res, 400, 'Este correo aún no se ha registrado')
    }

    const ok = await verificarPassword(password, usuario.password_hash)
    if (!ok) return errorResponse(res, 401, 'Correo o contraseña incorrectos')

    // Crear sesión
    const { token, expira } = crearTokenSesion(usuario.id, correoLower)

    const { error } = await supabaseAdmin
      .from('sesiones')
      .insert({
        usuario_id: usuario.id,
        token,
        expira_en: expira.toISOString(),
        ip_address: req.headers['x-forwarded-for'] || null,
        user_agent: req.headers['user-agent'] || null,
      })

    if (error) {
      console.error('Error creando sesión:', error)
      return errorResponse(res, 500, 'Error al crear la sesión')
    }

    return res.status(200).json({
      ok: true,
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        puesto: usuario.puesto,
      },
    })

  } catch (err) {
    console.error('Error en login:', err)
    return errorResponse(res, 500, 'Error interno del servidor')
  }
}
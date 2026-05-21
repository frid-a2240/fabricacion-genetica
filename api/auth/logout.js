// POST /api/auth/logout
// Header: Authorization: Bearer <token>
// Borra el token de la BD para invalidar la sesión
import { supabaseAdmin } from '../_lib/supabase.js'
import { onlyPost, errorResponse } from '../_lib/helpers.js'

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return

  try {
    const auth = req.headers.authorization || ''
    if (!auth.startsWith('Bearer ')) return errorResponse(res, 401, 'Token requerido')

    const token = auth.replace('Bearer ', '').trim()

    await supabaseAdmin.from('sesiones').delete().eq('token', token)

    return res.status(200).json({ ok: true, mensaje: 'Sesión cerrada' })

  } catch (err) {
    console.error('Error en logout:', err)
    return errorResponse(res, 500, 'Error interno del servidor')
  }
}
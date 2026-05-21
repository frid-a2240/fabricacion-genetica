// GET /api/auth/me
// Header: Authorization: Bearer <token>
// Devuelve datos del usuario logueado + sus permisos por etapa
import { supabaseAdmin, getUsuarioPorId } from '../_lib/supabase.js'
import { decodificarToken } from '../_lib/auth.js'
import { onlyGet, errorResponse } from '../_lib/helpers.js'

export default async function handler(req, res) {
  if (!onlyGet(req, res)) return

  try {
    const auth = req.headers.authorization || ''
    if (!auth.startsWith('Bearer ')) return errorResponse(res, 401, 'Token requerido')

    const token = auth.replace('Bearer ', '').trim()
    const payload = decodificarToken(token, 'sesion')
    if (!payload) return errorResponse(res, 401, 'Token inválido o expirado')

    const usuario = await getUsuarioPorId(payload.sub)
    if (!usuario || !usuario.activo) return errorResponse(res, 401, 'Usuario no encontrado o inactivo')

    // Verificar que la sesión siga activa en BD
    const { data: sesion } = await supabaseAdmin
      .from('sesiones')
      .select('id')
      .eq('token', token)
      .maybeSingle()

    if (!sesion) return errorResponse(res, 401, 'Sesión cerrada')

    // Cargar permisos del usuario con join a etapas_proceso
    const { data: permisos } = await supabaseAdmin
      .from('permisos_etapa')
      .select('*, etapas_proceso(id, nombre, orden)')
      .eq('usuario_id', usuario.id)

    return res.status(200).json({
      ok: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        puesto: usuario.puesto,
      },
      permisos: permisos || [],
    })

  } catch (err) {
    console.error('Error en /me:', err)
    return errorResponse(res, 500, 'Error interno del servidor')
  }
}
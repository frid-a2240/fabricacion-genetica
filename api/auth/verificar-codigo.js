// POST /api/auth/verificar-codigo
// Body: { correo, codigo, tipo }
// Valida el OTP y devuelve un token temporal (15 min) para el siguiente paso
import { supabaseAdmin } from '../_lib/supabase.js'
import { crearTokenRegistro, crearTokenReset, MAX_INTENTOS_OTP } from '../_lib/auth.js'
import { readBody, onlyPost, errorResponse, emailValido } from '../_lib/helpers.js'

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return

  try {
    const { correo, codigo, tipo } = await readBody(req)

    if (!emailValido(correo))                                   return errorResponse(res, 400, 'Correo inválido')
    if (!/^\d{6}$/.test(String(codigo || '')))                   return errorResponse(res, 400, 'Código inválido')
    if (!['registro', 'reset'].includes(tipo))                   return errorResponse(res, 400, 'Tipo inválido')

    const correoLower = correo.toLowerCase()

    // Buscar el código más reciente sin usar
    const { data: codigos, error } = await supabaseAdmin
      .from('codigos_verificacion')
      .select('*')
      .eq('correo', correoLower)
      .eq('tipo', tipo)
      .eq('usado', false)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('Error buscando código:', error)
      return errorResponse(res, 500, 'Error al verificar el código')
    }

    if (!codigos || codigos.length === 0) {
      return errorResponse(res, 400, 'No hay códigos pendientes. Solicita uno nuevo.')
    }

    const codigoDb = codigos[0]

    // Verificar expiración
    if (new Date(codigoDb.expira_en) < new Date()) {
      return errorResponse(res, 400, 'El código expiró. Solicita uno nuevo.')
    }

    // Verificar intentos máximos
    if (codigoDb.intentos >= MAX_INTENTOS_OTP) {
      await supabaseAdmin
        .from('codigos_verificacion')
        .update({ usado: true })
        .eq('id', codigoDb.id)
      return errorResponse(res, 400, 'Demasiados intentos. Solicita un código nuevo.')
    }

    // Verificar código
    if (codigoDb.codigo !== String(codigo)) {
      await supabaseAdmin
        .from('codigos_verificacion')
        .update({ intentos: codigoDb.intentos + 1 })
        .eq('id', codigoDb.id)

      const restantes = MAX_INTENTOS_OTP - codigoDb.intentos - 1
      return errorResponse(res, 400, `Código incorrecto. Te quedan ${restantes} intentos.`)
    }

    // Código correcto → marcar como usado
    await supabaseAdmin
      .from('codigos_verificacion')
      .update({ usado: true })
      .eq('id', codigoDb.id)

    // Generar token temporal
    const token = tipo === 'registro'
      ? crearTokenRegistro(correoLower)
      : crearTokenReset(correoLower)

    return res.status(200).json({ ok: true, token })

  } catch (err) {
    console.error('Error en verificar-codigo:', err)
    return errorResponse(res, 500, 'Error interno del servidor')
  }
}
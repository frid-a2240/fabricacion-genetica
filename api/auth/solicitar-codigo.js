// POST /api/auth/solicitar-codigo
// Body: { correo, tipo: 'registro' | 'reset' }
// Envía un código OTP al correo del usuario
import { supabaseAdmin, getUsuarioPorCorreo } from '../_lib/supabase.js'
import { generarCodigoOTP, fechaExpiracionOTP } from '../_lib/auth.js'
import { enviarCorreo, plantillaOTP } from '../_lib/email.js'
import { readBody, onlyPost, errorResponse, emailValido } from '../_lib/helpers.js'

export default async function handler(req, res) {
  if (!onlyPost(req, res)) return

  try {
    const { correo, tipo } = await readBody(req)

    // Validaciones
    if (!emailValido(correo)) return errorResponse(res, 400, 'Correo inválido')
    if (!['registro', 'reset'].includes(tipo)) return errorResponse(res, 400, 'Tipo inválido')

    const correoLower = correo.toLowerCase()
    const usuario = await getUsuarioPorCorreo(correoLower)

    if (!usuario) {
      return errorResponse(res, 404, 'Este correo no está autorizado para usar el sistema')
    }
    if (!usuario.activo) {
      return errorResponse(res, 403, 'Esta cuenta está deshabilitada')
    }

    // Reglas según el tipo
    if (tipo === 'registro' && usuario.verificado) {
      return errorResponse(res, 400, 'Este correo ya está verificado. Por favor inicia sesión.')
    }
    if (tipo === 'reset' && !usuario.verificado) {
      return errorResponse(res, 400, 'Este correo aún no se ha registrado. Completa primero tu registro.')
    }

    // Invalidar códigos anteriores no usados del mismo tipo
    await supabaseAdmin
      .from('codigos_verificacion')
      .update({ usado: true })
      .eq('correo', correoLower)
      .eq('tipo', tipo)
      .eq('usado', false)

    // Generar y guardar nuevo código
    const codigo = generarCodigoOTP()
    const { error: insertError } = await supabaseAdmin
      .from('codigos_verificacion')
      .insert({
        correo: correoLower,
        codigo,
        tipo,
        expira_en: fechaExpiracionOTP(),
      })

    if (insertError) {
      console.error('Error insertando código:', insertError)
      return errorResponse(res, 500, 'Error al generar el código')
    }

    // Enviar correo
    const { asunto, html } = plantillaOTP(usuario.nombre, codigo, tipo)
    try {
      await enviarCorreo(correoLower, asunto, html)
    } catch (e) {
      console.error('Error enviando correo:', e)
      return errorResponse(res, 500, 'No se pudo enviar el correo. Verifica la configuración SMTP.')
    }

    return res.status(200).json({ ok: true, mensaje: 'Código enviado al correo' })

  } catch (err) {
    console.error('Error en solicitar-codigo:', err)
    return errorResponse(res, 500, 'Error interno del servidor')
  }
}
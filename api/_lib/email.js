// Envío de correos con nodemailer (SMTP Gmail)
import nodemailer from 'nodemailer'

const SMTP_HOST      = process.env.SMTP_HOST || 'smtp.gmail.com'
const SMTP_PORT      = parseInt(process.env.SMTP_PORT || '587', 10)
const SMTP_USER      = process.env.SMTP_USER
const SMTP_PASSWORD  = process.env.SMTP_PASSWORD
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'Genética Laboratorios'
const SMTP_FROM      = process.env.SMTP_FROM 

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  if (!SMTP_USER || !SMTP_PASSWORD) {
    throw new Error('Faltan SMTP_USER o SMTP_PASSWORD en variables de entorno')
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // false para 587 (STARTTLS)
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
  })
  return transporter
}

export async function enviarCorreo(destinatario, asunto, html) {
  const t = getTransporter()
  await t.sendMail({
   from: `"${SMTP_FROM_NAME}" <${SMTP_FROM || SMTP_USER}>`,
    to: destinatario,
    subject: asunto,
    html,
  })
}

// ── Plantillas HTML ─────────────────────────────────────────────────────────
export function plantillaOTP(nombre, codigo, tipo) {
  const titulo = tipo === 'registro' ? 'Código de verificación' : 'Recuperación de contraseña'
  const accion = tipo === 'registro'
    ? 'verificar tu correo y completar tu registro'
    : 'restablecer tu contraseña'

  return {
    asunto: `${titulo} - Genética Laboratorios`,
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#F5F3FF;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3FF;padding:40px 20px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.15);">
  <tr><td style="background:linear-gradient(135deg,#3B0764,#7C3AED,#D946EF);padding:32px;text-align:center;">
    <div style="color:rgba(255,255,255,0.85);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Genética Laboratorios</div>
    <div style="color:#fff;font-size:22px;font-weight:800;">${titulo}</div>
  </td></tr>
  <tr><td style="padding:32px;">
    <p style="color:#1e293b;font-size:15px;line-height:1.6;margin:0 0 16px 0;">Hola <strong>${nombre}</strong>,</p>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px 0;">Usa el siguiente código de 6 dígitos para ${accion}:</p>
    <div style="background:#F5F3FF;border:2px dashed #C4B5FD;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
      <div style="font-family:'Courier New',monospace;font-size:36px;font-weight:800;color:#7C3AED;letter-spacing:8px;">${codigo}</div>
    </div>
    <p style="color:#94a3b8;font-size:12px;line-height:1.5;margin:16px 0 0 0;">
      ⏱ Este código expira en <strong>10 minutos</strong>.<br>
      🔒 Si tú no solicitaste este código, ignora este correo.
    </p>
  </td></tr>
  <tr><td style="background:#fafafa;padding:20px 32px;border-top:1px solid #f1f5f9;text-align:center;">
    <div style="color:#94a3b8;font-size:11px;">Mensaje automático del sistema. No respondas a este correo.</div>
  </td></tr>
</table>
</td></tr></table></body></html>`,
  }
}

export function plantillaBienvenida(nombre) {
  return {
    asunto: 'Bienvenido al sistema - Genética Laboratorios',
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#F5F3FF;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3FF;padding:40px 20px;">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(22,163,74,0.15);">
  <tr><td style="background:linear-gradient(135deg,#14532d,#16a34a,#22c55e);padding:32px;text-align:center;">
    <div style="color:rgba(255,255,255,0.85);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Cuenta verificada ✓</div>
    <div style="color:#fff;font-size:22px;font-weight:800;">¡Bienvenido, ${nombre}!</div>
  </td></tr>
  <tr><td style="padding:32px;">
    <p style="color:#1e293b;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
      Tu cuenta ha sido verificada correctamente y ya puedes iniciar sesión en el sistema de seguimiento de procesos de fabricación.
    </p>
    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0;">
      A partir de ahora podrás registrar las etapas que te corresponden según tu rol.
    </p>
  </td></tr>
</table>
</td></tr></table></body></html>`,
  }
}
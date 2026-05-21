import { useState } from 'react'
import { Box, Typography, TextField, Button, InputAdornment, IconButton, Alert, LinearProgress } from '@mui/material'
import { Mail, Lock, Eye, EyeOff, ArrowRight, KeyRound, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react'
import { AuthShell } from './AuthShell.jsx'
import { authApi } from '../../lib/api.js'

const inputSx = {
  borderRadius: 2.5, fontSize: '0.9rem', backgroundColor: '#fafafa',
  '& fieldset': { borderColor: '#e2e8f0' },
  '&:hover fieldset': { borderColor: '#C4B5FD' },
  '&.Mui-focused fieldset': { borderColor: '#7C3AED' },
  '&.Mui-focused': { backgroundColor: '#fff' },
}

const inputCodigoSx = {
  ...inputSx, fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 800,
  letterSpacing: 8, textAlign: 'center', color: '#7C3AED',
}

/**
 * Flujo de registro de 3 pasos:
 *   1) Ingresar correo → recibe OTP
 *   2) Ingresar OTP → recibe token temporal
 *   3) Crear contraseña → cuenta lista
 */
export function RegistroPage({ onTerminado, onVolverALogin }) {
  const [paso, setPaso] = useState(1)
  const [correo, setCorreo]   = useState('')
  const [codigo, setCodigo]   = useState('')
  const [tokenTmp, setTokenTmp] = useState('')
  const [password, setPassword]   = useState('')
  const [password2, setPassword2] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [info, setInfo]       = useState('')

  // ── Paso 1: solicitar código ──
  async function handlePaso1(e) {
    e?.preventDefault()
    setError(''); setInfo('')
    if (!correo) { setError('Ingresa tu correo'); return }
    setLoading(true)
    try {
      await authApi.solicitarCodigo(correo, 'registro')
      setInfo('✓ Te enviamos un código de 6 dígitos a tu correo.')
      setPaso(2)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  // ── Paso 2: verificar código ──
  async function handlePaso2(e) {
    e?.preventDefault()
    setError(''); setInfo('')
    if (!/^\d{6}$/.test(codigo)) { setError('El código debe tener 6 dígitos'); return }
    setLoading(true)
    try {
      const data = await authApi.verificarCodigo(correo, codigo, 'registro')
      setTokenTmp(data.token)
      setInfo('✓ Correo verificado. Ahora crea tu contraseña.')
      setPaso(3)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  // ── Paso 3: crear password ──
  async function handlePaso3(e) {
    e?.preventDefault()
    setError(''); setInfo('')
    if (password.length < 8)        { setError('La contraseña debe tener al menos 8 caracteres'); return }
    if (password !== password2)     { setError('Las contraseñas no coinciden'); return }
    setLoading(true)
    try {
      await authApi.registrarPassword(tokenTmp, password)
      onTerminado()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function reenviarCodigo() {
    setError(''); setInfo('')
    setLoading(true)
    try {
      await authApi.solicitarCodigo(correo, 'registro')
      setInfo('✓ Código reenviado a tu correo.')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const titulos = {
    1: 'Crear cuenta',
    2: 'Verificar tu correo',
    3: 'Crear contraseña',
  }
  const subtitulos = {
    1: 'Paso 1 de 3 · Ingresa tu correo empresarial',
    2: 'Paso 2 de 3 · Ingresa el código que recibiste',
    3: 'Paso 3 de 3 · Define tu contraseña',
  }

  return (
    <AuthShell titulo={titulos[paso]} subtitulo={subtitulos[paso]}>

      {/* Barra de progreso */}
      <Box sx={{ mb: 2.5 }}>
        <LinearProgress
          variant="determinate" value={(paso / 3) * 100}
          sx={{
            height: 6, borderRadius: 99, backgroundColor: '#F5F3FF',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg,#7C3AED,#D946EF)',
              borderRadius: 99,
            },
          }} />
      </Box>

      {error && (
        <Alert severity="error" sx={{ borderRadius: 2, fontSize: '0.78rem', py: 0.4, mb: 2 }}>{error}</Alert>
      )}
      {info && !error && (
        <Alert severity="success" sx={{ borderRadius: 2, fontSize: '0.78rem', py: 0.4, mb: 2 }}>{info}</Alert>
      )}

      {/* ── Paso 1 ── */}
      {paso === 1 && (
        <Box component="form" onSubmit={handlePaso1} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Mail size={12} color="#7C3AED" /> Correo empresarial
            </Typography>
            <TextField type="email" value={correo} onChange={e => setCorreo(e.target.value)}
              placeholder="tu.correo@geneticalaboratorios.com" fullWidth size="small" autoFocus
              InputProps={{ sx: inputSx }} />
            <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', mt: 0.8 }}>
              Te enviaremos un código de 6 dígitos a este correo.
            </Typography>
          </Box>

          <Button type="submit" variant="contained" disabled={loading}
            startIcon={loading ? null : <ArrowRight size={15} />}
            sx={{
              background: 'linear-gradient(135deg,#7C3AED,#D946EF)',
              borderRadius: 2.5, textTransform: 'none', fontWeight: 700, py: 1.2, mt: 1,
              boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
              '&:hover': { boxShadow: '0 6px 22px rgba(124,58,237,0.45)' },
              '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' },
            }}>
            {loading ? 'Enviando...' : 'Enviar código'}
          </Button>

          <Button onClick={onVolverALogin} size="small" startIcon={<ArrowLeft size={13} />}
            sx={{ color: '#64748b', textTransform: 'none', fontSize: '0.75rem', '&:hover': { color: '#7C3AED', backgroundColor: '#F5F3FF' } }}>
            Volver al inicio de sesión
          </Button>
        </Box>
      )}

      {/* ── Paso 2 ── */}
      {paso === 2 && (
        <Box component="form" onSubmit={handlePaso2} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ShieldCheck size={12} color="#7C3AED" /> Código de 6 dígitos
            </Typography>
            <TextField value={codigo}
              onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="• • • • • •" fullWidth size="small" autoFocus
              inputProps={{ inputMode: 'numeric', maxLength: 6, style: { textAlign: 'center' } }}
              InputProps={{ sx: inputCodigoSx }} />
            <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', mt: 0.8, textAlign: 'center' }}>
              Revisa tu bandeja de entrada en <strong>{correo}</strong>
            </Typography>
          </Box>

          <Button type="submit" variant="contained" disabled={loading || codigo.length !== 6}
            startIcon={loading ? null : <CheckCircle2 size={15} />}
            sx={{
              background: 'linear-gradient(135deg,#7C3AED,#D946EF)',
              borderRadius: 2.5, textTransform: 'none', fontWeight: 700, py: 1.2,
              boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
              '&:hover': { boxShadow: '0 6px 22px rgba(124,58,237,0.45)' },
              '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' },
            }}>
            {loading ? 'Verificando...' : 'Verificar código'}
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Button onClick={() => { setPaso(1); setCodigo('') }} size="small" startIcon={<ArrowLeft size={13} />}
              sx={{ color: '#64748b', textTransform: 'none', fontSize: '0.72rem' }}>
              Cambiar correo
            </Button>
            <Button onClick={reenviarCodigo} size="small" disabled={loading}
              sx={{ color: '#7C3AED', textTransform: 'none', fontSize: '0.72rem', fontWeight: 600 }}>
              Reenviar código
            </Button>
          </Box>
        </Box>
      )}

      {/* ── Paso 3 ── */}
      {paso === 3 && (
        <Box component="form" onSubmit={handlePaso3} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Lock size={12} color="#7C3AED" /> Nueva contraseña
            </Typography>
            <TextField type={showPwd ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres" fullWidth size="small" autoFocus
              InputProps={{
                sx: inputSx,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPwd(s => !s)}>
                      {showPwd ? <EyeOff size={15} color="#94a3b8" /> : <Eye size={15} color="#94a3b8" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }} />
          </Box>

          <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Lock size={12} color="#7C3AED" /> Confirmar contraseña
            </Typography>
            <TextField type={showPwd ? 'text' : 'password'} value={password2}
              onChange={e => setPassword2(e.target.value)}
              placeholder="Vuelve a escribirla" fullWidth size="small"
              InputProps={{ sx: inputSx }} />
          </Box>

          <Box sx={{ backgroundColor: '#F5F3FF', borderRadius: 2, px: 1.5, py: 1.2, border: '1px solid #DDD6FE' }}>
            <Typography sx={{ fontSize: '0.68rem', color: '#6D28D9', fontWeight: 600, lineHeight: 1.5 }}>
              La contraseña debe tener:<br/>
              • Al menos 8 caracteres<br/>
              • Una mayúscula y una minúscula<br/>
              • Al menos un número
            </Typography>
          </Box>

          <Button type="submit" variant="contained" disabled={loading}
            startIcon={loading ? null : <CheckCircle2 size={15} />}
            sx={{
              background: 'linear-gradient(135deg,#7C3AED,#D946EF)',
              borderRadius: 2.5, textTransform: 'none', fontWeight: 700, py: 1.2,
              boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
              '&:hover': { boxShadow: '0 6px 22px rgba(124,58,237,0.45)' },
              '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' },
            }}>
            {loading ? 'Creando cuenta...' : 'Crear mi cuenta'}
          </Button>
        </Box>
      )}
    </AuthShell>
  )
}
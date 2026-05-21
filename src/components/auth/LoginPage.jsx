import { useState } from 'react'
import { Box, Typography, TextField, Button, InputAdornment, IconButton, Alert } from '@mui/material'
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, KeyRound } from 'lucide-react'
import { AuthShell } from './AuthShell.jsx'
import { authApi } from '../../lib/api.js'

const inputSx = {
  borderRadius: 2.5, fontSize: '0.9rem', backgroundColor: '#fafafa',
  '& fieldset': { borderColor: '#e2e8f0' },
  '&:hover fieldset': { borderColor: '#C4B5FD' },
  '&.Mui-focused fieldset': { borderColor: '#7C3AED' },
  '&.Mui-focused': { backgroundColor: '#fff' },
}

export function LoginPage({ onLoggedIn, onIrARegistro, onIrAReset }) {
  const [correo, setCorreo]     = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e) {
    e?.preventDefault()
    setError('')
    if (!correo || !password) { setError('Correo y contraseña son requeridos'); return }

    setLoading(true)
    try {
      const data = await authApi.login(correo, password)
      onLoggedIn(data.usuario)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell titulo="Iniciar Sesión" subtitulo="Accede a tu cuenta para continuar">
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

        {error && (
          <Alert severity="error" sx={{ borderRadius: 2, fontSize: '0.78rem', py: 0.4 }}>
            {error}
          </Alert>
        )}

        <Box>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Mail size={12} color="#7C3AED" /> Correo electrónico
          </Typography>
          <TextField type="email" value={correo} onChange={e => setCorreo(e.target.value)}
            placeholder="tu.correo@geneticalaboratorios.com" fullWidth size="small"
            autoComplete="email"
            InputProps={{ sx: inputSx }} />
        </Box>

        <Box>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.8, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Lock size={12} color="#7C3AED" /> Contraseña
          </Typography>
          <TextField type={showPwd ? 'text' : 'password'} value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" fullWidth size="small"
            autoComplete="current-password"
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

        <Button type="submit" variant="contained" disabled={loading}
          startIcon={loading ? null : <LogIn size={15} />}
          sx={{
            background: 'linear-gradient(135deg,#7C3AED,#D946EF)',
            borderRadius: 2.5, textTransform: 'none', fontWeight: 700, py: 1.2, mt: 1,
            fontSize: '0.88rem',
            boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
            '&:hover': { boxShadow: '0 6px 22px rgba(124,58,237,0.45)' },
            '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' },
          }}>
          {loading ? 'Ingresando...' : 'Iniciar sesión'}
        </Button>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, mt: 1, borderTop: '1px solid #f1f5f9', pt: 2 }}>
          <Button onClick={onIrAReset} size="small" startIcon={<KeyRound size={13} />}
            sx={{ color: '#64748b', textTransform: 'none', fontSize: '0.75rem', '&:hover': { color: '#7C3AED', backgroundColor: '#F5F3FF' } }}>
            Olvidé mi contraseña
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 0.4 }}>
            <Box sx={{ flex: 1, height: 1, backgroundColor: '#f1f5f9' }} />
            <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8' }}>O</Typography>
            <Box sx={{ flex: 1, height: 1, backgroundColor: '#f1f5f9' }} />
          </Box>

          <Button onClick={onIrARegistro} variant="outlined" size="small" startIcon={<UserPlus size={13} />}
            sx={{ textTransform: 'none', color: '#7C3AED', borderColor: '#DDD6FE', borderRadius: 2.5, fontSize: '0.78rem', fontWeight: 600, '&:hover': { borderColor: '#7C3AED', backgroundColor: '#F5F3FF' } }}>
            Crear mi cuenta por primera vez
          </Button>
        </Box>
      </Box>
    </AuthShell>
  )
}
import { useState, useEffect } from 'react'
import { Box, CircularProgress, Snackbar, Alert } from '@mui/material'
import { authApi, getToken, clearToken } from '../../lib/api.js'
import { LoginPage } from './LoginPage.jsx'
import { RegistroPage } from './RegistroPage.jsx'
import { ResetPage } from './ResetPage.jsx'

/**
 * Componente que envuelve la app y solo deja entrar si el usuario está logueado.
 * 
 * Uso: 
 *   <AuthGate>
 *     <App />     ← solo se renderiza si está logueado
 *   </AuthGate>
 */
export function AuthGate({ children }) {
  const [vista, setVista] = useState('login') // 'login' | 'registro' | 'reset'
  const [usuario, setUsuario] = useState(null)
  const [permisos, setPermisos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [snackbar, setSnackbar] = useState({ open: false, msg: '', severity: 'success' })

  // Al montar, intenta restaurar la sesión
  useEffect(() => {
    const token = getToken()
    if (!token) { setCargando(false); return }

    authApi.me()
      .then(data => {
        setUsuario(data.usuario)
        setPermisos(data.permisos)
      })
      .catch(() => {
        clearToken()
        setUsuario(null)
      })
      .finally(() => setCargando(false))
  }, [])

  async function handleLogout() {
    await authApi.logout()
    setUsuario(null)
    setPermisos([])
    setVista('login')
    setSnackbar({ open: true, msg: 'Sesión cerrada', severity: 'info' })
  }

  async function handleLoggedIn(user) {
    setUsuario(user)
    // Cargar permisos
    try {
      const data = await authApi.me()
      setPermisos(data.permisos)
    } catch {}
    setSnackbar({ open: true, msg: `Bienvenido, ${user.nombre}`, severity: 'success' })
  }

  function handleRegistroTerminado() {
    setVista('login')
    setSnackbar({ open: true, msg: '✓ Cuenta creada. Inicia sesión con tu nueva contraseña.', severity: 'success' })
  }

  function handleResetTerminado() {
    setVista('login')
    setSnackbar({ open: true, msg: '✓ Contraseña actualizada. Inicia sesión.', severity: 'success' })
  }

  // Loading inicial
  if (cargando) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F3FF' }}>
        <CircularProgress sx={{ color: '#7C3AED' }} size={48} />
      </Box>
    )
  }

  // Si NO está logueado, mostrar las pantallas según la vista
  if (!usuario) {
    return (
      <>
        {vista === 'login' && (
          <LoginPage
            onLoggedIn={handleLoggedIn}
            onIrARegistro={() => setVista('registro')}
            onIrAReset={() => setVista('reset')}
          />
        )}
        {vista === 'registro' && (
          <RegistroPage
            onTerminado={handleRegistroTerminado}
            onVolverALogin={() => setVista('login')}
          />
        )}
        {vista === 'reset' && (
          <ResetPage
            onTerminado={handleResetTerminado}
            onVolverALogin={() => setVista('login')}
          />
        )}

        <Snackbar open={snackbar.open} autoHideDuration={3500}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
            {snackbar.msg}
          </Alert>
        </Snackbar>
      </>
    )
  }

  // ✓ Logueado → renderizar la app pasándole usuario y logout
  // Inyectamos las props al children
  return (
    <>
      {typeof children === 'function'
        ? children({ usuario, permisos, onLogout: handleLogout })
        : children}
      <Snackbar open={snackbar.open} autoHideDuration={3500}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </>
  )
}
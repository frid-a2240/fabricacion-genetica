import { Box, Typography } from '@mui/material'

/**
 * Shell visual para las pantallas de autenticación.
 * Logo arriba + recuadro morado centrado con el formulario adentro.
 */
export function AuthShell({ titulo, subtitulo, children, ancho = 460 }) {
  return (
    <Box sx={{
      minHeight: '100vh', backgroundColor: '#fff',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      px: 2, py: 4,
      background: 'linear-gradient(160deg, #F5F3FF 0%, #fff 40%, #FDF4FF 100%)',
    }}>

      {/* Logo */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box component="img" src="/genetica-icon.png" alt="Genética Laboratorios"
          sx={{ height: 64, objectFit: 'contain', mb: 1 }} />
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#7C3AED', letterSpacing: 2, textTransform: 'uppercase' }}>
          Sistema de fabricacion
        </Typography>
      </Box>

      {/* Recuadro morado */}
      <Box sx={{
        width: '100%', maxWidth: ancho,
        borderRadius: '16px',
        border: '3px solid #C084FC',
        backgroundColor: '#fff',
        boxShadow: '0 8px 32px rgba(124,58,237,0.2)',
        overflow: 'hidden',
      }}>
        {/* Header con título */}
        <Box sx={{
          background: 'linear-gradient(135deg,#3B0764,#7C3AED,#D946EF)',
          px: 3, py: 2.5,
          textAlign: 'center',
        }}>
          <Typography sx={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.75)', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', mb: 0.3 }}>
            Genética Laboratorios
          </Typography>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
            {titulo}
          </Typography>
          {subtitulo && (
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
              {subtitulo}
            </Typography>
          )}
        </Box>

        {/* Cuerpo */}
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      </Box>

      {/* Footer */}
      <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', mt: 3 }}>
        © {new Date().getFullYear()} Genética Laboratorios · Sistema interno
      </Typography>
    </Box>
  )
}
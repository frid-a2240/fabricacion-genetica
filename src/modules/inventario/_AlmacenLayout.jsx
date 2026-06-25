import { Box, Typography } from '@mui/material'
import { PackageOpen } from 'lucide-react'

export function AlmacenLayout({ code, label, descripcion, Icon, color, grad, mensajeVacio, children }) {
  return (
    <Box sx={{ p: 4 }}>
      {/* Header del almacén */}
      <Box sx={{
        background: `linear-gradient(135deg,${grad[0]},${grad[1]})`,
        borderRadius: 3, p: 3, mb: 3,
        display: 'flex', alignItems: 'center', gap: 2,
        boxShadow: `0 8px 24px ${color}30`,
      }}>
        <Box sx={{
          width: 56, height: 56, borderRadius: 2,
          backgroundColor: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={26} color="#fff" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 700,
            color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 1 }}>
            {code}
          </Typography>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.85)', mt: 0.3 }}>
            {descripcion}
          </Typography>
        </Box>
      </Box>

      {/* Contenido (si se pasa) o empty state */}
      {children || (
        <Box sx={{
          backgroundColor: '#fff', borderRadius: 3,
          border: '1.5px dashed #e2e8f0', p: 6,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
        }}>
          <PackageOpen size={48} color={`${color}40`} />
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color }}>
            Sin productos registrados
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', maxWidth: 400 }}>
            {mensajeVacio}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
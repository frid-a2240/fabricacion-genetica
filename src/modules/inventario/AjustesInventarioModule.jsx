import { Box, Typography } from '@mui/material'
import { SlidersHorizontal } from 'lucide-react'

export default function AjustesInventarioModule() {
  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: 2,
          background: 'linear-gradient(135deg,#7C3AED,#D946EF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <SlidersHorizontal size={20} color="#fff" />
        </Box>
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>
          Ajustes de Inventarios
        </Typography>
      </Box>
      <Typography sx={{ color: '#64748b', fontSize: '0.9rem' }}>
        Módulo en construcción.
      </Typography>
    </Box>
  )
}

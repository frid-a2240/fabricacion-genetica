import { Box, Typography } from '@mui/material'
import { Factory, Warehouse, CalendarDays } from 'lucide-react'

const MODULOS = [
  { id: 'produccion', label: 'Producción', Icon: Factory },
  { id: 'inventario', label: 'Inventario', Icon: Warehouse },
  { id: 'plan',       label: 'Plan',       Icon: CalendarDays },
]

export function Sidebar({ activo, onChange }) {
  return (
    <Box sx={{
      width: 220, flexShrink: 0,
      backgroundColor: '#fff',
      borderRight: '1.5px solid #e2e8f0',
      position: 'sticky', top: 0, height: '100vh',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Branding */}
      <Box sx={{ px: 2.5, py: 2.2, borderBottom: '1px solid #f1f5f9' }}>
        <Box component="img" src="/genetica-icon.png" alt="Genética"
          sx={{ height: 38, objectFit: 'contain', mb: 0.8 }}
          onError={(e) => { e.target.style.display = 'none' }} />
        <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#3B0764', lineHeight: 1.1 }}>
          Genética
        </Typography>
        <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', mt: 0.3 }}>
          MRP · Gestión de Lotes
        </Typography>
      </Box>

      {/* Navegación */}
      <Box sx={{ p: 1.2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {MODULOS.map(({ id, label, Icon }) => {
          const isActive = activo === id
          return (
            <Box key={id} onClick={() => onChange(id)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.2,
                px: 1.5, py: 1.3, borderRadius: 2, cursor: 'pointer',
                transition: 'all 0.15s ease',
                ...(isActive
                  ? {
                      background: 'linear-gradient(135deg,#7C3AED,#D946EF)',
                      color: '#fff',
                      boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
                    }
                  : {
                      color: '#475569',
                      '&:hover': { backgroundColor: '#F5F3FF', color: '#7C3AED' },
                    }),
              }}>
              <Icon size={17} />
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
                {label}
              </Typography>
            </Box>
          )
        })}
      </Box>

      <Box sx={{ flex: 1 }} />
      <Box sx={{ p: 1.5, borderTop: '1px solid #f1f5f9' }}>
        <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', textAlign: 'center' }}>
          v1.0 · 2026
        </Typography>
      </Box>
    </Box>
  )
}
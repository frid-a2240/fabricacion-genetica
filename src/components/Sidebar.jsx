import { Box, Typography } from '@mui/material'
import {
  Factory, Warehouse, CalendarDays,
  SlidersHorizontal, History, ArrowLeftRight,
} from 'lucide-react'

const MODULOS = [
  { id: 'produccion',           label: 'Producción',            Icon: Factory },
  { id: 'inventarios',          label: 'Inventarios',           Icon: Warehouse },
  { id: 'planeacion',           label: 'Planeación',            Icon: CalendarDays },
  { id: 'ajustes-inventarios',  label: 'Ajustes de Inventarios', Icon: SlidersHorizontal },
  { id: 'consulta-historial',   label: 'Consulta Historial',    Icon: History },
  { id: 'transferencias',       label: 'Transferencias',        Icon: ArrowLeftRight },
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
      <Box sx={{ px: 3.8, py: 1.5, borderBottom: '1px solid #f1f5f9' }}>
        <Box component="img" src="/genetica-icon.png" alt="Genética"
          sx={{ height: 85, objectFit: 'contain', mb: 0.8 }}
          onError={(e) => { e.target.style.display = 'none' }} />
      </Box>

      {/* Navegación */}
      <Box sx={{ p: 1.2, display: 'flex', flexDirection: 'column', gap: 0.5, overflowY: 'auto', flex: 1 }}>
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

      <Box sx={{ p: 1.5, borderTop: '1px solid #f1f5f9' }}>
        <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', textAlign: 'center' }}>
          v1.0 · 2026
        </Typography>
      </Box>
    </Box>
  )
}
// componente de sumatoria por medicamento
// const =
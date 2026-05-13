import { Box, Typography, Paper } from '@mui/material'
import { ChevronRight, Factory, Truck } from 'lucide-react'
import { ProcessCard } from './ProcessCard.jsx'

export function VSMFlow({ lote, fechasProceso, etapas, currentUser, onActualizar }) {
  const procesosOrdenados = [...fechasProceso].sort(
    (a, b) => (a.etapas_proceso?.orden || 0) - (b.etapas_proceso?.orden || 0)
  )

  return (
    <Box>
      {/* Info lote activo */}
      <Paper elevation={0} sx={{
        px: 3, py: 1.5, mb: 2, borderRadius: 4,
        border: '1.5px solid #DDD6FE', backgroundColor: '#F5F3FF',
        display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
        boxShadow: '0 2px 12px rgba(124,58,237,0.07)'
      }}>
        <Factory size={18} color="#7C3AED" />
        <Typography sx={{ fontWeight: 800, color: '#3B0764', fontSize: '0.85rem', fontFamily: 'monospace' }}>
          {lote.lote}
        </Typography>
        <Typography sx={{ color: '#475569', fontSize: '0.82rem', flexGrow: 1 }}>
          {lote.producto}
        </Typography>
        {lote.cantidad && (
          <Typography sx={{ fontWeight: 700, color: '#7C3AED', fontSize: '0.85rem' }}>
            Qty: {lote.cantidad.toLocaleString()}
          </Typography>
        )}
      </Paper>

      {/* Flujo horizontal */}
      <Box sx={{ overflowX: 'auto', pb: 3 }}>
        <Box sx={{
          display: 'flex', alignItems: 'flex-start', gap: 0,
          minWidth: 'max-content', px: 1, py: 1
        }}>
          {/* Inicio */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2, mr: 1 }}>
            <Box sx={{ backgroundColor: '#F5F3FF', borderRadius: 3, p: 1 }}>
              <Factory size={28} color="#7C3AED" />
            </Box>
            <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', mt: 0.5, fontWeight: 600 }}>INICIO</Typography>
          </Box>

          <ChevronRight size={22} color="#DDD6FE" style={{ marginTop: 22 }} />

          {procesosOrdenados.map((fp, index) => (
            <Box key={fp.id} sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <ProcessCard
                fechaProceso={fp} lote={lote} currentUser={currentUser}
                onActualizar={onActualizar} index={index}
              />
              {index < procesosOrdenados.length - 1 && (
                <Box sx={{ display: 'flex', alignItems: 'center', height: 210, px: 0.5 }}>
                  <ChevronRight size={24} color="#DDD6FE" strokeWidth={2.5} />
                </Box>
              )}
            </Box>
          ))}

          <ChevronRight size={22} color="#DDD6FE" style={{ marginTop: 22 }} />

          {/* Fin */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 2, ml: 1 }}>
            <Box sx={{ backgroundColor: '#f0fdf4', borderRadius: 3, p: 1 }}>
              <Truck size={28} color="#16a34a" />
            </Box>
            <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', mt: 0.5, fontWeight: 600 }}>CDMX</Typography>
          </Box>
        </Box>

        {/* Leyenda */}
        <Box sx={{ display: 'flex', gap: 3, px: 2, pt: 1, flexWrap: 'wrap' }}>
          {[
            { color: '#16a34a', bg: '#f0fdf4', label: 'Completado' },
            { color: '#dc2626', bg: '#fff5f5', label: 'Atrasado' },
            { color: '#d97706', bg: '#fffbeb', label: 'Hoy' },
            { color: '#7C3AED', bg: '#F5F3FF', label: 'Programado' },
            { color: '#64748b', bg: '#f8fafc', label: 'Sin fecha' },
          ].map(l => (
            <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Box sx={{ width: 11, height: 11, borderRadius: 1.5, backgroundColor: l.bg, border: `2px solid ${l.color}` }} />
              <Typography sx={{ fontSize: '0.7rem', color: '#64748b' }}>{l.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
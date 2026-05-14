import { Box, Paper, Typography, Grid } from '@mui/material'
import { CheckCircle2, AlertTriangle, Clock, Layers, XCircle } from 'lucide-react'

export function Dashboard({ stats, loteActivo }) {
  const cards = [
    { label: 'Total Etapas',  value: stats.total,       icon: Layers,       color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
    { label: 'Completadas',   value: stats.completados, icon: CheckCircle2, color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
    { label: 'Fuera de plan', value: stats.fueraDePlan, icon: XCircle,      color: '#dc2626', bg: '#fff5f5', border: '#fecaca' },
    { label: 'Atrasadas',     value: stats.atrasados,   icon: AlertTriangle,color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    { label: 'Pendientes',    value: stats.pendientes,  icon: Clock,        color: '#D946EF', bg: '#FDF4FF', border: '#F5D0FE' },
  ]
  const pct = stats.total > 0 ? Math.round((stats.completados / stats.total) * 100) : 0

  return (
    <Box sx={{ mb: 3 }}>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {cards.map((c, i) => {
          const Icon = c.icon
          return (
            <Grid item xs={6} sm={4} md key={i}>
              <Paper elevation={0} sx={{
                p: 2, borderRadius: 4, border: `1.5px solid ${c.border}`,
                backgroundColor: c.bg, display: 'flex', alignItems: 'center', gap: 1.5,
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(0,0,0,0.08)' }
              }}>
                <Box sx={{
                  width: 42, height: 42, borderRadius: 3,
                  backgroundColor: c.color + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <Icon size={20} color={c.color} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '1.7rem', fontWeight: 800, color: c.color, lineHeight: 1 }}>
                    {c.value}
                  </Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, mt: 0.3 }}>
                    {c.label}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          )
        })}
      </Grid>

      {loteActivo && (
        <Paper elevation={0} sx={{
          p: 2.5, borderRadius: 4, border: '1.5px solid #DDD6FE',
          backgroundColor: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.2 }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Avance del lote: <span style={{ color: '#7C3AED' }}>{loteActivo.lote}</span>
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: pct === 100 ? '#16a34a' : '#7C3AED' }}>
              {pct}%
            </Typography>
          </Box>
          <Box sx={{ height: 10, backgroundColor: '#F5F3FF', borderRadius: 99, overflow: 'hidden' }}>
            <Box sx={{
              height: '100%', width: `${pct}%`, borderRadius: 99,
              background: pct === 100
                ? 'linear-gradient(90deg, #16a34a, #4ade80)'
                : 'linear-gradient(90deg, #7C3AED, #D946EF)',
              transition: 'width 0.6s ease'
            }} />
          </Box>
        </Paper>
      )}
    </Box>
  )
}
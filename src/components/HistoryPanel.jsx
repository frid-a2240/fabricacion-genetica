import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip
} from '@mui/material'
import { X, History, User, Calendar, ArrowRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

function formatFecha(iso) {
  if (!iso) return null
  try { return format(parseISO(iso), 'dd/MMM/yy', { locale: es }).toUpperCase() }
  catch { return iso }
}
function formatDateTime(iso) {
  if (!iso) return '—'
  try { return format(parseISO(iso), 'dd/MM/yy HH:mm:ss') }
  catch { return iso }
}

export function HistoryPanel({ historial, lote, onClose }) {
  return (
    <Paper elevation={0} sx={{
      mt: 3, borderRadius: 4, overflow: 'hidden',
      border: '1.5px solid #bfdbfe',
      boxShadow: '0 4px 20px rgba(37,99,168,0.08)'
    }}>
      {/* Header */}
      <Box sx={{
        px: 3, py: 2,
        background: 'linear-gradient(135deg, #1a3a5c, #2563a8)',
        display: 'flex', alignItems: 'center', gap: 2
      }}>
        <History size={20} color="#93c5fd" />
        <Typography sx={{ color: '#fff', fontWeight: 700, flexGrow: 1, fontSize: '0.9rem', letterSpacing: 0.3 }}>
          HISTORIAL DE MOVIMIENTOS — {lote.lote}
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem' }}>
          {historial.length} registros
        </Typography>
        <Tooltip title="Cerrar">
          <IconButton size="small" onClick={onClose} sx={{ color: '#93c5fd' }}>
            <X size={17} />
          </IconButton>
        </Tooltip>
      </Box>

      {historial.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <History size={38} color="#cbd5e1" />
          <Typography sx={{ color: '#94a3b8', mt: 2, fontSize: '0.88rem' }}>
            No hay movimientos registrados para este lote
          </Typography>
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: 360 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {[
                  { label: 'FECHA/HORA', icon: Calendar },
                  { label: 'USUARIO',    icon: User },
                  { label: 'ETAPA',      icon: null },
                  { label: 'ANTERIOR',   icon: null },
                  { label: '',           icon: null },
                  { label: 'NUEVA',      icon: null },
                  { label: 'CANTIDAD',   icon: null },
                ].map(({ label, icon: Icon }, i) => (
                  <TableCell key={i} sx={{
                    backgroundColor: '#f8fafc', fontSize: '0.67rem', fontWeight: 700,
                    letterSpacing: 0.5, color: '#64748b', py: 1.2,
                    borderBottom: '1.5px solid #e2e8f0', whiteSpace: 'nowrap'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {Icon && <Icon size={11} />}{label}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {historial.map((reg, i) => (
                <TableRow key={reg.id || i} sx={{
                  '&:hover': { backgroundColor: '#f8fafc' },
                  backgroundColor: i % 2 === 0 ? '#fdfdfd' : '#fff',
                }}>
                  <TableCell sx={{ fontSize: '0.73rem', color: '#374151', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                    {formatDateTime(reg.fecha_captura)}
                  </TableCell>
                  <TableCell>
                    <Chip icon={<User size={11} />} label={reg.nombre_usuario} size="small" sx={{
                      height: 20, fontSize: '0.68rem', fontWeight: 600,
                      backgroundColor: '#eff6ff', color: '#2563a8',
                      border: '1px solid #bfdbfe', borderRadius: 2,
                      '& .MuiChip-icon': { color: '#2563a8' }
                    }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.73rem', color: '#374151', maxWidth: 160 }}>
                    {reg.etapa_nombre}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.73rem', fontFamily: 'monospace', color: reg.fecha_actual_anterior ? '#dc2626' : '#cbd5e1', fontStyle: reg.fecha_actual_anterior ? 'normal' : 'italic' }}>
                    {formatFecha(reg.fecha_actual_anterior) || 'sin fecha'}
                  </TableCell>
                  <TableCell sx={{ px: 0.5 }}>
                    <ArrowRight size={13} color="#cbd5e1" />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.73rem', fontFamily: 'monospace', fontWeight: 700, color: reg.fecha_actual_nueva ? '#16a34a' : '#cbd5e1', fontStyle: reg.fecha_actual_nueva ? 'normal' : 'italic' }}>
                    {formatFecha(reg.fecha_actual_nueva) || 'sin fecha'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.73rem', color: '#64748b', fontFamily: 'monospace' }}>
                    {reg.cantidad ? reg.cantidad.toLocaleString() : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  )
}
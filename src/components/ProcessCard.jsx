import { useState } from 'react'
import {
  Box, Typography, Tooltip, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField
} from '@mui/material'
import { Calendar, Hash, User, Edit3, Check, X } from 'lucide-react'
import { format, parseISO, isPast, isToday } from 'date-fns'
import { es } from 'date-fns/locale'

function getEstado(fechaPlan, fechaActual) {
  if (fechaActual)  return { border: '#16a34a', header: '#16a34a', bg: '#f0fdf4', label: 'Completado' }
  if (!fechaPlan)   return { border: '#94a3b8', header: '#64748b', bg: '#f8fafc', label: 'Sin fecha' }
  const plan = parseISO(fechaPlan)
  if (isPast(plan) && !isToday(plan)) return { border: '#dc2626', header: '#dc2626', bg: '#fff5f5', label: 'Atrasado' }
  if (isToday(plan)) return { border: '#d97706', header: '#d97706', bg: '#fffbeb', label: 'Hoy' }
  return { border: '#7C3AED', header: '#7C3AED', bg: '#F5F3FF', label: 'Programado' }
}

function formatFecha(iso) {
  if (!iso) return null
  try { return format(parseISO(iso), 'dd/MMM/yy', { locale: es }).toUpperCase() }
  catch { return iso }
}

export function ProcessCard({ fechaProceso, lote, currentUser, onActualizar, index }) {
  const [editDialog, setEditDialog] = useState(false)
  const [editPlan, setEditPlan]     = useState(fechaProceso.fecha_plan || '')
  const [editFecha, setEditFecha]   = useState(fechaProceso.fecha_actual || '')
  const [editCantidad, setEditCantidad] = useState(fechaProceso.cantidad_actual?.toString() || '')
  const [guardando, setGuardando]   = useState(false)

  const etapa  = fechaProceso.etapas_proceso
  const estado = getEstado(fechaProceso.fecha_plan, fechaProceso.fecha_actual)

  function diasRetraso() {
    if (fechaProceso.fecha_actual || !fechaProceso.fecha_plan) return null
    const diff = Math.floor((new Date() - parseISO(fechaProceso.fecha_plan)) / 86400000)
    return diff > 0 ? diff : null
  }
  const retraso = diasRetraso()

  async function handleGuardar() {
    setGuardando(true)
    await onActualizar(
      fechaProceso.id,
      fechaProceso.etapa_id,
      editPlan    || null,
      editFecha   || null,
      editCantidad ? parseInt(editCantidad) : null
    )
    setGuardando(false)
    setEditDialog(false)
  }

  function handleAbrir() {
    setEditPlan(fechaProceso.fecha_plan || '')
    setEditFecha(fechaProceso.fecha_actual || '')
    setEditCantidad(fechaProceso.cantidad_actual?.toString() || '')
    setEditDialog(true)
  }

  return (
    <>
      <Box sx={{
        width: 168, borderRadius: 3, overflow: 'hidden',
        border: `2px solid ${estado.border}22`,
        backgroundColor: estado.bg,
        boxShadow: `0 2px 12px ${estado.border}15`,
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 24px ${estado.border}25` },
        flexShrink: 0,
      }}>
        {/* Header */}
        <Box sx={{ backgroundColor: estado.header, px: 1.5, py: 1,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Typography sx={{ color: '#fff', fontSize: '0.68rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 1.3, flex: 1 }}>
            {etapa?.nombre || `Etapa ${index + 1}`}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.62rem', fontWeight: 800, ml: 1, flexShrink: 0 }}>
            {String(index + 1).padStart(2, '0')}
          </Typography>
        </Box>

        {/* Body */}
        <Box sx={{ px: 1.5, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1.2 }}>

          {/* PLAN */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
              <Calendar size={11} color="#94a3b8" />
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5 }}>PLAN</Typography>
            </Box>
            <Tooltip title="Clic para editar" arrow>
              <Box onClick={handleAbrir} sx={{
                border: '1.5px dashed #cbd5e188', borderRadius: 2,
                px: 1, py: 0.6, cursor: 'pointer', backgroundColor: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                minHeight: 28,
                '&:hover': { backgroundColor: '#f8fafc', borderStyle: 'solid', borderColor: '#94a3b8' }
              }}>
                <Typography sx={{
                  fontSize: '0.76rem', fontWeight: 600,
                  color: fechaProceso.fecha_plan ? '#1e293b' : '#cbd5e1',
                  fontFamily: 'monospace',
                  fontStyle: fechaProceso.fecha_plan ? 'normal' : 'italic'
                }}>
                  {formatFecha(fechaProceso.fecha_plan) || 'Sin fecha'}
                </Typography>
                <Edit3 size={10} color="#94a3b8" />
              </Box>
            </Tooltip>
          </Box>

          {/* ACTUAL */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
              <Calendar size={11} color={estado.border} />
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: estado.border, letterSpacing: 0.5 }}>ACTUAL</Typography>
            </Box>
            <Tooltip title="Clic para editar" arrow>
              <Box onClick={handleAbrir} sx={{
                border: `1.5px dashed ${estado.border}88`, borderRadius: 2,
                px: 1, py: 0.8, cursor: 'pointer', backgroundColor: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                minHeight: 34,
                '&:hover': { backgroundColor: '#f8fafc', borderStyle: 'solid', borderColor: estado.border }
              }}>
                <Typography sx={{
                  fontSize: '0.76rem',
                  fontWeight: fechaProceso.fecha_actual ? 700 : 400,
                  color: fechaProceso.fecha_actual ? estado.header : '#cbd5e1',
                  fontFamily: 'monospace',
                  fontStyle: fechaProceso.fecha_actual ? 'normal' : 'italic'
                }}>
                  {formatFecha(fechaProceso.fecha_actual) || 'Sin fecha'}
                </Typography>
                <Edit3 size={11} color={estado.border} />
              </Box>
            </Tooltip>
          </Box>

          {/* USUARIO */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <User size={10} color="#94a3b8" />
            <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', fontStyle: 'italic' }}>
              {currentUser || '—'}
            </Typography>
          </Box>

          {/* CANTIDAD */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
              <Hash size={11} color="#94a3b8" />
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5 }}>CANTIDAD</Typography>
            </Box>
            <Tooltip title="Clic para editar" arrow>
              <Box onClick={handleAbrir} sx={{
                border: '1.5px dashed #cbd5e188', borderRadius: 2,
                px: 1, py: 0.6, cursor: 'pointer', backgroundColor: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                minHeight: 28,
                '&:hover': { backgroundColor: '#f8fafc', borderStyle: 'solid', borderColor: '#94a3b8' }
              }}>
                <Typography sx={{
                  fontSize: '0.76rem', fontFamily: 'monospace',
                  fontWeight: fechaProceso.cantidad_actual ? 700 : 400,
                  color: fechaProceso.cantidad_actual ? '#1e293b' : '#cbd5e1',
                  fontStyle: fechaProceso.cantidad_actual ? 'normal' : 'italic'
                }}>
                  {fechaProceso.cantidad_actual?.toLocaleString() || 'Sin cantidad'}
                </Typography>
                <Edit3 size={10} color="#94a3b8" />
              </Box>
            </Tooltip>
          </Box>

          {/* Badge retraso */}
          {retraso && (
            <Chip label={`+${retraso}d`} size="small" sx={{
              height: 18, fontSize: '0.6rem', fontWeight: 700,
              backgroundColor: '#fef2f2', color: '#dc2626',
              border: '1px solid #fecaca', borderRadius: 2
            }} />
          )}
        </Box>
      </Box>

      {/* Dialog edición */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{
          backgroundColor: estado.header, color: '#fff', fontWeight: 700,
          py: 1.5, fontSize: '0.88rem', borderRadius: '16px 16px 0 0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Edit3 size={17} />
            {etapa?.nombre} — Editar
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Fecha Plan" type="date" value={editPlan}
            onChange={e => setEditPlan(e.target.value)} fullWidth
            InputLabelProps={{ shrink: true }}
            helperText="Fecha programada para este proceso"
            InputProps={{ sx: { borderRadius: 3 } }}
          />
          <TextField
            label="Fecha Actual" type="date" value={editFecha}
            onChange={e => setEditFecha(e.target.value)} fullWidth
            InputLabelProps={{ shrink: true }}
            helperText="Fecha en que se completó este proceso"
            InputProps={{ sx: { borderRadius: 3 } }}
          />
          <TextField
            label="Cantidad" type="number" value={editCantidad}
            onChange={e => setEditCantidad(e.target.value)} fullWidth
            helperText="Unidades procesadas en esta etapa"
            InputProps={{ sx: { borderRadius: 3 } }}
          />

          {/* Usuario de captura */}
          <Box sx={{ backgroundColor: '#F5F3FF', borderRadius: 3, p: 1.5,
            display: 'flex', alignItems: 'center', gap: 1 }}>
            <User size={16} color="#7C3AED" />
            <Box>
              <Typography sx={{ fontSize: '0.68rem', color: '#7C3AED', fontWeight: 700 }}>
                USUARIO DE CAPTURA
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                {currentUser}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button startIcon={<X size={15} />} onClick={() => setEditDialog(false)}
            sx={{ borderRadius: 3 }} size="small">
            Cancelar
          </Button>
          <Button variant="contained" startIcon={guardando ? null : <Check size={15} />}
            onClick={handleGuardar} disabled={guardando} size="small"
            sx={{ backgroundColor: estado.header, borderRadius: 3 }}>
            {guardando ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
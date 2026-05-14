import { useState } from 'react'
import {
  Box, Typography, Tooltip, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField
} from '@mui/material'
import { Calendar, Hash, User, Edit3, Check, X, Lock } from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'

// Fecha de referencia "hoy" — cambia a new Date() cuando quieras usar la fecha real del sistema
const HOY = new Date('2026-05-13T00:00:00')

function getEstado(fechaPlan, fechaActual) {
  if (fechaActual && fechaPlan) {
    const diff = differenceInDays(parseISO(fechaActual), parseISO(fechaPlan))
    if (diff > 0) return { border: '#dc2626', header: '#dc2626', bg: '#fff5f5', label: 'Fuera de plan', tipo: 'tarde', diasDiff: diff }
    return { border: '#16a34a', header: '#16a34a', bg: '#f0fdf4', label: 'Completado', tipo: 'completado' }
  }
  if (fechaActual && !fechaPlan) {
    return { border: '#16a34a', header: '#16a34a', bg: '#f0fdf4', label: 'Completado', tipo: 'completado' }
  }
  if (!fechaPlan) return { border: '#94a3b8', header: '#64748b', bg: '#f8fafc', label: 'Sin fecha', tipo: 'sin_fecha' }

  const plan = parseISO(fechaPlan)
  const hoyNorm = new Date(HOY)
  hoyNorm.setHours(0, 0, 0, 0)

  if (plan < hoyNorm)
    return { border: '#d97706', header: '#d97706', bg: '#fffbeb', label: 'Atrasado', tipo: 'atrasado' }
  if (plan.toDateString() === hoyNorm.toDateString())
    return { border: '#d97706', header: '#d97706', bg: '#fffbeb', label: 'Hoy', tipo: 'hoy' }
  return { border: '#7C3AED', header: '#7C3AED', bg: '#F5F3FF', label: 'Programado', tipo: 'programado' }
}

function formatFecha(iso) {
  if (!iso) return null
  try { return format(parseISO(iso), 'dd/MMM/yy', { locale: es }).toUpperCase() }
  catch { return iso }
}

export function ProcessCard({ fechaProceso, lote, currentUser, onActualizar, index }) {
  const tienePlanGuardado = !!fechaProceso.fecha_plan

  const [editDialog, setEditDialog]     = useState(false)
  const [editPlan, setEditPlan]         = useState(fechaProceso.fecha_plan || '')
  const [editFecha, setEditFecha]       = useState(fechaProceso.fecha_actual || '')
  const [editCantidad, setEditCantidad] = useState(fechaProceso.cantidad_actual?.toString() || '')
  const [guardando, setGuardando]       = useState(false)

  const etapa  = fechaProceso.etapas_proceso
  const estado = getEstado(fechaProceso.fecha_plan, fechaProceso.fecha_actual)

  function diasSinCompletar() {
    if (fechaProceso.fecha_actual || !fechaProceso.fecha_plan) return null
    const diff = differenceInDays(HOY, parseISO(fechaProceso.fecha_plan))
    return diff > 0 ? diff : null
  }
  function diasPasados() {
    if (!fechaProceso.fecha_actual || !fechaProceso.fecha_plan) return null
    const diff = differenceInDays(parseISO(fechaProceso.fecha_actual), parseISO(fechaProceso.fecha_plan))
    return diff > 0 ? diff : null
  }

  const diasAtraso    = diasSinCompletar()
  const diasExcedidos = diasPasados()

  function handleAbrir() {
    setEditPlan(fechaProceso.fecha_plan || '')
    setEditFecha(fechaProceso.fecha_actual || '')
    setEditCantidad(fechaProceso.cantidad_actual?.toString() || '')
    setEditDialog(true)
  }

  async function handleGuardar() {
    setGuardando(true)
    const planAEnviar = tienePlanGuardado ? (fechaProceso.fecha_plan || null) : (editPlan || null)
    await onActualizar(
      fechaProceso.id,
      fechaProceso.etapa_id,
      planAEnviar,
      editFecha    || null,
      editCantidad ? parseInt(editCantidad) : null
    )
    setGuardando(false)
    setEditDialog(false)
  }

  return (
    <>
      <Box sx={{
        width: 180, borderRadius: 3, overflow: 'hidden',
        border: `2px solid ${estado.border}22`,
        backgroundColor: estado.bg,
        boxShadow: `0 2px 12px ${estado.border}15`,
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 8px 24px ${estado.border}25` },
        flexShrink: 0,
      }}>
        {/* Header */}
        <Box sx={{
          backgroundColor: estado.header, px: 1.5, py: 1,
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <Typography sx={{
            color: '#fff', fontSize: '0.68rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 1.3, flex: 1,
          }}>
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.4 }}>
              <Calendar size={11} color="#94a3b8" />
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5 }}>PLAN</Typography>
              {tienePlanGuardado
                ? <Lock size={9} color="#cbd5e1" style={{ marginLeft: 2 }} />
                : <Edit3 size={9} color="#7C3AED" style={{ marginLeft: 2 }} />
              }
            </Box>

            {tienePlanGuardado ? (
              <Box sx={{
                border: '1.5px solid #e2e8f0', borderRadius: 2,
                px: 1, py: 0.6, backgroundColor: '#f8fafc',
                display: 'flex', alignItems: 'center', minHeight: 28,
              }}>
                <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: '#64748b', fontFamily: 'monospace' }}>
                  {formatFecha(fechaProceso.fecha_plan)}
                </Typography>
              </Box>
            ) : (
              <Tooltip title="Establecer fecha plan — solo se puede una vez" arrow>
                <Box onClick={handleAbrir} sx={{
                  border: '1.5px dashed #7C3AED55', borderRadius: 2,
                  px: 1, py: 0.6, cursor: 'pointer', backgroundColor: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  minHeight: 28,
                  '&:hover': { backgroundColor: '#F5F3FF', borderStyle: 'solid', borderColor: '#7C3AED' }
                }}>
                  <Typography sx={{ fontSize: '0.76rem', color: '#cbd5e1', fontFamily: 'monospace', fontStyle: 'italic' }}>
                    Sin fecha
                  </Typography>
                  <Edit3 size={10} color="#7C3AED" />
                </Box>
              </Tooltip>
            )}
          </Box>

          {/* ACTUAL */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.4 }}>
              <Calendar size={11} color={estado.border} />
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: estado.border, letterSpacing: 0.5 }}>ACTUAL</Typography>
            </Box>
            <Tooltip title="Clic para registrar fecha real" arrow>
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
                  color: fechaProceso.fecha_actual ? (diasExcedidos ? '#dc2626' : estado.header) : '#cbd5e1',
                  fontFamily: 'monospace',
                  fontStyle: fechaProceso.fecha_actual ? 'normal' : 'italic',
                }}>
                  {formatFecha(fechaProceso.fecha_actual) || 'Sin fecha'}
                </Typography>
                <Edit3 size={11} color={estado.border} />
              </Box>
            </Tooltip>
          </Box>

          {/* Usuario */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <User size={10} color="#94a3b8" />
            <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', fontStyle: 'italic' }}>
              {currentUser || '—'}
            </Typography>
          </Box>

          {/* CANTIDAD */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.4 }}>
              <Hash size={11} color="#94a3b8" />
              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', letterSpacing: 0.5 }}>CANTIDAD</Typography>
            </Box>
            <Tooltip title="Clic para registrar cantidad" arrow>
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
                  fontStyle: fechaProceso.cantidad_actual ? 'normal' : 'italic',
                }}>
                  {fechaProceso.cantidad_actual?.toLocaleString() || 'Sin cantidad'}
                </Typography>
                <Edit3 size={10} color="#94a3b8" />
              </Box>
            </Tooltip>
          </Box>

          {diasAtraso && (
            <Chip label={`+${diasAtraso}d atrasado`} size="small" sx={{
              height: 18, fontSize: '0.6rem', fontWeight: 700,
              backgroundColor: '#fffbeb', color: '#d97706',
              border: '1px solid #fde68a', borderRadius: 2,
            }} />
          )}
          {diasExcedidos && (
            <Chip label={`+${diasExcedidos}d fuera de plan`} size="small" sx={{
              height: 18, fontSize: '0.6rem', fontWeight: 700,
              backgroundColor: '#fef2f2', color: '#dc2626',
              border: '1px solid #fecaca', borderRadius: 2,
            }} />
          )}
        </Box>
      </Box>

      {/* Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{
          backgroundColor: estado.header, color: '#fff', fontWeight: 700,
          py: 1.5, fontSize: '0.88rem', borderRadius: '16px 16px 0 0',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Edit3 size={17} />
            {etapa?.nombre} — Editar
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>

          {tienePlanGuardado ? (
            <Box sx={{
              backgroundColor: '#f8fafc', borderRadius: 3, p: 1.5,
              display: 'flex', alignItems: 'center', gap: 1, border: '1px solid #e2e8f0',
            }}>
              <Lock size={15} color="#94a3b8" />
              <Box>
                <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  Fecha plan (bloqueada)
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', fontFamily: 'monospace' }}>
                  {formatFecha(fechaProceso.fecha_plan)}
                </Typography>
              </Box>
            </Box>
          ) : (
            <TextField
              label="Fecha Plan *" type="date" value={editPlan}
              onChange={e => setEditPlan(e.target.value)} fullWidth
              InputLabelProps={{ shrink: true }}
              helperText="⚠ Se grabará una sola vez y no podrá modificarse"
              InputProps={{ sx: { borderRadius: 3 } }}
            />
          )}

          <TextField
            label="Fecha Actual" type="date" value={editFecha}
            onChange={e => setEditFecha(e.target.value)} fullWidth
            InputLabelProps={{ shrink: true }}
            helperText="Fecha en que se completó este proceso"
            InputProps={{ sx: { borderRadius: 3 } }}
          />

          {editFecha && fechaProceso.fecha_plan && (() => {
            const diff = differenceInDays(parseISO(editFecha), parseISO(fechaProceso.fecha_plan))
            if (diff > 0) return (
              <Box sx={{ backgroundColor: '#fef2f2', borderRadius: 2, px: 1.5, py: 1, border: '1px solid #fecaca' }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 700 }}>
                  ⚠ {diff} día{diff > 1 ? 's' : ''} fuera de plan
                </Typography>
              </Box>
            )
            if (diff < 0) return (
              <Box sx={{ backgroundColor: '#f0fdf4', borderRadius: 2, px: 1.5, py: 1, border: '1px solid #bbf7d0' }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                  ✓ {Math.abs(diff)} día{Math.abs(diff) > 1 ? 's' : ''} antes del plan
                </Typography>
              </Box>
            )
            return (
              <Box sx={{ backgroundColor: '#f0fdf4', borderRadius: 2, px: 1.5, py: 1, border: '1px solid #bbf7d0' }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700 }}>
                  ✓ En fecha exacta del plan
                </Typography>
              </Box>
            )
          })()}

          <TextField
            label="Cantidad" type="number" value={editCantidad}
            onChange={e => setEditCantidad(e.target.value)} fullWidth
            helperText="Unidades procesadas en esta etapa"
            InputProps={{ sx: { borderRadius: 3 } }}
          />

          <Box sx={{ backgroundColor: '#F5F3FF', borderRadius: 3, p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <User size={16} color="#7C3AED" />
            <Box>
              <Typography sx={{ fontSize: '0.68rem', color: '#7C3AED', fontWeight: 700 }}>USUARIO DE CAPTURA</Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{currentUser}</Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button startIcon={<X size={15} />} onClick={() => setEditDialog(false)} sx={{ borderRadius: 3 }} size="small">
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={guardando ? null : <Check size={15} />}
            onClick={handleGuardar}
            disabled={guardando || (!tienePlanGuardado && !editPlan)}
            size="small"
            sx={{ backgroundColor: estado.header, borderRadius: 3 }}
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
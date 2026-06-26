import { useState, useEffect } from 'react'
import { Box, Typography, CircularProgress, Button, Chip, Paper } from '@mui/material'
import { CalendarDays, RefreshCw, CircleDot, CheckCircle2, XCircle, Clock, AlertTriangle, BadgeCheck, Ban } from 'lucide-react'
import { differenceInDays, parseISO, format, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../lib/supabase.js'
import { ORDEN_ETAPA } from '../../constants/etapas.js'

const LEAD_TIME = 9 // días
const HOY = new Date('2026-05-13T00:00:00')
function fmtFecha(iso) {
  if (!iso) return '—'
  try { return format(parseISO(iso), 'dd/MMM/yy', { locale: es }).toUpperCase() }
  catch { return iso }
}

// ─── Semáforo ───
function evaluarSemaforo(lote, fechasLote) {
  const e1 = fechasLote.find(f => f.etapas_proceso?.orden === 1)
  const eAceptado = fechasLote.find(f => f.etapas_proceso?.orden === ORDEN_ETAPA.ACEPTADO)
  if (!e1?.fecha_plan) return { color: '#94a3b8', bg: '#f8fafc', label: 'Sin plan', Icon: Clock }

  const inicio = parseISO(e1.fecha_plan)
  const limite = addDays(inicio, LEAD_TIME)

  if (lote.estatus === 'enviado') {
    const eEnvio = fechasLote.find(f => f.etapas_proceso?.orden === ORDEN_ETAPA.ENVIO)
    const fechaFin = eEnvio?.fecha_actual ? parseISO(eEnvio.fecha_actual) : new Date(HOY)
    const diff = differenceInDays(fechaFin, limite)
    if (diff <= 0) return { color: '#0891b2', bg: '#ecfeff', label: 'Enviado a tiempo', Icon: BadgeCheck }
    return { color: '#0891b2', bg: '#ecfeff', label: `Enviado +${diff}d`, Icon: BadgeCheck }
  }

  if (lote.estatus === 'liberado' || lote.estatus === 'rechazado') {
    const fechaFin = eAceptado?.fecha_actual ? parseISO(eAceptado.fecha_actual) : new Date(HOY)
    const diff = differenceInDays(fechaFin, limite)
    const prefijo = lote.estatus === 'liberado' ? 'Aceptado' : 'Rechazado'
    const Icono   = lote.estatus === 'liberado' ? BadgeCheck : Ban

    if (diff <= 0)  return { color: '#16a34a', bg: '#f0fdf4', label: `${prefijo} a tiempo`,  Icon: Icono }
    if (diff <= 9)  return { color: '#d97706', bg: '#fffbeb', label: `${prefijo} +${diff}d`, Icon: Icono }
    return            { color: '#dc2626', bg: '#fef2f2', label: `${prefijo} +${diff}d`,       Icon: Icono }
  }

  // ─── Lotes en proceso ───
  const hoy = new Date(HOY)
  const diff = differenceInDays(hoy, limite)
  if (diff <= 0)  return { color: '#16a34a', bg: '#f0fdf4', label: 'En tiempo',       Icon: CheckCircle2 }
  if (diff <= 9)  return { color: '#d97706', bg: '#fffbeb', label: `+${diff}d tarde`, Icon: AlertTriangle }
  return            { color: '#dc2626', bg: '#fef2f2', label: `+${diff}d tarde`,       Icon: AlertTriangle }
}

// ─── Una fila del Gantt ───
function GanttRow({ lote, fechasLote }) {
  const semaforo = evaluarSemaforo(lote, fechasLote)
  const Icono = semaforo.Icon
  const ordenadas = [...fechasLote].sort((a, b) => (a.etapas_proceso?.orden || 0) - (b.etapas_proceso?.orden || 0))
  const completadas = ordenadas.filter(f => f.fecha_actual).length
  const total = ordenadas.length
  const pct = total > 0 ? (completadas / total) * 100 : 0

  const e1 = fechasLote.find(f => f.etapas_proceso?.orden === 1)
  const inicio = e1?.fecha_plan ? parseISO(e1.fecha_plan) : null
  const limite = inicio ? addDays(inicio, LEAD_TIME) : null

  // Días transcurridos (hasta hoy o hasta etapa 6 real)
  let diasReales = null
  if (inicio) {
    const fin = (lote.estatus === 'liberado' || lote.estatus === 'rechazado' || lote.estatus === 'enviado')
      ? (fechasLote.find(f => f.etapas_proceso?.orden === ORDEN_ETAPA.ENVIO)?.fecha_actual
          ? parseISO(fechasLote.find(f => f.etapas_proceso?.orden === ORDEN_ETAPA.ENVIO).fecha_actual)
          : fechasLote.find(f => f.etapas_proceso?.orden === ORDEN_ETAPA.ACEPTADO)?.fecha_actual
            ? parseISO(fechasLote.find(f => f.etapas_proceso?.orden === ORDEN_ETAPA.ACEPTADO).fecha_actual)
            : new Date(HOY))
      : new Date(HOY)
    diasReales = differenceInDays(fin, inicio)
  }

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 2,
      p: 2, borderBottom: '1px solid #f1f5f9',
      '&:hover': { backgroundColor: '#fafafa' },
    }}>
      {/* ─── Info del lote ─── */}
      <Box sx={{ width: 220, flexShrink: 0 }}>
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 800, color: semaforo.color }}>
          {lote.lote}
        </Typography>
        <Typography sx={{ fontSize: '0.74rem', color: '#475569', mt: 0.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lote.denominacion_distintiva || lote.producto || 'Sin producto'}
        </Typography>
        <Typography sx={{ fontSize: '0.65rem', color: '#94a3b8', mt: 0.2 }}>
          Inicio: {fmtFecha(e1?.fecha_plan)}
        </Typography>
      </Box>

      {/* ─── Gantt bar ─── */}
      <Box sx={{ flex: 1, minWidth: 280 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
          <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8' }}>Día 0</Typography>
          <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8' }}>Lead Time {LEAD_TIME} días</Typography>
        </Box>

        <Box sx={{
          position: 'relative', height: 26,
          backgroundColor: '#f1f5f9', borderRadius: 99, overflow: 'hidden',
          border: `1px solid ${semaforo.color}30`,
        }}>
          {/* Barra de progreso */}
          <Box sx={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${Math.min(pct, 100)}%`,
            background: `linear-gradient(90deg, ${semaforo.color}, ${semaforo.color}dd)`,
            transition: 'width 0.6s ease',
          }} />

          {/* Marcadores de las 6 etapas */}
          {[1, 2, 3, 4, 5, 6].map((orden, i) => {
            const etapa = fechasLote.find(f => f.etapas_proceso?.orden === orden)
            const completada = !!etapa?.fecha_actual
            const pos = (i / 5) * 100   // 0%, 20%, 40%, 60%, 80%, 100%
            return (
              <Box key={orden} sx={{
                position: 'absolute', left: `${pos}%`, top: '50%',
                transform: 'translate(-50%, -50%)',
                width: 12, height: 12, borderRadius: '50%',
                backgroundColor: completada ? '#fff' : '#e2e8f0',
                border: `2px solid ${completada ? semaforo.color : '#cbd5e1'}`,
                boxShadow: completada ? `0 0 0 2px ${semaforo.color}30` : 'none',
                zIndex: 2,
              }} />
            )
          })}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.4 }}>
          <Typography sx={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>
            {completadas}/{total} etapas
          </Typography>
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: semaforo.color }}>
            {diasReales != null ? `${diasReales} días reales` : '—'}
          </Typography>
        </Box>
      </Box>

      {/* ─── Chip semáforo ─── */}
      <Box sx={{ width: 140, flexShrink: 0, display: 'flex', justifyContent: 'flex-end' }}>
        <Chip
          icon={<Icono size={12} />}
          label={semaforo.label}
          size="small"
          sx={{
            backgroundColor: semaforo.bg,
            color: semaforo.color,
            fontWeight: 800, fontSize: '0.68rem',
            border: `1px solid ${semaforo.color}40`,
            '& .MuiChip-icon': { color: semaforo.color },
          }} />
      </Box>
    </Box>
  )
}

// ─── Módulo principal ───
export default function PlanModule() {
  const [datos, setDatos] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    const { data: lotes } = await supabase.from('lotes').select('*').order('created_at', { ascending: false })
    const { data: fechas } = await supabase
      .from('fechas_proceso')
      .select('*, etapas_proceso(nombre, orden)')

    const fechasPorLote = {}
    ;(fechas || []).forEach(f => {
      if (!fechasPorLote[f.lote_id]) fechasPorLote[f.lote_id] = []
      fechasPorLote[f.lote_id].push(f)
    })

    setDatos((lotes || []).map(lote => ({ lote, fechasLote: fechasPorLote[lote.id] || [] })))
    setCargando(false)
  }

  // Stats globales del semáforo
  const stats = datos.reduce((acc, d) => {
    const s = evaluarSemaforo(d.lote, d.fechasLote)
    if (s.color === '#16a34a') acc.verde++
    else if (s.color === '#d97706') acc.naranja++
    else if (s.color === '#dc2626') acc.rojo++
    else acc.sinPlan++
    return acc
  }, { verde: 0, naranja: 0, rojo: 0, sinPlan: 0 })

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top bar */}
      <Box sx={{
        px: 4, py: 1.5, backgroundColor: '#fff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', gap: 2,
      }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.1 }}>
            Plan de Lotes · Gantt
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
            Lead time {LEAD_TIME} días desde fecha plan de etapa 1
          </Typography>
        </Box>
        <Button size="small" startIcon={<RefreshCw size={13} />} onClick={cargar}
          sx={{ textTransform: 'none', color: '#475569',
            '&:hover': { color: '#7C3AED', backgroundColor: '#F5F3FF' } }}>
          Actualizar
        </Button>
      </Box>

      <Box sx={{ p: 4 }}>
        {/* Stats del semáforo */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
          {[
            { label: 'En tiempo', value: stats.verde,    color: '#16a34a', Icon: CheckCircle2 },
            { label: 'Desfasados', value: stats.naranja, color: '#d97706', Icon: AlertTriangle },
            { label: 'Críticos',  value: stats.rojo,     color: '#dc2626', Icon: XCircle },
            { label: 'Sin plan',  value: stats.sinPlan,  color: '#94a3b8', Icon: Clock },
          ].map(s => (
            <Box key={s.label} sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              backgroundColor: '#fff', border: `1px solid ${s.color}30`,
              borderRadius: 2, px: 1.8, py: 0.9,
            }}>
              <s.Icon size={16} color={s.color} />
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>
                {s.value}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                {s.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Gantt */}
        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#7C3AED' }} />
          </Box>
        ) : datos.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CalendarDays size={48} color="#DDD6FE" />
            <Typography sx={{ color: '#94a3b8', mt: 2, fontSize: '0.9rem' }}>
              No hay lotes para mostrar en el Gantt
            </Typography>
          </Box>
        ) : (
          <Paper elevation={0} sx={{
            borderRadius: 3, overflow: 'hidden',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
          }}>
            <Box sx={{
              px: 2, py: 1.2, backgroundColor: '#f8fafc',
              borderBottom: '1.5px solid #e2e8f0',
              display: 'flex', alignItems: 'center', gap: 2,
            }}>
              <Typography sx={{ width: 220, fontSize: '0.66rem', fontWeight: 800, color: '#475569',
                textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Lote
              </Typography>
              <Typography sx={{ flex: 1, fontSize: '0.66rem', fontWeight: 800, color: '#475569',
                textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Progreso (cada punto = 1 etapa)
              </Typography>
              <Typography sx={{ width: 140, textAlign: 'right', fontSize: '0.66rem', fontWeight: 800, color: '#475569',
                textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Estado
              </Typography>
            </Box>
            {datos.map(({ lote, fechasLote }) => (
              <GanttRow key={lote.id} lote={lote} fechasLote={fechasLote} />
            ))}
          </Paper>
        )}
      </Box>
    </Box>
  )
}
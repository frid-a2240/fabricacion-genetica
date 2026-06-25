import { useState, useEffect } from 'react'
import { Box, Typography, CircularProgress, Button } from '@mui/material'
import { FlaskConical, Package, ShieldAlert, BadgeCheck, Ban, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'

import Whs1 from './Whs1.jsx'
import Whs2 from './Whs2.jsx'
import Whs3 from './Whs3.jsx'
import Whs4 from './Whs4.jsx'
import Whs5 from './Whs5.jsx'

const ALMACENES = [
  { id: 'whs1', code: 'WHS1', label: 'Granel',            Icon: FlaskConical, color: '#7C3AED', grad: ['#4c1d95','#7C3AED'], Component: Whs1 },
  { id: 'whs2', code: 'WHS2', label: 'Acondicionamiento', Icon: Package,      color: '#d97706', grad: ['#78350f','#d97706'], Component: Whs2 },
  { id: 'whs3', code: 'WHS3', label: 'Cuarentena',        Icon: ShieldAlert,  color: '#ca8a04', grad: ['#713f12','#ca8a04'], Component: Whs3 },
  { id: 'whs4', code: 'WHS4', label: 'Liberado',          Icon: BadgeCheck,   color: '#16a34a', grad: ['#14532d','#16a34a'], Component: Whs4 },
  { id: 'whs5', code: 'WHS5', label: 'Rechazado',         Icon: Ban,          color: '#dc2626', grad: ['#7f1d1d','#dc2626'], Component: Whs5 },
]

// ─────────── Lógica de asignación a almacén ───────────
// ─── Almacenes por los que el lote HA PASADO (histórico acumulado) ───
function getAlmacenesHistorial(lote, fechasLote) {
  const etapa = (orden) => fechasLote.find(f => f.etapas_proceso?.orden === orden)
  const e2 = etapa(2), e4 = etapa(4), e5 = etapa(5)

  const almacenes = []
  if (e2?.fecha_actual)             almacenes.push('whs1')
  if (e4?.fecha_actual)             almacenes.push('whs2')
  if (e5?.fecha_actual)             almacenes.push('whs3')
  if (lote.estatus === 'liberado')  almacenes.push('whs4')
  if (lote.estatus === 'rechazado') almacenes.push('whs5')
  return almacenes
}

// ─── Dónde está AHORA (último almacén = movimiento) ───
function getAlmacenActual(lote, fechasLote) {
  const etapa = (orden) => fechasLote.find(f => f.etapas_proceso?.orden === orden)
  const e2 = etapa(2), e4 = etapa(4), e5 = etapa(5)

  if (lote.estatus === 'liberado')  return 'whs4'
  if (lote.estatus === 'rechazado') return 'whs5'
  if (e5?.fecha_actual) return 'whs3'
  if (e4?.fecha_actual) return 'whs2'
  if (e2?.fecha_actual) return 'whs1'
  return null
}

export default function InventarioModule() {
  const [activo, setActivo]   = useState('whs1')
  const [buckets, setBuckets] = useState({ whs1: [], whs2: [], whs3: [], whs4: [], whs5: [] })
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargarInventario() }, [])

  async function cargarInventario() {
    setCargando(true)
    const { data: lotes } = await supabase.from('lotes').select('*').order('created_at', { ascending: false })
    const { data: fechas } = await supabase
      .from('fechas_proceso')
      .select('*, etapas_proceso(nombre, orden)')

    // Agrupa fechas por lote_id
    const fechasPorLote = {}
    ;(fechas || []).forEach(f => {
      if (!fechasPorLote[f.lote_id]) fechasPorLote[f.lote_id] = []
      fechasPorLote[f.lote_id].push(f)
    })

    // Bucket
    const b = { whs1: [], whs2: [], whs3: [], whs4: [], whs5: [] }
    ;(lotes || []).forEach(lote => {
  const fechasLote = fechasPorLote[lote.id] || []
  const historial = getAlmacenesHistorial(lote, fechasLote)
  const almacenActual = getAlmacenActual(lote, fechasLote)
  historial.forEach(u => b[u].push({ lote, fechasLote, almacenActual }))
})
    setBuckets(b)
    setCargando(false)
  }

  const almacenActivo = ALMACENES.find(a => a.id === activo)
  const Cuerpo = almacenActivo.Component

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
            Inventario por Almacén
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
            5 almacenes · Gestión de existencias
          </Typography>
        </Box>
        <Button size="small" startIcon={<RefreshCw size={13} />} onClick={cargarInventario}
          sx={{ textTransform: 'none', color: '#475569',
            '&:hover': { color: '#7C3AED', backgroundColor: '#F5F3FF' } }}>
          Actualizar
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{
        px: 4, pt: 2, backgroundColor: '#fff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex', gap: 0.5, overflowX: 'auto',
      }}>
        {ALMACENES.map(a => {
          const isActive = a.id === activo
          const count = buckets[a.id].length
          return (
            <Box key={a.id} onClick={() => setActivo(a.id)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1,
                px: 2, py: 1.2, borderRadius: '8px 8px 0 0',
                cursor: 'pointer', flexShrink: 0,
                borderBottom: isActive ? `3px solid ${a.color}` : '3px solid transparent',
                transition: 'all 0.15s ease',
                ...(isActive
                  ? { backgroundColor: `${a.color}10` }
                  : { '&:hover': { backgroundColor: '#fafafa' } }),
              }}>
              <Box sx={{
                width: 28, height: 28, borderRadius: 1.5,
                background: `linear-gradient(135deg,${a.grad[0]},${a.grad[1]})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <a.Icon size={14} color="#fff" />
              </Box>
              <Box>
                <Typography sx={{
                  fontSize: '0.55rem', fontWeight: 700,
                  color: isActive ? a.color : '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: 0.6, lineHeight: 1,
                }}>
                  {a.code}
                </Typography>
                <Typography sx={{
                  fontSize: '0.82rem', fontWeight: isActive ? 800 : 600,
                  color: isActive ? a.color : '#475569', lineHeight: 1.15,
                }}>
                  {a.label}
                </Typography>
              </Box>
              {/* Badge contador */}
              <Box sx={{
                ml: 0.5, minWidth: 22, height: 22, px: 0.8, borderRadius: 99,
                backgroundColor: isActive ? a.color : '#e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Typography sx={{
                  fontSize: '0.68rem', fontWeight: 800,
                  color: isActive ? '#fff' : '#64748b',
                }}>
                  {count}
                </Typography>
              </Box>
            </Box>
          )
        })}
      </Box>

      {/* Contenido */}
      <Box sx={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress sx={{ color: almacenActivo.color }} />
          </Box>
        ) : (
          <Cuerpo lotes={buckets[activo]} />
        )}
      </Box>
    </Box>
  )
}
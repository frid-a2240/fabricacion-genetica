import { useState, useEffect, useMemo } from 'react'
import {
  Box, Typography, CircularProgress, Button, TextField, InputAdornment,
  Select, MenuItem, FormControl, Paper, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material'
import {
  FlaskConical, Package, ShieldAlert, Ban, BadgeCheck, RefreshCw,
  Search, X, Hash, Pill, Warehouse, Filter, FileText, Layers
} from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { ORDEN_ETAPA } from '../../constants/etapas.js'

// ═══════════════════════════════════════════════════════════════
// Configuración de almacenes (solo para etiquetar lotes, ya no hay tabs)
// ═══════════════════════════════════════════════════════════════
const ALMACENES = [
  { id: 'whs1', code: 'WHS1', label: 'Granel',            Icon: FlaskConical, color: '#7C3AED' },
  { id: 'whs2', code: 'WHS2', label: 'Acondicionamiento', Icon: Package,      color: '#d97706' },
  { id: 'whs3', code: 'WHS3', label: 'Cuarentena',        Icon: ShieldAlert,  color: '#ca8a04' },
  { id: 'whs4', code: 'WHS4', label: 'Liberado',          Icon: BadgeCheck,   color: '#16a34a' },
  { id: 'whs5', code: 'WHS5', label: 'Rechazado',         Icon: Ban,          color: '#dc2626' },
]

// ═══════════════════════════════════════════════════════════════
// Lógica de ubicación de lotes
// ═══════════════════════════════════════════════════════════════
function fueraDeInventarioActivo(estatus) {
  return estatus === 'enviado'
}

function getAlmacenActual(lote, fechasLote) {
  if (fueraDeInventarioActivo(lote.estatus)) return null
  if (lote.estatus === 'liberado')  return 'whs4'
  if (lote.estatus === 'rechazado') return 'whs5'
  const etapa = (orden) => fechasLote.find(f => f.etapas_proceso?.orden === orden)
  const eCuarentena = etapa(ORDEN_ETAPA.CUARENTENA)
  const e4 = etapa(ORDEN_ETAPA.PROD_ACOND)
  const e2 = etapa(ORDEN_ETAPA.PROD_GRANEL)
  if (eCuarentena?.fecha_actual) return 'whs3'
  if (e4?.fecha_actual) return 'whs2'
  if (e2?.fecha_actual) return 'whs1'
  return null
}

function getCantidadEnAlmacen(item, almacenId) {
  const ordenPorAlmacen = {
    whs1: ORDEN_ETAPA.PROD_GRANEL,
    whs2: ORDEN_ETAPA.PROD_ACOND,
    whs3: ORDEN_ETAPA.CUARENTENA,
    whs4: ORDEN_ETAPA.ACEPTADO,
    whs5: ORDEN_ETAPA.ACEPTADO,
  }
  const orden = ordenPorAlmacen[almacenId]
  const etapa = item.fechasLote.find(f => f.etapas_proceso?.orden === orden)
  return etapa?.cantidad_actual ?? item.lote.cantidad ?? null
}

// ═══════════════════════════════════════════════════════════════
// Helpers de match
// ═══════════════════════════════════════════════════════════════
function productoMatchea(prod, qDenom) {
  if (!qDenom) return true
  const ql = qDenom.toLowerCase().trim()
  return (
    prod.den_distintiva?.toLowerCase().includes(ql) ||
    prod.den_generica?.toLowerCase().includes(ql)   ||
    prod.concentracion?.toLowerCase().includes(ql)  ||
    prod.reg_sanitario?.toLowerCase().includes(ql)  ||
    (prod.presentaciones || []).some(p => p.toLowerCase().includes(ql))
  )
}

function loteCoincideConProducto(lote, prod) {
  return (
    lote.den_generica?.toLowerCase() === prod.den_generica?.toLowerCase() &&
    lote.concentracion?.toLowerCase() === prod.concentracion?.toLowerCase()
  )
}

// ═══════════════════════════════════════════════════════════════
// Ficha de lote (estilo whiteboard — clave : valor)
// ═══════════════════════════════════════════════════════════════
function FichaLote({ item }) {
  const { lote, almacenActual } = item
  const almacen = ALMACENES.find(a => a.id === almacenActual)
  const cantidad = getCantidadEnAlmacen(item, almacenActual)

  const filas = [
    { label: 'Lote',                    value: lote.lote, mono: true, bold: true, color: '#7C3AED' },
    { label: 'Almacén',                 value: almacen ? `${almacen.code} — ${almacen.label}` : '—', color: almacen?.color, bold: true },
    { label: 'Cantidad',                value: cantidad != null ? cantidad.toLocaleString('en-US') : '—', mono: true, bold: true },
    { label: 'Denominación genérica',   value: lote.den_generica || '—' },
    { label: 'Concentración',           value: lote.concentracion || '—' },
    { label: 'Denominación distintiva', value: lote.denominacion_distintiva || '—' },
  ]

  return (
    <Paper elevation={0} sx={{
      borderRadius: 3, border: '1.5px solid #e2e8f0',
      p: 2.5, backgroundColor: '#fff',
      transition: 'all 0.2s ease',
      '&:hover': { boxShadow: '0 6px 18px rgba(0,0,0,0.08)', borderColor: '#C4B5FD' },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box sx={{
          width: 28, height: 28, borderRadius: 1.2,
          backgroundColor: '#F5F3FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Layers size={14} color="#7C3AED" />
        </Box>
        <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#7C3AED',
          textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Lote en inventario
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
        {filas.map(({ label, value, mono, bold, color }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5,
            borderBottom: '1px dashed #f1f5f9', pb: 0.6 }}>
            <Typography sx={{
              fontSize: '0.72rem', fontWeight: 700, color: '#64748b',
              minWidth: 175,
            }}>
              {label}:
            </Typography>
            <Typography sx={{
              fontSize: bold ? '1rem' : '0.88rem',
              fontFamily: mono ? 'monospace' : 'inherit',
              fontWeight: bold ? 800 : 600,
              color: color || '#1e293b',
              flex: 1,
            }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}

// ═══════════════════════════════════════════════════════════════
// Ficha técnica del producto (catálogo) + lotes asociados si los hay
// ═══════════════════════════════════════════════════════════════
function FichaProducto({ producto, lotesRelacionados }) {
  const filas = [
    { label: 'Denominación distintiva', value: producto.den_distintiva || '—', bold: true, color: '#4C1D95' },
    { label: 'Denominación genérica',   value: producto.den_generica   || '—' },
    { label: 'Concentración',           value: producto.concentracion  || '—' },
    { label: 'Forma farmacéutica',      value: producto.forma_farma    || '—' },
    { label: 'Reg. sanitario',          value: producto.reg_sanitario  || '—', mono: true },
    { label: 'Fracción',                value: producto.fraccion       || '—', mono: true },
    { label: 'Vida útil',               value: producto.vida_util      || '—' },
  ]

  return (
    <Paper elevation={0} sx={{
      borderRadius: 3, border: '1.5px solid #DDD6FE',
      p: 2.5, backgroundColor: '#fff',
      transition: 'all 0.2s ease',
      '&:hover': { boxShadow: '0 6px 18px rgba(124,58,237,0.12)', borderColor: '#7C3AED' },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box sx={{
          width: 28, height: 28, borderRadius: 1.2,
          background: 'linear-gradient(135deg,#4C1D95,#7C3AED)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Pill size={14} color="#fff" />
        </Box>
        <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: '#7C3AED',
          textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Ficha técnica del producto
        </Typography>
        {lotesRelacionados.length === 0 && (
          <Chip size="small" label="Sin lotes activos"
            sx={{ ml: 'auto', backgroundColor: '#fef3c7', color: '#92400e',
              fontWeight: 700, fontSize: '0.62rem', height: 20 }} />
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8 }}>
        {filas.map(({ label, value, mono, bold, color }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5,
            borderBottom: '1px dashed #f1f5f9', pb: 0.6 }}>
            <Typography sx={{
              fontSize: '0.72rem', fontWeight: 700, color: '#64748b',
              minWidth: 175,
            }}>
              {label}:
            </Typography>
            <Typography sx={{
              fontSize: bold ? '1rem' : '0.88rem',
              fontFamily: mono ? 'monospace' : 'inherit',
              fontWeight: bold ? 800 : 600,
              color: color || '#1e293b',
              flex: 1,
            }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>

      {producto.indicacion && (
        <Box sx={{ mt: 1.5, backgroundColor: '#F5F3FF', borderRadius: 2, p: 1.2,
          border: '1px solid #DDD6FE', display: 'flex', gap: 1 }}>
          <FileText size={13} color="#7C3AED" style={{ marginTop: 2, flexShrink: 0 }} />
          <Box>
            <Typography sx={{ fontSize: '0.58rem', color: '#7C3AED', fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Indicación
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#4C1D95', lineHeight: 1.4 }}>
              {producto.indicacion}
            </Typography>
          </Box>
        </Box>
      )}

      {producto.presentaciones?.length > 0 && (
        <Box sx={{ mt: 1.5 }}>
          <Typography sx={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.5 }}>
            Presentaciones
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {producto.presentaciones.map(p => (
              <Chip key={p} size="small" label={p}
                sx={{ backgroundColor: '#EDE9FE', color: '#4C1D95', fontWeight: 700,
                  fontSize: '0.7rem', height: 22 }} />
            ))}
          </Box>
        </Box>
      )}

      {lotesRelacionados.length > 0 && (
        <Box sx={{ mt: 1.5, pt: 1.2, borderTop: '1px dashed #e2e8f0' }}>
          <Typography sx={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.6 }}>
            Lotes en inventario ({lotesRelacionados.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {lotesRelacionados.map(({ lote, almacenActual }) => {
              const almacen = ALMACENES.find(a => a.id === almacenActual)
              return (
                <Chip key={lote.id} size="small"
                  label={`${lote.lote} · ${almacen?.code || '—'}`}
                  sx={{
                    backgroundColor: almacen ? `${almacen.color}15` : '#f1f5f9',
                    color: almacen?.color || '#94a3b8',
                    fontWeight: 700, fontSize: '0.7rem', height: 22,
                    fontFamily: 'monospace',
                    border: `1px solid ${almacen ? almacen.color + '40' : '#e2e8f0'}`,
                  }} />
              )
            })}
          </Box>
        </Box>
      )}
    </Paper>
  )
}

// ═══════════════════════════════════════════════════════════════
// Sumatoria WHS1 (Granel) agrupada por medicamento + concentración
// ═══════════════════════════════════════════════════════════════
function ResumenWhs1({ grupos }) {
  const totalGeneral = grupos.reduce((acc, g) => acc + g.cantidad, 0)

  return (
    <Paper elevation={0} sx={{
      borderRadius: 3, mb: 3, overflow: 'hidden',
      border: '1.5px solid #DDD6FE',
      boxShadow: '0 4px 16px rgba(124,58,237,0.08)',
    }}>
      <Box sx={{
        px: 2.5, py: 1.5,
        background: 'linear-gradient(135deg,#4C1D95,#7C3AED)',
        display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap',
      }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 1.5,
          backgroundColor: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <FlaskConical size={18} color="#fff" />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.8)',
            textTransform: 'uppercase', letterSpacing: 0.8 }}>
             WHS1 — Granel
          </Typography>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
            Cantidad total 
          </Typography>
        </Box>
        <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
          {totalGeneral.toLocaleString('en-US')} u. en total
        </Typography>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Denominación genérica', 'Concentración', 'Lotes', 'Cantidad'].map(h => (
                <TableCell key={h} sx={{
                  backgroundColor: '#F5F3FF', fontWeight: 800, fontSize: '0.66rem',
                  color: '#4C1D95', textTransform: 'uppercase', letterSpacing: 0.5,
                  py: 1.2, borderBottom: '1.5px solid #DDD6FE',
                }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {grupos.map((g, i) => (
              <TableRow key={g.key} sx={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fdfdfd' }}>
                <TableCell sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                  {g.denGenerica}
                </TableCell>
                <TableCell sx={{ fontSize: '0.82rem', color: '#475569' }}>
                  {g.concentracion}
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#64748b' }}>
                  {g.lotes}
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.88rem', color: '#7C3AED' }}>
                  {g.cantidad.toLocaleString('en-US')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

// ═══════════════════════════════════════════════════════════════
// Componente principal — solo búsqueda
// ═══════════════════════════════════════════════════════════════
export default function InventarioModule() {
  const [lotesData, setLotesData]   = useState([])
  const [productos, setProductos]   = useState([])
  const [cargando, setCargando]     = useState(true)

  const [fAlmacen, setFAlmacen] = useState('')
  const [fLote, setFLote]       = useState('')
  const [fDenom, setFDenom]     = useState('')

  useEffect(() => { cargarTodo() }, [])

  async function cargarTodo() {
    setCargando(true)
    const [{ data: lotes }, { data: fechas }, { data: prods }] = await Promise.all([
      supabase.from('lotes').select('*').order('created_at', { ascending: false }),
      supabase.from('fechas_proceso').select('*, etapas_proceso(nombre, orden)'),
      supabase.from('productos').select('*').order('den_distintiva'),
    ])

    const fechasPorLote = {}
    ;(fechas || []).forEach(f => {
      if (!fechasPorLote[f.lote_id]) fechasPorLote[f.lote_id] = []
      fechasPorLote[f.lote_id].push(f)
    })

    const items = (lotes || []).map(lote => {
      const fechasLote = fechasPorLote[lote.id] || []
      const almacenActual = getAlmacenActual(lote, fechasLote)
      return { lote, fechasLote, almacenActual }
    }).filter(it => it.almacenActual !== null)

    setLotesData(items)
    setProductos(prods || [])
    setCargando(false)
  }

  const hayFiltros = !!fAlmacen || fLote.trim() !== '' || fDenom.trim() !== ''

  // Productos del catálogo que matchean por denominación
  const productosResultado = useMemo(() => {
    if (!hayFiltros) return []
    if (!fDenom.trim()) return [] // si no buscas denominación, no aplica al catálogo
    return productos.filter(p => productoMatchea(p, fDenom)).map(p => ({
      producto: p,
      lotesRelacionados: lotesData.filter(it => {
        if (!loteCoincideConProducto(it.lote, p)) return false
        if (fAlmacen && it.almacenActual !== fAlmacen) return false
        if (fLote.trim() && !it.lote.lote?.toLowerCase().includes(fLote.trim().toLowerCase())) return false
        return true
      }),
    }))
  }, [hayFiltros, fDenom, fAlmacen, fLote, productos, lotesData])

  // Lotes huérfanos (que matchean pero no están en una ficha de producto del catálogo)
  const lotesResultado = useMemo(() => {
    if (!hayFiltros) return []
    const ql = fLote.trim().toLowerCase()
    const qd = fDenom.trim().toLowerCase()

    const keysProductos = new Set(
      productosResultado.map(({ producto }) =>
        `${producto.den_generica}|${producto.concentracion}`.toLowerCase()
      )
    )

    return lotesData.filter(item => {
      const { lote, almacenActual } = item
      if (fAlmacen && almacenActual !== fAlmacen) return false
      if (ql && !lote.lote?.toLowerCase().includes(ql)) return false
      if (qd) {
        const enGen  = lote.den_generica?.toLowerCase().includes(qd)
        const enDist = lote.denominacion_distintiva?.toLowerCase().includes(qd)
        const enProd = lote.producto?.toLowerCase().includes(qd)
        if (!enGen && !enDist && !enProd) return false
      }
      const key = `${lote.den_generica}|${lote.concentracion}`.toLowerCase()
      if (keysProductos.has(key)) return false
      return true
    })
  }, [hayFiltros, fAlmacen, fLote, fDenom, lotesData, productosResultado])

  // Sumatoria de WHS1 (Granel), agrupada por medicamento + concentración,
  // respetando los demás filtros activos (lote / denominación)
  const resumenWhs1 = useMemo(() => {
    if (fAlmacen !== 'whs1') return []
    const ql = fLote.trim().toLowerCase()
    const qd = fDenom.trim().toLowerCase()

    const grupos = {}
    lotesData.forEach(item => {
      const { lote, almacenActual } = item
      if (almacenActual !== 'whs1') return
      if (ql && !lote.lote?.toLowerCase().includes(ql)) return
      if (qd) {
        const enGen  = lote.den_generica?.toLowerCase().includes(qd)
        const enDist = lote.denominacion_distintiva?.toLowerCase().includes(qd)
        const enProd = lote.producto?.toLowerCase().includes(qd)
        if (!enGen && !enDist && !enProd) return
      }
      const gen  = lote.den_generica || lote.producto || 'Sin clasificar'
      const conc = lote.concentracion || '—'
      const key  = `${gen}|${conc}`.toLowerCase()
      if (!grupos[key]) {
        grupos[key] = { key, denGenerica: gen, concentracion: conc, cantidad: 0, lotes: 0 }
      }
      grupos[key].cantidad += getCantidadEnAlmacen(item, 'whs1') || 0
      grupos[key].lotes += 1
    })

    return Object.values(grupos).sort((a, b) => a.denGenerica.localeCompare(b.denGenerica))
  }, [fAlmacen, fLote, fDenom, lotesData])

  function limpiarFiltros() {
    setFAlmacen(''); setFLote(''); setFDenom('')
  }

  const inputSx = {
    fontSize: '0.85rem', backgroundColor: '#fff', borderRadius: 2,
    '& fieldset': { borderColor: '#e2e8f0' },
    '&:hover fieldset': { borderColor: '#C4B5FD' },
    '&.Mui-focused fieldset': { borderColor: '#7C3AED' },
  }

  const totalResultados = productosResultado.length + lotesResultado.length

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ═══ TÍTULO ═══ */}
      <Box sx={{
        px: 4, py: 1.5, backgroundColor: '#fff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', gap: 2,
      }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 2,
          background: 'linear-gradient(135deg,#4C1D95,#7C3AED)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Warehouse size={18} color="#fff" />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>
            Consulta de Inventarios <span style={{ color: '#7C3AED' }}>(STOCK)</span>
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
            {productos.length} productos en catálogo · {lotesData.length} lotes en inventario activo
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Button size="small" startIcon={<RefreshCw size={13} />} onClick={cargarTodo}
          sx={{ textTransform: 'none', color: '#475569',
            '&:hover': { color: '#7C3AED', backgroundColor: '#F5F3FF' } }}>
          Actualizar
        </Button>
      </Box>

      {/* ═══ FILTROS DE CONSULTA ═══ */}
      <Box sx={{
        px: 4, py: 2.5,
        backgroundColor: '#F8FAFC',
        borderBottom: '1.5px solid #e2e8f0',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Filter size={14} color="#7C3AED" />
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#7C3AED',
            textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Buscar
          </Typography>
        </Box>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr) auto' },
          gap: 1.5, alignItems: 'end',
        }}>
          <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', mb: 0.5 }}>
              Almacén
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={fAlmacen}
                onChange={e => setFAlmacen(e.target.value)}
                displayEmpty
                sx={inputSx}
                renderValue={(v) => {
                  if (!v) return <span style={{ color: '#94a3b8' }}>Todos los almacenes</span>
                  const a = ALMACENES.find(x => x.id === v)
                  return a ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <a.Icon size={13} color={a.color} />
                      <span>{a.code} — {a.label}</span>
                    </Box>
                  ) : v
                }}
              >
                <MenuItem value=""><em>Todos los almacenes</em></MenuItem>
                {ALMACENES.map(a => (
                  <MenuItem key={a.id} value={a.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <a.Icon size={13} color={a.color} />
                      <span>{a.code} — {a.label}</span>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', mb: 0.5 }}>
              Lote
            </Typography>
            <TextField
              value={fLote}
              onChange={e => setFLote(e.target.value)}
              placeholder="ej. 123456"
              size="small" fullWidth
              slotProps={{ input: {
                startAdornment: <InputAdornment position="start"><Hash size={14} color="#94a3b8" /></InputAdornment>,
                sx: inputSx,
              } }}
            />
          </Box>

          <Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', mb: 0.5 }}>
              Denominación
            </Typography>
            <TextField
              value={fDenom}
              onChange={e => setFDenom(e.target.value)}
              placeholder="ej. Ibuprofeno o Adopren"
              size="small" fullWidth
              slotProps={{ input: {
                startAdornment: <InputAdornment position="start"><Pill size={14} color="#94a3b8" /></InputAdornment>,
                sx: inputSx,
              } }}
            />
          </Box>

          <Button
            onClick={limpiarFiltros}
            disabled={!hayFiltros}
            startIcon={<X size={13} />}
            sx={{
              height: 40, textTransform: 'none', color: '#475569',
              border: '1px solid #e2e8f0', backgroundColor: '#fff', borderRadius: 2, px: 2,
              '&:hover': { borderColor: '#7C3AED', color: '#7C3AED', backgroundColor: '#F5F3FF' },
              '&.Mui-disabled': { backgroundColor: '#f8fafc', color: '#cbd5e1' },
            }}
          >
            Limpiar
          </Button>
        </Box>
      </Box>

      {/* ═══ ÁREA DE RESULTADOS ═══ */}
      <Box sx={{ flex: 1, backgroundColor: '#F8FAFC', px: 4, py: 3 }}>
        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress sx={{ color: '#7C3AED' }} />
          </Box>
        ) : !hayFiltros ? (
          <Paper elevation={0} sx={{
            borderRadius: 3, border: '1.5px dashed #DDD6FE',
            p: 6, backgroundColor: '#fff',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
          }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: 2,
              background: 'linear-gradient(135deg,#EDE9FE,#DDD6FE)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Search size={28} color="#7C3AED" />
            </Box>
            <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#4C1D95' }}>
              Consulta de inventario
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', maxWidth: 480 }}>
              Filtra por almacén, número de lote o denominación para ver la ficha técnica del producto
              y los lotes que tienes en existencia.
            </Typography>
          </Paper>
        ) : totalResultados === 0 ? (
          <>
            {fAlmacen === 'whs1' && resumenWhs1.length > 0 && <ResumenWhs1 grupos={resumenWhs1} />}
            <Paper elevation={0} sx={{
              borderRadius: 3, border: '1.5px dashed #e2e8f0',
              p: 5, backgroundColor: '#fff', textAlign: 'center',
            }}>
              <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#475569', mb: 0.5 }}>
                Sin resultados
              </Typography>
              <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Ningún producto del catálogo ni lote en inventario coincide con los filtros.
              </Typography>
            </Paper>
          </>
        ) : (
          <Box>
            {fAlmacen === 'whs1' && resumenWhs1.length > 0 && <ResumenWhs1 grupos={resumenWhs1} />}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Search size={14} color="#7C3AED" />
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#7C3AED',
                textTransform: 'uppercase', letterSpacing: 0.6 }}>
                {totalResultados} {totalResultados === 1 ? 'resultado' : 'resultados'}
              </Typography>
            </Box>

            {productosResultado.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#7C3AED',
                  textTransform: 'uppercase', letterSpacing: 0.6, mb: 1.2 }}>
                  Productos del catálogo ({productosResultado.length})
                </Typography>
                <Box sx={{ display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 2 }}>
                  {productosResultado.map(({ producto, lotesRelacionados }) => (
                    <FichaProducto key={producto.id} producto={producto} lotesRelacionados={lotesRelacionados} />
                  ))}
                </Box>
              </Box>
            )}

            {lotesResultado.length > 0 && (
              <Box>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#d97706',
                  textTransform: 'uppercase', letterSpacing: 0.6, mb: 1.2 }}>
                  {productosResultado.length > 0
                    ? `Lotes sin producto en catálogo (${lotesResultado.length})`
                    : `Lotes encontrados (${lotesResultado.length})`}
                </Typography>
                <Box sx={{ display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))', gap: 2 }}>
                  {lotesResultado.map(item => (
                    <FichaLote key={item.lote.id} item={item} />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}



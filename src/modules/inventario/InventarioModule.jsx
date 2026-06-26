import { useState, useEffect, useMemo } from 'react'
import {
  Box, Typography, CircularProgress, Button, TextField, InputAdornment,
  Chip, Collapse, IconButton, ToggleButtonGroup, ToggleButton
} from '@mui/material'
import {
  FlaskConical, Package, ShieldAlert, Ban, BadgeCheck, RefreshCw, Search, X,
  Pill, FileText, ChevronDown, ChevronUp, Layers, Boxes
} from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

import Whs1 from './Whs1.jsx'
import Whs2 from './Whs2.jsx'
import Whs3 from './Whs3.jsx'
import Whs4 from './Whs4.jsx'
import Whs5 from './Whs5.jsx'
import { ORDEN_ETAPA } from '../../constants/etapas.js'

const ALMACENES = [
  { id: 'whs1', code: 'WHS1', label: 'Granel',            Icon: FlaskConical, color: '#7C3AED', grad: ['#4c1d95','#7C3AED'], Component: Whs1 },
  { id: 'whs2', code: 'WHS2', label: 'Acondicionamiento', Icon: Package,      color: '#d97706', grad: ['#78350f','#d97706'], Component: Whs2 },
  { id: 'whs3', code: 'WHS3', label: 'Cuarentena',        Icon: ShieldAlert,  color: '#ca8a04', grad: ['#713f12','#ca8a04'], Component: Whs3 },
  { id: 'whs4', code: 'WHS4', label: 'Liberado',          Icon: BadgeCheck,   color: '#16a34a', grad: ['#14532d','#16a34a'], Component: Whs4 },  
  { id: 'whs5', code: 'WHS5', label: 'Rechazado',         Icon: Ban,          color: '#dc2626', grad: ['#7f1d1d','#dc2626'], Component: Whs5 },
]

function fueraDeInventarioActivo(estatus) {
  return estatus === 'enviado'
}

function getAlmacenesHistorial(lote, fechasLote) {
  const etapa = (orden) => fechasLote.find(f => f.etapas_proceso?.orden === orden)
  const e2 = etapa(ORDEN_ETAPA.PROD_GRANEL)
  const e4 = etapa(ORDEN_ETAPA.PROD_ACOND)
  const eCuarentena = etapa(ORDEN_ETAPA.CUARENTENA)
  const almacenes = []
  if (e2?.fecha_actual) almacenes.push('whs1')
  if (e4?.fecha_actual) almacenes.push('whs2')
  if (eCuarentena?.fecha_actual && !fueraDeInventarioActivo(lote.estatus)) almacenes.push('whs3')
  if (lote.estatus === 'liberado')  almacenes.push('whs4')   // ← añadir
  if (lote.estatus === 'rechazado') almacenes.push('whs5')
  return almacenes
}

function getAlmacenActual(lote, fechasLote) {
  if (fueraDeInventarioActivo(lote.estatus)) return null
  if (lote.estatus === 'liberado')  return 'whs4'   // ← añadir esta línea
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

function productoMatchea(prod, q) {
  if (!q) return false
  const ql = q.toLowerCase().trim()
  return (
    prod.den_distintiva?.toLowerCase().includes(ql) ||
    prod.den_generica?.toLowerCase().includes(ql)   ||
    prod.concentracion?.toLowerCase().includes(ql)  ||
    prod.reg_sanitario?.toLowerCase().includes(ql)  ||
    (prod.presentaciones || []).some(p => p.toLowerCase().includes(ql))
  )
}

function loteMatchea(item, q) {
  if (!q) return false
  const ql = q.toLowerCase().trim()
  const { lote, fechasLote } = item
  if (lote.lote?.toLowerCase().includes(ql)) return true
  if (lote.producto?.toLowerCase().includes(ql)) return true
  if (lote.den_generica?.toLowerCase().includes(ql)) return true
  if (lote.denominacion_distintiva?.toLowerCase().includes(ql)) return true
  if (lote.concentracion?.toLowerCase().includes(ql)) return true
  return (fechasLote || []).some(f => {
    const fechas = [f.fecha_plan, f.fecha_actual].filter(Boolean)
    return fechas.some(fecha => {
      if (fecha.toLowerCase().includes(ql)) return true
      try {
        const formateada = format(parseISO(fecha), 'dd/MMM/yy', { locale: es }).toLowerCase()
        return formateada.includes(ql)
      } catch { return false }
    })
  })
}

// ═══════════════════════════════════════════════════════════════
// Card de producto COMPACTA y expandible
// ═══════════════════════════════════════════════════════════════
function FichaProductoCompacta({ producto, lotesRelacionados }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <Box sx={{
      backgroundColor: '#fff', borderRadius: 2,
      border: '1.5px solid #DDD6FE', overflow: 'hidden',
      transition: 'all 0.2s ease',
      '&:hover': { borderColor: '#7C3AED', boxShadow: '0 4px 12px rgba(124,58,237,0.1)' },
    }}>
      {/* Header clickeable — compacto */}
      <Box onClick={() => setAbierto(!abierto)} sx={{
        background: abierto ? 'linear-gradient(135deg,#4C1D95,#7C3AED)' : '#F5F3FF',
        px: 1.5, py: 1, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 1,
        transition: 'background 0.2s',
      }}>
        <Pill size={14} color={abierto ? '#fff' : '#7C3AED'} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{
            fontSize: '0.85rem', fontWeight: 800,
            color: abierto ? '#fff' : '#4C1D95', lineHeight: 1.2,
          }}>
            {producto.den_distintiva} · {producto.concentracion}
          </Typography>
          <Typography sx={{
            fontSize: '0.68rem', fontWeight: 600,
            color: abierto ? 'rgba(255,255,255,0.8)' : '#7C3AED', lineHeight: 1.1,
          }}>
            {producto.den_generica} · {producto.forma_farma}
          </Typography>
        </Box>
        {lotesRelacionados.length > 0 && (
          <Chip size="small" label={`${lotesRelacionados.length} lote${lotesRelacionados.length > 1 ? 's' : ''}`}
            sx={{ backgroundColor: abierto ? 'rgba(255,255,255,0.2)' : '#fff',
                  color: abierto ? '#fff' : '#7C3AED',
                  fontWeight: 700, fontSize: '0.62rem', height: 20 }} />
        )}
        <IconButton size="small" sx={{ color: abierto ? '#fff' : '#7C3AED', p: 0.3 }}>
          {abierto ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </IconButton>
      </Box>

      {/* Body expandible */}
      <Collapse in={abierto}>
        <Box sx={{ p: 1.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 1.2 }}>
            {[
              ['Reg. Sanitario', producto.reg_sanitario],
              ['Fracción',       producto.fraccion],
              ['Vida Útil',      producto.vida_util],
            ].filter(([, v]) => v).map(([k, v]) => (
              <Box key={k}>
                <Typography sx={{ fontSize: '0.55rem', color: '#94a3b8', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {k}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: '#1e293b', fontWeight: 600 }}>
                  {v}
                </Typography>
              </Box>
            ))}
          </Box>

          {producto.indicacion && (
            <Box sx={{ mb: 1.2, backgroundColor: '#F5F3FF', borderRadius: 1.5, p: 1,
              border: '1px solid #DDD6FE', display: 'flex', gap: 0.8 }}>
              <FileText size={11} color="#7C3AED" style={{ marginTop: 2, flexShrink: 0 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.55rem', color: '#7C3AED', fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  Indicación
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#4C1D95', lineHeight: 1.3 }}>
                  {producto.indicacion}
                </Typography>
              </Box>
            </Box>
          )}

          {producto.presentaciones?.length > 0 && (
            <Box>
              <Typography sx={{ fontSize: '0.55rem', color: '#94a3b8', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 0.4, mb: 0.4 }}>
                Presentaciones
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.4, flexWrap: 'wrap' }}>
                {producto.presentaciones.map(p => (
                  <Chip key={p} size="small" label={p}
                    sx={{ backgroundColor: '#EDE9FE', color: '#4C1D95', fontWeight: 600,
                          fontSize: '0.65rem', height: 20 }} />
                ))}
              </Box>
            </Box>
          )}

          {lotesRelacionados.length > 0 && (
            <Box sx={{ mt: 1.2, pt: 1, borderTop: '1px dashed #e2e8f0' }}>
              <Typography sx={{ fontSize: '0.55rem', color: '#94a3b8', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 0.4, mb: 0.4 }}>
                Lotes asociados
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.4, flexWrap: 'wrap' }}>
                {lotesRelacionados.map(({ lote, almacenActual }) => {
                  const almacen = ALMACENES.find(a => a.id === almacenActual)
                  return (
                    <Chip key={lote.id} size="small"
                      label={`${lote.lote} → ${almacen?.code || '—'}`}
                      sx={{ backgroundColor: almacen ? `${almacen.color}15` : '#f1f5f9',
                            color: almacen?.color || '#94a3b8',
                            fontWeight: 700, fontSize: '0.62rem', height: 20,
                            fontFamily: 'monospace' }} />
                  )
                })}
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  )
}

// ═══════════════════════════════════════════════════════════════
// Componente principal
// ═══════════════════════════════════════════════════════════════
export default function InventarioModule() {
  const [activo, setActivo]   = useState('whs1')
  const [buckets, setBuckets] = useState({ whs1: [], whs2: [], whs3: [], whs4: [], whs5: [] })
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [query, setQuery] = useState('')
  const [vistaResultado, setVistaResultado] = useState('catalogo') // 'catalogo' | 'lotes'

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

    const b = { whs1: [], whs2: [], whs3: [], whs4: [], whs5: [] }
    ;(lotes || []).forEach(lote => {
      const fechasLote = fechasPorLote[lote.id] || []
      const historial = getAlmacenesHistorial(lote, fechasLote)
      const almacenActual = getAlmacenActual(lote, fechasLote)
      historial.forEach(u => b[u].push({ lote, fechasLote, almacenActual }))
    })

    setBuckets(b)
    setProductos(prods || [])
    setCargando(false)
  }

  const resultados = useMemo(() => {
    if (!query.trim()) return { productos: [], lotesHuerfanos: [] }
    const prodsMatch = productos.filter(p => productoMatchea(p, query))

    const lotesUnicos = new Map()
    Object.values(buckets).flat().forEach(item => {
      if (!lotesUnicos.has(item.lote.id)) lotesUnicos.set(item.lote.id, item)
    })
    const todosLotes = [...lotesUnicos.values()]

    const productosConLotes = prodsMatch.map(prod => ({
      producto: prod,
      lotesRelacionados: todosLotes.filter(({ lote }) =>
        lote.den_generica?.toLowerCase() === prod.den_generica?.toLowerCase() &&
        lote.concentracion?.toLowerCase() === prod.concentracion?.toLowerCase()
      ),
    }))

    const idsProdMatch = new Set(prodsMatch.map(p => `${p.den_generica}|${p.concentracion}`.toLowerCase()))
    const lotesHuerfanos = todosLotes.filter(item => {
      if (!loteMatchea(item, query)) return false
      const key = `${item.lote.den_generica}|${item.lote.concentracion}`.toLowerCase()
      return !idsProdMatch.has(key)
    })

    return { productos: productosConLotes, lotesHuerfanos }
  }, [query, productos, buckets])

  const bucketsFiltrados = useMemo(() => {
    if (!query.trim()) return buckets
    const r = {}
    Object.entries(buckets).forEach(([k, v]) => { r[k] = v.filter(it => loteMatchea(it, query)) })
    return r
  }, [query, buckets])

  const almacenActivo = ALMACENES.find(a => a.id === activo)
  const Cuerpo = almacenActivo.Component
  const hayBusqueda = query.trim().length > 0

  // Conteos para los tabs internos
  const totalCatalogo = resultados.productos.length
  const totalLotes    = Object.values(bucketsFiltrados).flat()
    .filter((it, i, arr) => arr.findIndex(x => x.lote.id === it.lote.id) === i)
    .filter(it => it.almacenActual !== null).length

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top bar */}
      <Box sx={{
        px: 4, py: 1.5, backgroundColor: '#fff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', gap: 2,
      }}>
        <Box>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.1 }}>
            Inventario por Almacén
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
            5 almacenes · {productos.length} productos en catálogo
          </Typography>
        </Box>

        <Box sx={{ flex: 1, maxWidth: 480, ml: 'auto', mr: 1 }}>
          <TextField
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar producto, lote, presentación o fecha..."
            size="small" fullWidth
            slotProps={{ input: {
              startAdornment: <InputAdornment position="start"><Search size={16} color="#94a3b8" /></InputAdornment>,
              endAdornment: query && (
                <InputAdornment position="end">
                  <Box onClick={() => setQuery('')} sx={{ cursor: 'pointer', display: 'flex' }}>
                    <X size={14} color="#94a3b8" />
                  </Box>
                </InputAdornment>
              ),
              sx: { fontSize: '0.82rem', backgroundColor: '#fafafa', borderRadius: 2 }
            } }}
          />
        </Box>

        <Button size="small" startIcon={<RefreshCw size={13} />} onClick={cargarTodo}
          sx={{ textTransform: 'none', color: '#475569',
            '&:hover': { color: '#7C3AED', backgroundColor: '#F5F3FF' } }}>
          Actualizar
        </Button>
      </Box>

      {/* ═══ Panel de búsqueda con altura limitada ═══ */}
      {hayBusqueda && (
        <Box sx={{
          backgroundColor: '#F8FAFC',
          borderBottom: '2px solid #DDD6FE',
          maxHeight: '50vh',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Tabs internos: Catálogo / Lotes */}
          <Box sx={{
            px: 4, pt: 1.5, pb: 1,
            display: 'flex', alignItems: 'center', gap: 2,
            backgroundColor: '#fff',
            borderBottom: '1px solid #e2e8f0',
          }}>
            <Search size={14} color="#7C3AED" />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#7C3AED',
              textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Resultados para "{query}"
            </Typography>
            <Box sx={{ flex: 1 }} />
            <ToggleButtonGroup
              value={vistaResultado}
              exclusive
              onChange={(_, v) => v && setVistaResultado(v)}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  textTransform: 'none', fontSize: '0.72rem', fontWeight: 700,
                  px: 1.5, py: 0.3, gap: 0.6, color: '#64748b',
                  borderColor: '#e2e8f0',
                },
                '& .Mui-selected': {
                  backgroundColor: '#7C3AED !important',
                  color: '#fff !important',
                  borderColor: '#7C3AED !important',
                },
              }}
            >
              <ToggleButton value="catalogo">
                <Layers size={12} />
                Catálogo ({totalCatalogo})
              </ToggleButton>
              <ToggleButton value="lotes">
                <Boxes size={12} />
                Lotes ({totalLotes})
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Contenido scrolleable de resultados */}
          <Box sx={{ flex: 1, overflowY: 'auto', px: 4, py: 1.5 }}>
            {vistaResultado === 'catalogo' ? (
              totalCatalogo === 0 ? (
                <Box sx={{ backgroundColor: '#fff', borderRadius: 2, border: '1px dashed #e2e8f0', p: 3, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    Ningún producto en el catálogo coincide con "{query}".
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 1.2 }}>
                  {resultados.productos.map(({ producto, lotesRelacionados }) => (
                    <FichaProductoCompacta key={producto.id} producto={producto} lotesRelacionados={lotesRelacionados} />
                  ))}
                </Box>
              )
            ) : (
              totalLotes === 0 && resultados.lotesHuerfanos.length === 0 ? (
                <Box sx={{ backgroundColor: '#fff', borderRadius: 2, border: '1px dashed #e2e8f0', p: 3, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    Sin lotes en inventario que coincidan con "{query}".
                  </Typography>
                </Box>
              ) : (
                <Box>
                  {Object.values(bucketsFiltrados).flat()
                    .filter((it, i, arr) => arr.findIndex(x => x.lote.id === it.lote.id) === i)
                    .filter(it => it.almacenActual !== null)
                    .map(({ lote, almacenActual }) => {
                      const almacen = ALMACENES.find(a => a.id === almacenActual)
                      return (
                        <Box key={lote.id} sx={{ backgroundColor: '#fff', borderRadius: 2,
                          border: '1.5px solid #e2e8f0', p: 1.5, mb: 1,
                          display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#7C3AED', fontSize: '0.9rem' }}>
                            {lote.lote}
                          </Typography>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 600 }}>
                              {lote.denominacion_distintiva || lote.producto}
                            </Typography>
                            <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>
                              {lote.den_generica} {lote.concentracion} · {lote.presentacion}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 700, color: '#475569' }}>
                            {lote.cantidad?.toLocaleString('en-US')} u.
                          </Typography>
                          {almacen && (
                            <Chip size="small" label={`${almacen.code} · ${almacen.label}`}
                              sx={{ backgroundColor: `${almacen.color}15`,
                                    color: almacen.color, fontWeight: 700, fontSize: '0.65rem' }} />
                          )}
                        </Box>
                      )
                    })}
                  {resultados.lotesHuerfanos.length > 0 && (
                    <>
                      <Typography sx={{ mt: 2, mb: 0.8, fontSize: '0.62rem', fontWeight: 700, color: '#d97706',
                        textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        ⚠ Lotes sin producto en catálogo
                      </Typography>
                      {resultados.lotesHuerfanos.map(({ lote, almacenActual }) => {
                        const almacen = ALMACENES.find(a => a.id === almacenActual)
                        return (
                          <Box key={lote.id} sx={{ backgroundColor: '#fffbeb', borderRadius: 2,
                            border: '1px solid #fde68a', p: 1.5, mb: 1,
                            display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#7C3AED' }}>
                              {lote.lote}
                            </Typography>
                            <Typography sx={{ fontSize: '0.82rem', color: '#475569', flex: 1 }}>
                              {lote.den_generica} {lote.concentracion} · {lote.presentacion}
                            </Typography>
                            {almacen && (
                              <Chip size="small" label={`${almacen.code} · ${almacen.label}`}
                                sx={{ backgroundColor: `${almacen.color}15`,
                                      color: almacen.color, fontWeight: 700, fontSize: '0.65rem' }} />
                            )}
                          </Box>
                        )
                      })}
                    </>
                  )}
                </Box>
              )
            )}
          </Box>
        </Box>
      )}

      {/* Tabs WHS — siempre visibles */}
      <Box sx={{
        px: 4, pt: 2, backgroundColor: '#fff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex', gap: 0.5, overflowX: 'auto',
      }}>
        {ALMACENES.map(a => {
          const isActive = a.id === activo
          const count = bucketsFiltrados[a.id].filter(it => it.almacenActual === a.id).length
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

      {/* Contenido del almacén activo */}
      <Box sx={{ flex: 1, backgroundColor: '#F8FAFC' }}>
        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress sx={{ color: almacenActivo.color }} />
          </Box>
        ) : (
          <Cuerpo lotes={bucketsFiltrados[activo]} />
        )}
      </Box>
    </Box>
  )
}
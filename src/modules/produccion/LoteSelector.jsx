import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, InputAdornment, CircularProgress, IconButton,
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material'
import {
  Plus, Search, CheckCircle2, XCircle, AlertTriangle, Clock,
  Package, Layers, X, Hash, Beaker, Trash2, AlertCircle,
  Tag, FlaskConical
} from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import Grid from '@mui/material/Grid'

function getEstatusBadge(lote) {
  if (lote.estatus === 'enviado')   return { label: 'Enviado',   color: '#0891b2', bg: '#ecfeff', Icon: CheckCircle2 }
  if (lote.estatus === 'liberado')  return { label: 'Liberado',  color: '#16a34a', bg: '#f0fdf4', Icon: CheckCircle2 }
  if (lote.estatus === 'cancelado') return { label: 'Cancelado', color: '#dc2626', bg: '#fef2f2', Icon: XCircle }
  if (lote.estatus === 'rechazado') return { label: 'Rechazado', color: '#d97706', bg: '#fffbeb', Icon: AlertTriangle }
  return { label: 'En proceso', color: '#7C3AED', bg: '#F5F3FF', Icon: Clock }
}

function LoteCard({ lote, onClick, onDelete }) {
  const badge = getEstatusBadge(lote)
  return (
    <Box onClick={() => onClick(lote)} sx={{
      borderRadius: 3, overflow: 'hidden', cursor: 'pointer',
      border: '1.5px solid #e2e8f0', backgroundColor: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      transition: 'all 0.2s ease', position: 'relative',
      '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(124,58,237,0.18)', borderColor: '#C4B5FD' },
      '&:hover .delete-btn': { opacity: 1 },
    }}>
      <IconButton
        className="delete-btn"
        onClick={(e) => { e.stopPropagation(); onDelete(lote) }}
        size="small"
        sx={{
          position: 'absolute', top: 6, right: 6, zIndex: 2,
          backgroundColor: 'rgba(255,255,255,0.95)',
          color: '#dc2626', opacity: 0, width: 26, height: 26,
          transition: 'opacity 0.2s, background-color 0.15s',
          '&:hover': { backgroundColor: '#fee2e2' },
        }}>
        <Trash2 size={13} />
      </IconButton>

      <Box sx={{ background: 'linear-gradient(135deg,#4C1D95,#7C3AED)', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 34, height: 34, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Package size={16} color="#fff" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Lote</Typography>
          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#fff', fontFamily: 'monospace', lineHeight: 1.1 }}>{lote.lote}</Typography>
        </Box>
      </Box>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
        <Typography sx={{ fontSize: '0.82rem', color: '#1e293b', fontWeight: 600, lineHeight: 1.35, minHeight: 38, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {lote.producto || 'Sin producto'}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #e2e8f0', pt: 1 }}>
          <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Cantidad</Typography>
          <Typography sx={{ fontSize: '0.85rem', fontFamily: 'monospace', fontWeight: 800, color: '#475569' }}>
            {lote.cantidad ? lote.cantidad.toLocaleString('en-US') : '—'}
          </Typography>
        </Box>
        <Box sx={{ backgroundColor: badge.bg, borderRadius: 1.5, py: 0.7, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
          <badge.Icon size={12} color={badge.color} />
          <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: badge.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{badge.label}</Typography>
        </Box>
      </Box>
    </Box>
  )
}

const inputSx = {
  borderRadius: 2, fontSize: '0.88rem', backgroundColor: '#fafafa',
  '& fieldset': { borderColor: '#e2e8f0' },
  '&:hover fieldset': { borderColor: '#C4B5FD' },
  '&.Mui-focused fieldset': { borderColor: '#7C3AED', borderWidth: 1.5 },
}

const ESTADO_VACIO = {
  lote: '', den_generica: '', denominacion_distintiva: '',
  concentracion: '', forma_farmaceutica: '', presentacion: '',
  presentacion_validada_id: '', qty_plan: '',
}

function loteMatchesEstatus(lote, filtro) {
  if (!filtro) return true
  if (filtro === 'activo') return !lote.estatus || lote.estatus === 'activo'
  return lote.estatus === filtro
}

export function LoteSelector({ lotes, loading, onSelect, onRefresh }) {
  const [busqueda, setBusqueda]       = useState('')
  const [filtroEstatus, setFiltroEstatus] = useState(null)
  const [dialogNuevo, setDialogNuevo] = useState(false)
  const [guardando, setGuardando]     = useState(false)
  const [loteAEliminar, setLoteAEliminar] = useState(null)
  const [eliminando, setEliminando]       = useState(false)
  const [nuevoLote, setNuevoLote]     = useState(ESTADO_VACIO)

  // ─── Catálogo ───
  const [productos, setProductos] = useState([])
  const [presentacionesValidadas, setPresentacionesValidadas] = useState([])

  useEffect(() => {
    cargarCatalogo()
  }, [])

  async function cargarCatalogo() {
    const [{ data: prods }, { data: pres }] = await Promise.all([
      supabase.from('productos').select('*').order('den_distintiva'),
      supabase.from('presentaciones_validadas').select('*'),
    ])
    setProductos(prods || [])
    setPresentacionesValidadas(pres || [])
  }

  // ─── Lógica de cascada ───
  // Lista única de denominaciones genéricas
  const opcionesGenerica = [...new Set(productos.map(p => p.den_generica))].sort()

  // Productos que matchean la genérica elegida
  const productosFiltrados = nuevoLote.den_generica
    ? productos.filter(p => p.den_generica === nuevoLote.den_generica)
    : []

  // Distintivas únicas para la genérica elegida
  const opcionesDistintiva = [...new Set(productosFiltrados.map(p => p.den_distintiva))].sort()

  // Concentraciones únicas para genérica+distintiva
  const opcionesConcentracion = productosFiltrados
    .filter(p => !nuevoLote.denominacion_distintiva || p.den_distintiva === nuevoLote.denominacion_distintiva)
    .map(p => p.concentracion)
    .filter((v, i, a) => a.indexOf(v) === i).sort()

  // Producto exacto seleccionado (matchea los 3 primeros campos)
  const productoElegido = productos.find(p =>
    p.den_generica === nuevoLote.den_generica &&
    p.den_distintiva === nuevoLote.denominacion_distintiva &&
    p.concentracion === nuevoLote.concentracion
  )

  // Presentaciones validadas para ese producto
  const presValidadasDelProducto = productoElegido
    ? presentacionesValidadas.filter(pv => pv.producto_id === productoElegido.id)
    : []

  // Presentaciones únicas
  const opcionesPresentacion = [...new Set(presValidadasDelProducto.map(pv => pv.presentacion))]

  // Tamaños validados disponibles para la presentación elegida
  const tamanosDisponibles = nuevoLote.presentacion
    ? presValidadasDelProducto.filter(pv => pv.presentacion === nuevoLote.presentacion)
    : []

  // ─── Handlers ───
  function setField(key, val) {
    setNuevoLote(p => ({ ...p, [key]: val }))
  }

  // Cuando cambia la genérica, resetear todo lo que está debajo
  function setGenerica(val) {
    setNuevoLote(p => ({
      ...p, den_generica: val,
      denominacion_distintiva: '', concentracion: '', forma_farmaceutica: '',
      presentacion: '', presentacion_validada_id: '', qty_plan: '',
    }))
  }

  function setDistintiva(val) {
    setNuevoLote(p => ({
      ...p, denominacion_distintiva: val,
      concentracion: '', forma_farmaceutica: '',
      presentacion: '', presentacion_validada_id: '', qty_plan: '',
    }))
  }

  function setConcentracion(val) {
    // Autorrellena forma farmacéutica desde el producto
    const prod = productos.find(p =>
      p.den_generica === nuevoLote.den_generica &&
      p.den_distintiva === nuevoLote.denominacion_distintiva &&
      p.concentracion === val
    )
    setNuevoLote(p => ({
      ...p, concentracion: val,
      forma_farmaceutica: prod?.forma_farma || '',
      presentacion: '', presentacion_validada_id: '', qty_plan: '',
    }))
  }

  function setPresentacion(val) {
    setNuevoLote(p => ({
      ...p, presentacion: val,
      presentacion_validada_id: '', qty_plan: '',
    }))
  }

  // Al elegir el tamaño validado, autollena la cantidad
  function setTamanoValidado(id) {
    const pv = presentacionesValidadas.find(x => x.id === parseInt(id))
    setNuevoLote(p => ({
      ...p,
      presentacion_validada_id: id,
      qty_plan: pv ? pv.granel_total.toString() : '',
    }))
  }

  function resetNuevoLote() { setNuevoLote(ESTADO_VACIO) }

  async function handleCrearLote() {
    if (!nuevoLote.lote || !nuevoLote.den_generica) return
    setGuardando(true)
    const producto = [nuevoLote.den_generica, nuevoLote.concentracion, nuevoLote.forma_farmaceutica]
      .filter(Boolean).join(' ')
    const { error } = await supabase.from('lotes').insert({
      lote: nuevoLote.lote.toUpperCase(),
      producto,
      cantidad: parseInt(nuevoLote.qty_plan) || null,
      den_generica:            nuevoLote.den_generica            || null,
      concentracion:           nuevoLote.concentracion           || null,
      forma_farmaceutica:      nuevoLote.forma_farmaceutica      || null,
      denominacion_distintiva: nuevoLote.denominacion_distintiva || null,
      presentacion:            nuevoLote.presentacion            || null,
    })
    setGuardando(false)
    if (!error) {
      setDialogNuevo(false)
      resetNuevoLote()
      onRefresh()
    }
  }

  async function handleEliminarLote() {
    if (!loteAEliminar) return
    setEliminando(true)
    await supabase.from('historial_ediciones').delete().eq('lote_id', loteAEliminar.id)
    await supabase.from('fechas_proceso').delete().eq('lote_id', loteAEliminar.id)
    const { error } = await supabase.from('lotes').delete().eq('id', loteAEliminar.id)
    setEliminando(false)
    setLoteAEliminar(null)
    if (!error) onRefresh()
  }

  const lotesFiltrados = lotes.filter(l => {
    const q = busqueda.toLowerCase()
    const matchesBusqueda =
      l.lote.toLowerCase().includes(q) ||
      (l.producto || '').toLowerCase().includes(q)
    return matchesBusqueda && loteMatchesEstatus(l, filtroEstatus)
  })

  const total      = lotes.length
  const activos    = lotes.filter(l => loteMatchesEstatus(l, 'activo')).length
  const liberados  = lotes.filter(l => l.estatus === 'liberado').length
  const rechazados = lotes.filter(l => l.estatus === 'rechazado').length

  function toggleFiltroEstatus(estatus) {
    setFiltroEstatus(prev => (prev === estatus ? null : estatus))
  }

  // Reutilizable: estilo común para los Select
  const selectFormSx = { '& .MuiOutlinedInput-root': inputSx }

  return (
    <Box sx={{ p: 4 }}>

      {/* Barra de acciones */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Buscar lote o producto..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={14} color="#94a3b8" /></InputAdornment>, sx: inputSx } }}
          sx={{ width: 320 }} />

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',      value: total,      color: '#7C3AED', Icon: Layers,        filtro: null },
            { label: 'En proceso', value: activos, color: '#0891b2', Icon: Clock, filtro: 'activo' },
            { label: 'Liberados',  value: liberados,  color: '#16a34a', Icon: CheckCircle2,  filtro: 'liberado' },
            { label: 'Rechazados', value: rechazados, color: '#d97706', Icon: AlertTriangle, filtro: 'rechazado' },
          ].map(s => {
            const activo = filtroEstatus === s.filtro
            return (
              <Box
                key={s.label}
                role="button"
                tabIndex={0}
                onClick={() => toggleFiltroEstatus(s.filtro)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFiltroEstatus(s.filtro) } }}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.6, cursor: 'pointer',
                  backgroundColor: activo ? `${s.color}12` : '#fff',
                  border: `1.5px solid ${activo ? s.color : `${s.color}30`}`,
                  borderRadius: 2, px: 1.4, py: 0.6,
                  transition: 'all 0.15s ease',
                  '&:hover': { backgroundColor: `${s.color}18`, borderColor: s.color },
                }}>
                <s.Icon size={13} color={s.color} />
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</Typography>
                <Typography sx={{ fontSize: '0.6rem', color: activo ? s.color : '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.3, fontWeight: activo ? 800 : 400 }}>{s.label}</Typography>
              </Box>
            )
          })}
        </Box>

        <Box sx={{ flex: 1 }} />

        <Button startIcon={<Plus size={16} />} onClick={() => setDialogNuevo(true)} variant="contained"
          sx={{ background: 'linear-gradient(135deg,#7C3AED,#D946EF)', fontWeight: 700, textTransform: 'none', borderRadius: 2.5, px: 2.5,
            boxShadow: '0 4px 12px rgba(124,58,237,0.25)', '&:hover': { boxShadow: '0 6px 20px rgba(124,58,237,0.4)' } }}>
          Nuevo Lote
        </Button>
      </Box>

      {/* Grid de cards */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#7C3AED' }} size={44} />
        </Box>
      ) : lotesFiltrados.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Package size={48} color="#DDD6FE" />
          <Typography sx={{ color: '#94a3b8', mt: 2, fontSize: '0.9rem' }}>No se encontraron lotes</Typography>
          <Typography sx={{ color: '#cbd5e1', fontSize: '0.78rem', mt: 0.5 }}>
            {busqueda || filtroEstatus ? 'Prueba con otra búsqueda o quita el filtro' : 'Crea un nuevo lote para empezar'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {lotesFiltrados.map(lote => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={lote.id}>
              <LoteCard lote={lote} onClick={onSelect} onDelete={setLoteAEliminar} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ═══ Dialog nuevo lote con CASCADA ═══ */}
      <Dialog open={dialogNuevo} onClose={() => setDialogNuevo(false)} maxWidth="sm" fullWidth
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ p: 0, background: 'linear-gradient(135deg,#4C1D95,#7C3AED)', color: '#fff' }}>
          <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Plus size={20} />
              <Box>
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.1 }}>Nuevo Lote</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)' }}>
                  Selecciona del catálogo · {productos.length} productos · {presentacionesValidadas.length} tamaños validados
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDialogNuevo(false)} size="small" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              <X size={18} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* ─── Identificación ─── */}
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#7C3AED',
            textTransform: 'uppercase', letterSpacing: 0.5, mt: -0.5 }}>
            Identificación
          </Typography>

          <TextField label="Número de Lote *" value={nuevoLote.lote}
            onChange={e => setField('lote', e.target.value)}
            placeholder="Ej: 602003A" fullWidth size="small"
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><Hash size={14} color="#94a3b8" /></InputAdornment>, sx: inputSx } }} />

          {/* ─── Datos del producto (cascada) ─── */}
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#7C3AED',
            textTransform: 'uppercase', letterSpacing: 0.5, mt: 1 }}>
            Datos del producto (del catálogo)
          </Typography>

          {/* 1. Denominación Genérica */}
          <FormControl fullWidth size="small" sx={selectFormSx}>
            <InputLabel>Denominación Genérica *</InputLabel>
            <Select
              value={nuevoLote.den_generica}
              label="Denominación Genérica *"
              onChange={e => setGenerica(e.target.value)}
              startAdornment={<InputAdornment position="start"><FlaskConical size={14} color="#94a3b8" /></InputAdornment>}
            >
              {opcionesGenerica.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </Select>
          </FormControl>

          {/* 2. Denominación Distintiva */}
          <FormControl fullWidth size="small" sx={selectFormSx} disabled={!nuevoLote.den_generica}>
            <InputLabel>Denominación Distintiva</InputLabel>
            <Select
              value={nuevoLote.denominacion_distintiva}
              label="Denominación Distintiva"
              onChange={e => setDistintiva(e.target.value)}
              startAdornment={<InputAdornment position="start"><Tag size={14} color="#94a3b8" /></InputAdornment>}
            >
              {opcionesDistintiva.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </Select>
          </FormControl>

          {/* 3 y 4: Concentración + Forma farmacéutica */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <FormControl fullWidth size="small" sx={selectFormSx} disabled={!nuevoLote.denominacion_distintiva}>
              <InputLabel>Concentración</InputLabel>
              <Select
                value={nuevoLote.concentracion}
                label="Concentración"
                onChange={e => setConcentracion(e.target.value)}
              >
                {opcionesConcentracion.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
              </Select>
            </FormControl>

            <TextField label="Forma Farmacéutica" value={nuevoLote.forma_farmaceutica}
              disabled fullWidth size="small"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><Beaker size={14} color="#94a3b8" /></InputAdornment>, sx: inputSx } }} />
          </Box>

          {/* 5. Presentación */}
          <FormControl fullWidth size="small" sx={selectFormSx} disabled={!nuevoLote.concentracion}>
            <InputLabel>Presentación</InputLabel>
            <Select
              value={nuevoLote.presentacion}
              label="Presentación"
              onChange={e => setPresentacion(e.target.value)}
              startAdornment={<InputAdornment position="start"><Package size={14} color="#94a3b8" /></InputAdornment>}
            >
              {opcionesPresentacion.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </Select>
          </FormControl>

          {nuevoLote.presentacion && opcionesPresentacion.length === 0 && (
            <Box sx={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: 2, p: 1.2, display: 'flex', gap: 1 }}>
              <AlertCircle size={14} color="#d97706" />
              <Typography sx={{ fontSize: '0.72rem', color: '#92400e' }}>
                Este producto no tiene tamaños validados cargados aún
              </Typography>
            </Box>
          )}

          {/* ─── Plan de fabricación ─── */}
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#7C3AED',
            textTransform: 'uppercase', letterSpacing: 0.5, mt: 1 }}>
            Plan de fabricación
          </Typography>

          {/* 6. Tamaño validado (opcional pero recomendado) */}
          <FormControl fullWidth size="small" sx={selectFormSx} disabled={tamanosDisponibles.length === 0}>
            <InputLabel>Tamaño de Lote Validado</InputLabel>
            <Select
              value={nuevoLote.presentacion_validada_id}
              label="Tamaño de Lote Validado"
              onChange={e => setTamanoValidado(e.target.value)}
            >
              {tamanosDisponibles.map(pv => (
                <MenuItem key={pv.id} value={pv.id}>
                  {pv.granel_total.toLocaleString('en-US')} u.d. → {pv.piezas_resultado.toLocaleString('en-US')} piezas
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Resumen del tamaño elegido */}
          {nuevoLote.presentacion_validada_id && (() => {
            const pv = presentacionesValidadas.find(x => x.id === parseInt(nuevoLote.presentacion_validada_id))
            if (!pv) return null
            return (
              <Box sx={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 2, p: 1.5 }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: '#15803d',
                  textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.6 }}>
                  Tamaño validado COFEPRIS
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                  <Box>
                    <Typography sx={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                      Granel total
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#15803d', fontFamily: 'monospace' }}>
                      {pv.granel_total.toLocaleString('en-US')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                      A acondicionar
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#15803d', fontFamily: 'monospace' }}>
                      {pv.granel_destinado.toLocaleString('en-US')}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                      Piezas finales
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#15803d', fontFamily: 'monospace' }}>
                      {pv.piezas_resultado.toLocaleString('en-US')}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            )
          })()}

          <TextField label="Cantidad Plan (tabletas/cápsulas a granel)" type="number" value={nuevoLote.qty_plan}
            onChange={e => setField('qty_plan', e.target.value)}
            placeholder="Se autollena al elegir tamaño validado" fullWidth size="small"
            slotProps={{ input: { sx: inputSx } }} />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1, borderTop: '1px solid #f1f5f9' }}>
          <Button onClick={() => setDialogNuevo(false)} sx={{ textTransform: 'none', color: '#64748b' }}>Cancelar</Button>
          <Button variant="contained" onClick={handleCrearLote}
            disabled={guardando || !nuevoLote.lote || !nuevoLote.den_generica}
            startIcon={guardando ? null : <Plus size={14} />}
            sx={{ background: 'linear-gradient(135deg,#7C3AED,#D946EF)', textTransform: 'none', fontWeight: 700, px: 3,
              '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' } }}>
            {guardando ? 'Guardando...' : 'Crear Lote'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog confirmar eliminar */}
      <Dialog open={!!loteAEliminar} onClose={() => !eliminando && setLoteAEliminar(null)}
        maxWidth="xs" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, backgroundColor: '#fee2e2',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={22} color="#dc2626" />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>
                ¿Eliminar este lote?
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#64748b' }}>
                Esta acción no se puede deshacer
              </Typography>
            </Box>
          </Box>

          <Box sx={{ backgroundColor: '#fef2f2', borderRadius: 2, p: 2, mb: 2, border: '1px solid #fecaca' }}>
            <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              Lote
            </Typography>
            <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#dc2626', fontFamily: 'monospace' }}>
              {loteAEliminar?.lote}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#475569', mt: 0.3 }}>
              {loteAEliminar?.producto || 'Sin producto'}
            </Typography>
          </Box>

          <Typography sx={{ fontSize: '0.78rem', color: '#475569', mb: 2 }}>
            Se eliminarán también todas las fechas de proceso y el historial de movimientos de este lote.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={() => setLoteAEliminar(null)} disabled={eliminando}
              sx={{ textTransform: 'none', color: '#64748b' }}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleEliminarLote} disabled={eliminando}
              startIcon={eliminando ? null : <Trash2 size={14} />}
              sx={{
                backgroundColor: '#dc2626', textTransform: 'none', fontWeight: 700, px: 2.5,
                '&:hover': { backgroundColor: '#b91c1c' },
                '&.Mui-disabled': { backgroundColor: '#e2e8f0', color: '#94a3b8' },
              }}>
              {eliminando ? 'Eliminando...' : 'Eliminar lote'}
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Box>
  )
}
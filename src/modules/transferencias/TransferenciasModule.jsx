import { useState, useEffect, useMemo } from 'react'
import {
  Box, Typography, Button, TextField, InputAdornment,
  Select, MenuItem, FormControl, Paper, Snackbar, Alert, CircularProgress
} from '@mui/material'
import {
  ArrowLeftRight, ArrowRight, Hash, Calendar, Boxes, Send, RotateCcw,
  Warehouse, Truck, CheckCircle2, X, AlertTriangle, ShieldAlert
} from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { ALMACENES, getAlmacenActual, getCantidadEnAlmacen } from '../../lib/almacenes.js'
import { ORDEN_ETAPA } from '../../constants/etapas.js'

const HOY_ISO = new Date().toISOString().slice(0, 10)

// Reglas de negocio: de Granel (WHS1) no se transfiere por aquí — ese salto
// lo hace producción (Planeación/Producción de Acondicionamiento). Solo se
// permite mover lotes que ya están en Acondicionamiento o en Cuarentena.
const ORIGENES_PERMITIDOS = ['whs2', 'whs3']

function alm(id) { return ALMACENES.find(a => a.id === id) }

// ═══════════════════════════════════════════════════════════════
// Selector de almacén con ícono — restringido a una lista de ids
// ═══════════════════════════════════════════════════════════════
function SelectAlmacen({ value, onChange, only, placeholder = 'Selecciona almacén' }) {
  const opciones = ALMACENES.filter(a => only.includes(a.id))
  return (
    <FormControl fullWidth size="small">
      <Select
        value={value}
        onChange={e => onChange(e.target.value)}
        displayEmpty
        renderValue={(v) => {
          if (!v) return <span style={{ color: '#94a3b8' }}>{placeholder}</span>
          const a = alm(v)
          return a ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <a.Icon size={14} color={a.color} />
              <span style={{ fontWeight: 700, color: a.color }}>{a.code}</span>
              <span>— {a.label}</span>
            </Box>
          ) : v
        }}
        sx={{
          fontSize: '0.88rem', backgroundColor: '#fff', borderRadius: 2,
          '& fieldset': { borderColor: '#e2e8f0' },
          '&:hover fieldset': { borderColor: '#C4B5FD' },
          '&.Mui-focused fieldset': { borderColor: '#7C3AED' },
        }}
      >
        <MenuItem value=""><em>{placeholder}</em></MenuItem>
        {opciones.map(a => (
          <MenuItem key={a.id} value={a.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <a.Icon size={14} color={a.color} />
              <span style={{ fontWeight: 700, color: a.color }}>{a.code}</span>
              <span>— {a.label}</span>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

// ═══════════════════════════════════════════════════════════════
// Selector de lote — solo lotes que están actualmente en el almacén origen
// ═══════════════════════════════════════════════════════════════
function SelectLote({ value, onChange, lotesDisponibles, disabled }) {
  return (
    <FormControl fullWidth size="small" disabled={disabled}>
      <Select
        value={value}
        onChange={e => onChange(e.target.value)}
        displayEmpty
        renderValue={(v) => {
          if (!v) return <span style={{ color: '#94a3b8' }}>{disabled ? 'Elige primero el almacén origen' : 'Selecciona lote'}</span>
          const it = lotesDisponibles.find(x => x.lote.id === v)
          return it ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{it.lote.lote}</span>
              <span style={{ color: '#64748b', fontSize: '0.82rem' }}>— {it.lote.producto || it.lote.den_generica || 'Sin producto'}</span>
            </Box>
          ) : v
        }}
        sx={{
          fontSize: '0.88rem', backgroundColor: '#fff', borderRadius: 2,
          '& fieldset': { borderColor: '#e2e8f0' },
          '&:hover fieldset': { borderColor: '#C4B5FD' },
          '&.Mui-focused fieldset': { borderColor: '#7C3AED' },
        }}
      >
        <MenuItem value=""><em>Selecciona lote</em></MenuItem>
        {lotesDisponibles.map(it => (
          <MenuItem key={it.lote.id} value={it.lote.id}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{it.lote.lote}</span>
              <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{it.lote.producto || it.lote.den_generica || 'Sin producto'}</span>
            </Box>
          </MenuItem>
        ))}
        {lotesDisponibles.length === 0 && !disabled && (
          <MenuItem value="" disabled>
            <em>No hay lotes en este almacén</em>
          </MenuItem>
        )}
      </Select>
    </FormControl>
  )
}

// ═══════════════════════════════════════════════════════════════
// Etiqueta de campo
// ═══════════════════════════════════════════════════════════════
function Label({ children }) {
  return (
    <Typography sx={{
      fontSize: '0.7rem', fontWeight: 800, color: '#475569',
      textTransform: 'uppercase', letterSpacing: 0.6, mb: 0.5,
    }}>
      {children}
    </Typography>
  )
}

// ═══════════════════════════════════════════════════════════════
// Flecha entre columnas (decorativa)
// ═══════════════════════════════════════════════════════════════
function FlechaConexion() {
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: '100%', height: '100%', minHeight: 38,
    }}>
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 32, height: 32, borderRadius: '50%',
        background: 'linear-gradient(135deg,#7C3AED,#D946EF)',
        boxShadow: '0 4px 10px rgba(124,58,237,0.3)',
      }}>
        <ArrowRight size={16} color="#fff" />
      </Box>
    </Box>
  )
}

// ═══════════════════════════════════════════════════════════════
// Renglón con campo origen → flecha → destino
// ═══════════════════════════════════════════════════════════════
function FilaCampo({ label, origen, destino }) {
  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: '1fr 60px 1fr' },
      gap: 2, alignItems: 'end', mb: 2.5,
    }}>
      <Box>
        <Label>{label}</Label>
        {origen}
      </Box>
      <Box sx={{ display: { xs: 'none', md: 'block' } }}>
        <FlechaConexion />
      </Box>
      <Box>
        <Label>{label}</Label>
        {destino}
      </Box>
    </Box>
  )
}

// ═══════════════════════════════════════════════════════════════
// Componente principal
// ═══════════════════════════════════════════════════════════════
export default function TransferenciasModule() {
  const [lotesData, setLotesData] = useState([])
  const [cargando, setCargando]   = useState(true)
  const [guardando, setGuardando] = useState(false)

  // Origen
  const [origAlmacen, setOrigAlmacen] = useState('')
  const [origLoteId, setOrigLoteId]   = useState('')

  // Destino
  const [destAlmacen, setDestAlmacen] = useState('')
  const [cantidad, setCantidad]       = useState('')
  const [fecha, setFecha]             = useState(HOY_ISO)
  const [motivoRechazo, setMotivoRechazo] = useState('')

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  useEffect(() => { cargarLotes() }, [])

  async function cargarLotes() {
    setCargando(true)
    const [{ data: lotes }, { data: fechas }] = await Promise.all([
      supabase.from('lotes').select('*').order('created_at', { ascending: false }),
      supabase.from('fechas_proceso').select('*, etapas_proceso(nombre, orden)'),
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
    setCargando(false)
  }

  // Lotes que están actualmente en el almacén de origen elegido
  const lotesDisponibles = useMemo(() => {
    if (!origAlmacen) return []
    return lotesData.filter(it => it.almacenActual === origAlmacen)
  }, [origAlmacen, lotesData])

  const loteSel = useMemo(
    () => lotesDisponibles.find(it => it.lote.id === origLoteId) || null,
    [lotesDisponibles, origLoteId]
  )

  const cantidadDisponible = loteSel ? getCantidadEnAlmacen(loteSel, origAlmacen) : null

  // Al cambiar el almacén origen, limpiar lo que dependa de él.
  // WHS2 solo puede ir a Cuarentena (WHS3), así que se preselecciona.
  function cambiarOrigAlmacen(val) {
    setOrigAlmacen(val)
    setOrigLoteId('')
    setDestAlmacen(val === 'whs2' ? 'whs3' : '')
    setCantidad('')
    setMotivoRechazo('')
  }

  // Al elegir lote, autollenar la cantidad disponible en el almacén origen
  function cambiarLote(loteId) {
    setOrigLoteId(loteId)
    const it = lotesDisponibles.find(x => x.lote.id === loteId)
    const disp = it ? getCantidadEnAlmacen(it, origAlmacen) : null
    setCantidad(disp != null ? String(disp) : '')
  }

  const motivoRequerido = destAlmacen === 'whs5' && !motivoRechazo.trim()

  const puedeGuardar =
    origAlmacen && origLoteId && destAlmacen &&
    cantidad && Number(cantidad) > 0 && fecha && !motivoRequerido && !guardando

  function limpiar() {
    setOrigAlmacen(''); setOrigLoteId(''); setDestAlmacen('')
    setCantidad(''); setFecha(HOY_ISO); setMotivoRechazo('')
  }

  async function guardar() {
    if (!loteSel) return
    setGuardando(true)
    try {
      const etapaOrden = destAlmacen === 'whs3' ? ORDEN_ETAPA.CUARENTENA : ORDEN_ETAPA.ACEPTADO
      const fp = loteSel.fechasLote.find(f => f.etapas_proceso?.orden === etapaOrden)
      if (!fp) throw new Error('No se encontró la etapa de proceso correspondiente para este lote')

      const fechaAnterior = fp.fecha_actual || null
      const cantidadNum = parseInt(cantidad)

      const { error: errFp } = await supabase.from('fechas_proceso')
        .update({ fecha_actual: fecha, cantidad_actual: cantidadNum })
        .eq('id', fp.id)
      if (errFp) throw errFp

      if (destAlmacen === 'whs4') {
        const { error: errLote } = await supabase.from('lotes')
          .update({ estatus: 'liberado', motivo_rechazo: null })
          .eq('id', loteSel.lote.id)
        if (errLote) throw errLote
      } else if (destAlmacen === 'whs5') {
        const { error: errLote } = await supabase.from('lotes')
          .update({ estatus: 'rechazado', motivo_rechazo: motivoRechazo.trim() || null })
          .eq('id', loteSel.lote.id)
        if (errLote) throw errLote
      }

      await supabase.from('historial_ediciones').insert({
        lote_id: loteSel.lote.id, etapa_id: fp.etapa_id, lote: loteSel.lote.lote,
        etapa_nombre: fp.etapas_proceso?.nombre || '', cantidad: cantidadNum || null,
        nombre_usuario: '—', fecha_captura: new Date().toISOString(),
        fecha_actual_anterior: fechaAnterior, fecha_actual_nueva: fecha || null,
      })

      const origA = alm(origAlmacen), destA = alm(destAlmacen)
      setSnackbar({
        open: true, severity: 'success',
        message: `✓ Transferencia registrada: ${loteSel.lote.lote} de ${origA.code} → ${destA.code} (${cantidadNum.toLocaleString('en-US')} u.)`,
      })
      limpiar()
      await cargarLotes()
    } catch (err) {
      setSnackbar({ open: true, severity: 'error', message: 'Error: ' + err.message })
    }
    setGuardando(false)
  }

  const origAlm = alm(origAlmacen)
  const destAlm = alm(destAlmacen)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>

      {/* ═══ TÍTULO ═══ */}
      <Box sx={{
        px: 4, py: 1.5, backgroundColor: '#fff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', gap: 2,
      }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 2,
          background: 'linear-gradient(135deg,#7C3AED,#D946EF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ArrowLeftRight size={18} color="#fff" />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>
            Transferencias
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
            Mover lotes entre almacenes · Acondicionamiento → Cuarentena → Liberado/Rechazado
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
          {lotesData.length} lotes en inventario activo
        </Typography>
      </Box>

      {/* ═══ FORMULARIO ═══ */}
      <Box sx={{ p: 4, flex: 1 }}>

        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#7C3AED' }} />
          </Box>
        ) : (
        <Paper elevation={0} sx={{
          borderRadius: 3, border: '1.5px solid #e2e8f0',
          p: 4, backgroundColor: '#fff', maxWidth: 1200, mx: 'auto',
        }}>

          {/* Encabezados de columnas */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 60px 1fr' },
            gap: 2, mb: 3,
          }}>
            {/* Origen — header */}
            <Box sx={{
              background: origAlm
                ? `linear-gradient(135deg,${origAlm.grad[0]},${origAlm.grad[1]})`
                : 'linear-gradient(135deg,#475569,#64748b)',
              borderRadius: 2, p: 2,
              display: 'flex', alignItems: 'center', gap: 1.5,
              transition: 'background 0.3s',
            }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 1.5,
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {origAlm ? <origAlm.Icon size={18} color="#fff" /> : <Warehouse size={18} color="#fff" />}
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)',
                  textTransform: 'uppercase', letterSpacing: 1 }}>
                  Origen
                </Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                  De {origAlm ? `· ${origAlm.code} ${origAlm.label}` : ''}
                </Typography>  
              </Box>  
            </Box>

            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'linear-gradient(135deg,#7C3AED,#D946EF)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(124,58,237,0.35)',
              }}>
                <Truck size={22} color="#fff" />
              </Box>
            </Box>

            {/* Destino — header */}
            <Box sx={{
              background: destAlm
                ? `linear-gradient(135deg,${destAlm.grad[0]},${destAlm.grad[1]})`
                : 'linear-gradient(135deg,#475569,#64748b)',
              borderRadius: 2, p: 2,
              display: 'flex', alignItems: 'center', gap: 1.5,
              transition: 'background 0.3s',
            }}>
              <Box sx={{
                width: 36, height: 36, borderRadius: 1.5,
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {destAlm ? <destAlm.Icon size={18} color="#fff" /> : <Warehouse size={18} color="#fff" />}
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)',
                  textTransform: 'uppercase', letterSpacing: 1 }}>
                  Destino
                </Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>
                  A {destAlm ? `· ${destAlm.code} ${destAlm.label}` : ''}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* ─── Fila Almacén ─── */}
          <FilaCampo
            label="Almacén"
            origen={
              <SelectAlmacen value={origAlmacen} onChange={cambiarOrigAlmacen}
                only={ORIGENES_PERMITIDOS} placeholder="Almacén origen (WHS2 o WHS3)" />
            }
            destino={
              origAlmacen === 'whs2' ? (
                <Box sx={{
                  height: 40, borderRadius: 2, border: '1.5px solid #fde68a',
                  backgroundColor: '#fffbeb', display: 'flex', alignItems: 'center', gap: 1, px: 1.5,
                }}>
                  <ShieldAlert size={14} color="#ca8a04" />
                  <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400e' }}>
                    WHS3 — Cuarentena (único destino válido)
                  </Typography>
                </Box>
              ) : origAlmacen === 'whs3' ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Button variant={destAlmacen === 'whs4' ? 'contained' : 'outlined'}
                    startIcon={<CheckCircle2 size={15} />}
                    onClick={() => setDestAlmacen(destAlmacen === 'whs4' ? '' : 'whs4')}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.78rem',
                      ...(destAlmacen === 'whs4'
                        ? { backgroundColor: '#16a34a', '&:hover': { backgroundColor: '#15803d' } }
                        : { color: '#16a34a', borderColor: '#bbf7d0',
                          '&:hover': { backgroundColor: '#f0fdf4', borderColor: '#16a34a' } }) }}>
                    Aprobar
                  </Button>
                  <Button variant={destAlmacen === 'whs5' ? 'contained' : 'outlined'}
                    startIcon={<X size={15} />}
                    onClick={() => setDestAlmacen(destAlmacen === 'whs5' ? '' : 'whs5')}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: '0.78rem',
                      ...(destAlmacen === 'whs5'
                        ? { backgroundColor: '#dc2626', '&:hover': { backgroundColor: '#b91c1c' } }
                        : { color: '#dc2626', borderColor: '#fecaca',
                          '&:hover': { backgroundColor: '#fef2f2', borderColor: '#dc2626' } }) }}>
                    Rechazar
                  </Button>
                </Box>
              ) : (
                <Box sx={{
                  height: 40, borderRadius: 2, border: '1.5px dashed #e2e8f0',
                  display: 'flex', alignItems: 'center', px: 1.5,
                }}>
                  <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    Elige primero el almacén origen
                  </Typography>
                </Box>
              )
            }
          />

          {/* ─── Fila Lote ─── */}
          <FilaCampo
            label="Lote"
            origen={
              <SelectLote value={origLoteId} onChange={cambiarLote}
                lotesDisponibles={lotesDisponibles} disabled={!origAlmacen} />
            }
            destino={
              <TextField value={loteSel?.lote.lote || ''} disabled placeholder="—" size="small" fullWidth
                slotProps={{ input: {
                  startAdornment: <InputAdornment position="start"><Hash size={14} color="#94a3b8" /></InputAdornment>,
                  sx: { fontSize: '0.88rem', fontFamily: 'monospace', backgroundColor: '#f8fafc', borderRadius: 2 },
                } }}
              />
            }
          />

          {/* ─── Fila Cantidad ─── */}
          <FilaCampo
            label="Cantidad (Qty)"
            origen={
              <TextField value={cantidadDisponible != null ? cantidadDisponible.toLocaleString('en-US') : ''}
                disabled placeholder="0" size="small" fullWidth
                slotProps={{ input: {
                  startAdornment: <InputAdornment position="start"><Boxes size={14} color="#94a3b8" /></InputAdornment>,
                  sx: { fontSize: '0.88rem', fontFamily: 'monospace', backgroundColor: '#f8fafc', borderRadius: 2 },
                } }}
              />
            }
            destino={
              <TextField value={cantidad} onChange={e => setCantidad(e.target.value)}
                type="number" placeholder="0" size="small" fullWidth disabled={!origLoteId}
                slotProps={{ input: {
                  startAdornment: <InputAdornment position="start"><Boxes size={14} color="#94a3b8" /></InputAdornment>,
                  sx: { fontSize: '0.88rem', fontFamily: 'monospace', backgroundColor: '#fff', borderRadius: 2 },
                } }}
              />
            }
          />

          {/* ─── Fila Fecha ─── */}
          <FilaCampo
            label="Fecha"
            origen={
              <TextField type="date" value={fecha} disabled
                size="small" fullWidth
                slotProps={{ input: {
                  startAdornment: <InputAdornment position="start"><Calendar size={14} color="#94a3b8" /></InputAdornment>,
                  sx: { fontSize: '0.88rem', backgroundColor: '#f8fafc', borderRadius: 2 },
                } }}
              />
            }
            destino={
              <TextField type="date" value={fecha} onChange={e => setFecha(e.target.value)}
                size="small" fullWidth disabled={!origLoteId}
                slotProps={{ input: {
                  startAdornment: <InputAdornment position="start"><Calendar size={14} color="#94a3b8" /></InputAdornment>,
                  sx: { fontSize: '0.88rem', backgroundColor: '#fff', borderRadius: 2 },
                } }}
              />
            }
          />

          {/* ─── Motivo de rechazo ─── */}
          {destAlmacen === 'whs5' && (
            <Box sx={{ mb: 2.5, backgroundColor: '#fef2f2', borderRadius: 2, p: 1.5,
              border: '1px solid #fecaca', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <AlertTriangle size={14} color="#dc2626" />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#dc2626' }}>
                  Motivo del rechazo *
                </Typography>
              </Box>
              <TextField
                value={motivoRechazo}
                onChange={e => setMotivoRechazo(e.target.value)}
                multiline minRows={2} maxRows={4}
                placeholder="Describe brevemente por qué se rechaza el lote..."
                fullWidth size="small"
                error={motivoRequerido}
                helperText={motivoRequerido ? 'El motivo es obligatorio para rechazar' : ' '}
                sx={{ backgroundColor: '#fff', borderRadius: 2 }}
              />
            </Box>
          )}

          {/* ─── Validación / aviso ─── */}
          {origAlmacen && lotesDisponibles.length === 0 && (
            <Box sx={{
              mt: -1, mb: 2.5, p: 1.5, borderRadius: 2,
              backgroundColor: '#fffbeb', border: '1px solid #fde68a',
              display: 'flex', alignItems: 'center', gap: 1,
            }}>
              <Typography sx={{ fontSize: '0.78rem', color: '#92400e', fontWeight: 700 }}>
                ⚠ No hay lotes actualmente en {alm(origAlmacen)?.code} — {alm(origAlmacen)?.label}
              </Typography>
            </Box>
          )}

          {/* ─── Acciones ─── */}
          <Box sx={{
            mt: 4, pt: 3, borderTop: '1px dashed #e2e8f0',
            display: 'flex', gap: 1.5, justifyContent: 'flex-end',
          }}>
            <Button
              onClick={limpiar}
              startIcon={<RotateCcw size={14} />}
              sx={{
                textTransform: 'none', color: '#475569',
                border: '1px solid #e2e8f0', borderRadius: 2, px: 2.5,
                '&:hover': { borderColor: '#7C3AED', color: '#7C3AED', backgroundColor: '#F5F3FF' },
              }}
            >
              Limpiar
            </Button>
            <Button
              onClick={guardar}
              disabled={!puedeGuardar}
              startIcon={<Send size={14} />}
              variant="contained"
              sx={{
                textTransform: 'none', fontWeight: 800, borderRadius: 2, px: 3,
                background: 'linear-gradient(135deg,#7C3AED,#D946EF)',
                boxShadow: '0 6px 18px rgba(124,58,237,0.3)',
                '&:hover': { background: 'linear-gradient(135deg,#6D28D9,#C026D3)' },
                '&.Mui-disabled': {
                  background: '#e2e8f0', color: '#94a3b8', boxShadow: 'none',
                },
              }}
            >
              {guardando ? 'Registrando...' : 'Registrar transferencia'}
            </Button>
          </Box>
        </Paper>
        )}
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} variant="filled"
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

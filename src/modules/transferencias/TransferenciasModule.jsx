import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, TextField, InputAdornment,
  Select, MenuItem, FormControl, Paper, Snackbar, Alert
} from '@mui/material'
import {
  ArrowLeftRight, ArrowRight, FlaskConical, Package, ShieldAlert,
  Ban, BadgeCheck, Hash, Calendar, Boxes, Send, RotateCcw,
  Warehouse, Truck
} from 'lucide-react'
import { supabase } from '../../lib/supabase.js'

// ═══════════════════════════════════════════════════════════════
// Catálogo de almacenes (mismo que Inventario)
// ═══════════════════════════════════════════════════════════════
const ALMACENES = [
  { id: 'whs1', code: 'WHS1', label: 'Granel',            Icon: FlaskConical, color: '#7C3AED', grad: ['#4c1d95','#7C3AED'] },
  { id: 'whs2', code: 'WHS2', label: 'Acondicionamiento', Icon: Package,      color: '#d97706', grad: ['#78350f','#d97706'] },
  { id: 'whs3', code: 'WHS3', label: 'Cuarentena',        Icon: ShieldAlert,  color: '#ca8a04', grad: ['#713f12','#ca8a04'] },
  { id: 'whs4', code: 'WHS4', label: 'Liberado',          Icon: BadgeCheck,   color: '#16a34a', grad: ['#14532d','#16a34a'] },
  { id: 'whs5', code: 'WHS5', label: 'Rechazado',         Icon: Ban,          color: '#dc2626', grad: ['#7f1d1d','#dc2626'] },
]

const HOY_ISO = new Date().toISOString().slice(0, 10)

// ═══════════════════════════════════════════════════════════════
// Selector de almacén con ícono
// ═══════════════════════════════════════════════════════════════
function SelectAlmacen({ value, onChange, exclude, placeholder = 'Selecciona almacén' }) {
  const opciones = ALMACENES.filter(a => a.id !== exclude)
  return (
    <FormControl fullWidth size="small">
      <Select
        value={value}
        onChange={e => onChange(e.target.value)}
        displayEmpty
        renderValue={(v) => {
          if (!v) return <span style={{ color: '#94a3b8' }}>{placeholder}</span>
          const a = ALMACENES.find(x => x.id === v)
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
// Componente principal
// ═══════════════════════════════════════════════════════════════
export default function TransferenciasModule() {
  // Origen
  const [origAlmacen, setOrigAlmacen] = useState('')
  const [origLote, setOrigLote]       = useState('')
  const [origQty, setOrigQty]         = useState('')
  const [origFecha, setOrigFecha]     = useState(HOY_ISO)

  // Destino
  const [destAlmacen, setDestAlmacen] = useState('')
  const [destLote, setDestLote]       = useState('')
  const [destQty, setDestQty]         = useState('')
  const [destFecha, setDestFecha]     = useState(HOY_ISO)

  // Cuando cambia el lote de origen, auto-llenar destino (es el mismo lote moviéndose)
  useEffect(() => { setDestLote(origLote) }, [origLote])
  useEffect(() => { setDestQty(origQty) }, [origQty])

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const puedeGuardar =
    origAlmacen && destAlmacen && origAlmacen !== destAlmacen &&
    origLote.trim() && origQty && origFecha &&
    destLote.trim() && destQty && destFecha

  function limpiar() {
    setOrigAlmacen(''); setOrigLote(''); setOrigQty(''); setOrigFecha(HOY_ISO)
    setDestAlmacen(''); setDestLote(''); setDestQty(''); setDestFecha(HOY_ISO)
  }

  async function guardar() {
    // TODO: cuando exista la tabla `transferencias` en Supabase, hacer el INSERT aquí.
    // Por ahora solo simula el guardado para validar el diseño.
    setSnackbar({
      open: true,
      severity: 'success',
      message: `✓ Transferencia registrada: ${origLote} de ${origAlmacen.toUpperCase()} → ${destAlmacen.toUpperCase()} (${Number(destQty).toLocaleString('en-US')} u.)`,
    })
    limpiar()
  }

  const origAlm = ALMACENES.find(a => a.id === origAlmacen)
  const destAlm = ALMACENES.find(a => a.id === destAlmacen)

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
            Mover lotes entre almacenes
          </Typography>
        </Box>
      </Box>

      {/* ═══ FORMULARIO ═══ */}
      <Box sx={{ p: 4, flex: 1 }}>

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
              <SelectAlmacen value={origAlmacen} onChange={setOrigAlmacen}
                exclude={destAlmacen} placeholder="Almacén origen" />
            }
            destino={
              <SelectAlmacen value={destAlmacen} onChange={setDestAlmacen}
                exclude={origAlmacen} placeholder="Almacén destino" />
            }
          />

          {/* ─── Fila Lote ─── */}
          <FilaCampo
            label="Lote"
            origen={
              <TextField value={origLote} onChange={e => setOrigLote(e.target.value)}
                placeholder="ej. 123456" size="small" fullWidth
                slotProps={{ input: {
                  startAdornment: <InputAdornment position="start"><Hash size={14} color="#94a3b8" /></InputAdornment>,
                  sx: { fontSize: '0.88rem', fontFamily: 'monospace', backgroundColor: '#fff', borderRadius: 2 },
                } }}
              />
            }
            destino={
              <TextField value={destLote} onChange={e => setDestLote(e.target.value)}
                placeholder="ej. 123456" size="small" fullWidth
                slotProps={{ input: {
                  startAdornment: <InputAdornment position="start"><Hash size={14} color="#94a3b8" /></InputAdornment>,
                  sx: { fontSize: '0.88rem', fontFamily: 'monospace', backgroundColor: '#fff', borderRadius: 2 },
                } }}
              />
            }
          />

          {/* ─── Fila Cantidad ─── */}
          <FilaCampo
            label="Cantidad (Qty)"
            origen={
              <TextField value={origQty} onChange={e => setOrigQty(e.target.value)}
                type="number" placeholder="0" size="small" fullWidth
                slotProps={{ input: {
                  startAdornment: <InputAdornment position="start"><Boxes size={14} color="#94a3b8" /></InputAdornment>,
                  sx: { fontSize: '0.88rem', fontFamily: 'monospace', backgroundColor: '#fff', borderRadius: 2 },
                } }}
              />
            }
            destino={
              <TextField value={destQty} onChange={e => setDestQty(e.target.value)}
                type="number" placeholder="0" size="small" fullWidth
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
              <TextField type="date" value={origFecha} onChange={e => setOrigFecha(e.target.value)}
                size="small" fullWidth
                slotProps={{ input: {
                  startAdornment: <InputAdornment position="start"><Calendar size={14} color="#94a3b8" /></InputAdornment>,
                  sx: { fontSize: '0.88rem', backgroundColor: '#fff', borderRadius: 2 },
                } }}
              />
            }
            destino={
              <TextField type="date" value={destFecha} onChange={e => setDestFecha(e.target.value)}
                size="small" fullWidth
                slotProps={{ input: {
                  startAdornment: <InputAdornment position="start"><Calendar size={14} color="#94a3b8" /></InputAdornment>,
                  sx: { fontSize: '0.88rem', backgroundColor: '#fff', borderRadius: 2 },
                } }}
              />
            }
          />

          {/* ─── Validación / aviso ─── */}
          {origAlmacen && destAlmacen && origAlmacen === destAlmacen && (
            <Box sx={{
              mt: 2, p: 1.5, borderRadius: 2,
              backgroundColor: '#fef2f2', border: '1px solid #fecaca',
              display: 'flex', alignItems: 'center', gap: 1,
            }}>
              <Typography sx={{ fontSize: '0.78rem', color: '#dc2626', fontWeight: 700 }}>
                ⚠ El almacén de origen y destino no pueden ser el mismo
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
              Registrar transferencia
            </Button>
          </Box>
        </Paper>
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
// En las siguientes funciones, en los diferentes procesos de programacion se desmuestran que 
// Los esquemas son sintetizados en una fuente del codigo en la que se pueden 
// realizar transferencias de informacion entre almacenes asi como tambien cantidades.
// Se han agregado los modulos de produccion, inventarios, planeacion, ajustes de inventarios, consulta de historial y 
// transferencias.
// en el modulo de produccion se visualizan las 8 etapas del proceso de fabricacion de lotes 
// En el que tambien se visualizan el reusmen de lote y los desfases de los dias del proceso.
// En el modulo de inventarios esta implementado la consulta de inventarios por stock, se busca por almacenes, 
// en este caso son 5 pero todo es por consulta para consultar almacenes unicamente y ver donde se encuentra el producto almacenado
// 
//
//
//
//
//
//
///
///
//


import { useState } from 'react'
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, InputAdornment, IconButton,
  Select, MenuItem, FormControl, InputLabel, Table, TableBody,
  TableCell, TableRow, Autocomplete
} from '@mui/material'
import Grid from '@mui/material/Grid'
import {
  SlidersHorizontal, Plus, Search, X, Check, Hash, Package,
  ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, RefreshCw,
  Layers, CheckCircle2, XCircle, AlertTriangle, Clock,
  TrendingUp, TrendingDown, FileText, Paperclip, Warehouse,
  AlertCircle, Trash2
} from 'lucide-react'

// ═══ MOCK DATA (solo para preview) ═══
const MOCK_AJUSTES = [
  {
    id: 1, folio: 'AJ-2026-0142', tipo: 'salida', motivo: 'Merma producción',
    lote: '602003A', producto: 'Paracetamol 500mg Tabletas',
    almacen_origen: 'WHS1 - Granel', almacen_destino: null,
    cantidad: -200, estatus: 'aplicado', fecha: '2026-05-12',
    observaciones: 'Tabletas defectuosas detectadas en línea 3',
  },
  {
    id: 2, folio: 'AJ-2026-0141', tipo: 'entrada', motivo: 'Devolución cliente',
    lote: '598112B', producto: 'Ibuprofeno 400mg Cápsulas',
    almacen_origen: null, almacen_destino: 'WHS5 - Liberado',
    cantidad: 1500, estatus: 'autorizado', fecha: '2026-05-11',
    observaciones: 'Devolución completa - lote en buen estado',
  },
  {
    id: 3, folio: 'AJ-2026-0140', tipo: 'traspaso', motivo: 'Movimiento entre almacenes',
    lote: '601887C', producto: 'Amoxicilina 500mg Suspensión',
    almacen_origen: 'WHS3 - Cuarentena', almacen_destino: 'WHS5 - Liberado',
    cantidad: 3200, estatus: 'aplicado', fecha: '2026-05-11',
    observaciones: null,
  },
  {
    id: 4, folio: 'AJ-2026-0139', tipo: 'salida', motivo: 'Muestra QC',
    lote: '602003A', producto: 'Paracetamol 500mg Tabletas',
    almacen_origen: 'WHS3 - Cuarentena', almacen_destino: null,
    cantidad: -50, estatus: 'aplicado', fecha: '2026-05-10',
    observaciones: 'Muestreo para análisis fisicoquímico',
  },
  {
    id: 5, folio: 'AJ-2026-0138', tipo: 'salida', motivo: 'Destrucción',
    lote: '595001A', producto: 'Loratadina 10mg Tabletas',
    almacen_origen: 'WHS3 - Cuarentena', almacen_destino: null,
    cantidad: -800, estatus: 'borrador', fecha: '2026-05-10',
    observaciones: 'Lote rechazado por laboratorio - pendiente acta',
  },
  {
    id: 6, folio: 'AJ-2026-0137', tipo: 'reclasificacion', motivo: 'Ajuste por conteo físico',
    lote: '600445D', producto: 'Metformina 850mg Tabletas',
    almacen_origen: 'WHS5 - Liberado', almacen_destino: 'WHS5 - Liberado',
    cantidad: -12, estatus: 'aplicado', fecha: '2026-05-09',
    observaciones: 'Diferencia detectada en inventario semanal',
  },
  {
    id: 7, folio: 'AJ-2026-0136', tipo: 'entrada', motivo: 'Reproceso',
    lote: '601887C', producto: 'Amoxicilina 500mg Suspensión',
    almacen_origen: null, almacen_destino: 'WHS1 - Granel',
    cantidad: 450, estatus: 'autorizado', fecha: '2026-05-08',
    observaciones: 'Material recuperado de reproceso',
  },
  {
    id: 8, folio: 'AJ-2026-0135', tipo: 'traspaso', motivo: 'Liberación a mercado',
    lote: '599220B', producto: 'Omeprazol 20mg Cápsulas',
    almacen_origen: 'WHS3 - Cuarentena', almacen_destino: 'WHS5 - Liberado',
    cantidad: 8400, estatus: 'aplicado', fecha: '2026-05-08',
    observaciones: null,
  },
]

const TIPOS_CONFIG = {
  entrada: {
    label: 'Entrada', icon: ArrowDownToLine,
    color: '#16a34a', grad: ['#14532d', '#16a34a'],
    signo: '+', bg: '#f0fdf4', border: '#bbf7d0',
  },
  salida: {
    label: 'Salida', icon: ArrowUpFromLine,
    color: '#dc2626', grad: ['#7f1d1d', '#dc2626'],
    signo: '-', bg: '#fef2f2', border: '#fecaca',
  },
  traspaso: {
    label: 'Traspaso', icon: ArrowLeftRight,
    color: '#0891b2', grad: ['#164e63', '#0891b2'],
    signo: '↔', bg: '#ecfeff', border: '#a5f3fc',
  },
  reclasificacion: {
    label: 'Reclasificación', icon: RefreshCw,
    color: '#d97706', grad: ['#78350f', '#d97706'],
    signo: '±', bg: '#fffbeb', border: '#fde68a',
  },
}

const ESTATUS_CONFIG = {
  borrador:   { label: 'Borrador',    color: '#94a3b8', bg: '#f8fafc', Icon: FileText },
  autorizado: { label: 'Autorizado',  color: '#7C3AED', bg: '#F5F3FF', Icon: Clock },
  aplicado:   { label: 'Aplicado',    color: '#16a34a', bg: '#f0fdf4', Icon: CheckCircle2 },
  cancelado:  { label: 'Cancelado',   color: '#dc2626', bg: '#fef2f2', Icon: XCircle },
}

const MOTIVOS = [
  'Merma producción', 'Devolución cliente', 'Muestra QC',
  'Destrucción', 'Ajuste por conteo físico', 'Reproceso',
  'Movimiento entre almacenes', 'Liberación a mercado',
  'Caducidad', 'Robo o extravío',
]

const ALMACENES = [
  'WHS1 - Granel', 'WHS2 - Materia Prima', 'WHS3 - Cuarentena',
  'WHS4 - Acondicionamiento', 'WHS5 - Liberado', 'WHS6 - Rechazado',
]

const inputSx = {
  borderRadius: 2, fontSize: '0.88rem', backgroundColor: '#fafafa',
  '& fieldset': { borderColor: '#e2e8f0' },
  '&:hover fieldset': { borderColor: '#C4B5FD' },
  '&.Mui-focused fieldset': { borderColor: '#7C3AED', borderWidth: 1.5 },
}

const selectFormSx = { '& .MuiOutlinedInput-root': inputSx }

// ═══════════════════════════════════════════════════════════
// CARD DE AJUSTE
// ═══════════════════════════════════════════════════════════
function AjusteCard({ ajuste, onClick, onDelete }) {
  const cfg = TIPOS_CONFIG[ajuste.tipo]
  const est = ESTATUS_CONFIG[ajuste.estatus]
  const Icon = cfg.icon

  return (
    <Box onClick={() => onClick(ajuste)} sx={{
      borderRadius: 3, overflow: 'hidden', cursor: 'pointer',
      border: '1.5px solid #e2e8f0', backgroundColor: '#fff',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      transition: 'all 0.2s ease', position: 'relative',
      '&:hover': {
        transform: 'translateY(-3px)',
        boxShadow: `0 8px 24px ${cfg.color}25`,
        borderColor: cfg.color,
      },
      '&:hover .delete-btn': { opacity: 1 },
    }}>
      <IconButton
        className="delete-btn"
        onClick={(e) => { e.stopPropagation(); onDelete(ajuste) }}
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

      {/* Header con gradiente del tipo */}
      <Box sx={{
        background: `linear-gradient(135deg,${cfg.grad[0]},${cfg.grad[1]})`,
        px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1,
      }}>
        <Box sx={{
          width: 34, height: 34, borderRadius: 2,
          backgroundColor: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color="#fff" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{
            fontSize: '0.58rem', fontWeight: 700,
            color: 'rgba(255,255,255,0.75)',
            textTransform: 'uppercase', letterSpacing: 0.6,
          }}>
            {cfg.label}
          </Typography>
          <Typography sx={{
            fontSize: '0.92rem', fontWeight: 800, color: '#fff',
            fontFamily: 'monospace', lineHeight: 1.1,
          }}>
            {ajuste.folio}
          </Typography>
        </Box>
      </Box>

      {/* Cuerpo */}
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
        {/* Lote + producto */}
        <Box>
          <Typography sx={{
            fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 0.4,
          }}>
            Lote
          </Typography>
          <Typography sx={{
            fontSize: '0.85rem', fontWeight: 800, color: '#7C3AED',
            fontFamily: 'monospace', lineHeight: 1.1,
          }}>
            {ajuste.lote}
          </Typography>
          <Typography sx={{
            fontSize: '0.74rem', color: '#475569', mt: 0.2,
            display: '-webkit-box', WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {ajuste.producto}
          </Typography>
        </Box>

        {/* Cantidad grande con signo */}
        <Box sx={{
          backgroundColor: cfg.bg, borderRadius: 2, py: 1, px: 1.5,
          border: `1px solid ${cfg.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Typography sx={{
            fontSize: '0.6rem', color: cfg.color, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 0.4,
          }}>
            Cantidad
          </Typography>
          <Typography sx={{
            fontSize: '1.05rem', fontFamily: 'monospace',
            fontWeight: 800, color: cfg.color, lineHeight: 1,
          }}>
            {ajuste.cantidad > 0 ? '+' : ''}{ajuste.cantidad.toLocaleString('en-US')}
          </Typography>
        </Box>

        {/* Motivo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5,
          borderTop: '1px dashed #e2e8f0', pt: 1 }}>
          <Typography sx={{
            fontSize: '0.68rem', color: '#475569',
            fontWeight: 600, fontStyle: 'italic',
            display: '-webkit-box', WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {ajuste.motivo}
          </Typography>
        </Box>

        {/* Almacén origen/destino */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.65rem' }}>
          <Warehouse size={11} color="#94a3b8" />
          <Typography sx={{ fontSize: '0.62rem', color: '#64748b', lineHeight: 1.2 }}>
            {ajuste.almacen_origen && ajuste.almacen_destino
              ? `${ajuste.almacen_origen.split(' - ')[0]} → ${ajuste.almacen_destino.split(' - ')[0]}`
              : ajuste.almacen_origen?.split(' - ')[0]
              || ajuste.almacen_destino?.split(' - ')[0]}
          </Typography>
        </Box>

        {/* Badge estatus + fecha */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, justifyContent: 'space-between' }}>
          <Box sx={{
            backgroundColor: est.bg, borderRadius: 1.5, py: 0.5, px: 1,
            display: 'flex', alignItems: 'center', gap: 0.5,
          }}>
            <est.Icon size={11} color={est.color} />
            <Typography sx={{
              fontSize: '0.6rem', fontWeight: 800, color: est.color,
              textTransform: 'uppercase', letterSpacing: 0.4,
            }}>
              {est.label}
            </Typography>
          </Box>
          <Typography sx={{
            fontSize: '0.65rem', color: '#94a3b8', fontFamily: 'monospace',
          }}>
            {ajuste.fecha}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

// ═══════════════════════════════════════════════════════════
// HELPERS DEL DIALOG
// ═══════════════════════════════════════════════════════════
function FRow({ label, children }) {
  return (
    <TableRow>
      <TableCell sx={{
        fontSize: '0.72rem', fontWeight: 700, color: '#475569',
        textTransform: 'uppercase', letterSpacing: 0.4, width: '38%',
        backgroundColor: '#fafafa', borderRight: '1px solid #f1f5f9',
        py: 1.2, px: 2,
      }}>
        {label}
      </TableCell>
      <TableCell sx={{ py: 1, px: 1.5 }}>{children}</TableCell>
    </TableRow>
  )
}

// ═══════════════════════════════════════════════════════════
// DIALOG NUEVO AJUSTE
// ═══════════════════════════════════════════════════════════
function DialogNuevoAjuste({ open, onClose }) {
  const [tipo, setTipo] = useState(null)
  const [lote, setLote] = useState(null)
  const [almacenOrigen, setAlmacenOrigen] = useState('')
  const [almacenDestino, setAlmacenDestino] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [observaciones, setObservaciones] = useState('')

  // Mock disponible
  const cantidadDisponible = lote ? 12500 : 0
  const cantidadNum = parseInt(cantidad) || 0
  const excede = tipo === 'salida' && cantidadNum > cantidadDisponible
  const cfg = tipo ? TIPOS_CONFIG[tipo] : null

  function reset() {
    setTipo(null); setLote(null); setAlmacenOrigen('')
    setAlmacenDestino(''); setCantidad(''); setMotivo(''); setObservaciones('')
  }

  function handleClose() { reset(); onClose() }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}>

      {/* Header */}
      <DialogTitle sx={{ p: 0, background: 'linear-gradient(135deg,#4C1D95,#7C3AED)', color: '#fff' }}>
        <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SlidersHorizontal size={20} />
            <Box>
              <Typography sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.1 }}>
                Nuevo Ajuste de Inventario
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)' }}>
                Registra movimiento manual de un lote
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: 'rgba(255,255,255,0.85)' }}>
            <X size={18} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* 1. Tipo de ajuste — toggle buttons grandes */}
        <Typography sx={{
          fontSize: '0.68rem', fontWeight: 800, color: '#7C3AED',
          textTransform: 'uppercase', letterSpacing: 0.5, mt: -0.5,
        }}>
          Tipo de ajuste
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
          {Object.entries(TIPOS_CONFIG).map(([key, c]) => {
            const Icon = c.icon
            const activo = tipo === key
            return (
              <Box
                key={key}
                onClick={() => setTipo(key)}
                sx={{
                  cursor: 'pointer', borderRadius: 2, p: 1.2,
                  border: `1.5px solid ${activo ? c.color : '#e2e8f0'}`,
                  background: activo
                    ? `linear-gradient(135deg,${c.grad[0]},${c.grad[1]})`
                    : '#fafafa',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', gap: 0.6,
                  transition: 'all 0.15s ease',
                  '&:hover': { borderColor: c.color, transform: 'translateY(-2px)' },
                }}
              >
                <Icon size={20} color={activo ? '#fff' : c.color} />
                <Typography sx={{
                  fontSize: '0.7rem', fontWeight: 800,
                  color: activo ? '#fff' : c.color,
                  textTransform: 'uppercase', letterSpacing: 0.3,
                }}>
                  {c.label}
                </Typography>
              </Box>
            )
          })}
        </Box>

        {/* 2. Lote */}
        <Typography sx={{
          fontSize: '0.68rem', fontWeight: 800, color: '#7C3AED',
          textTransform: 'uppercase', letterSpacing: 0.5, mt: 1,
        }}>
          Lote afectado
        </Typography>

        <Autocomplete
          size="small"
          options={['602003A', '598112B', '601887C', '600445D', '599220B']}
          value={lote}
          onChange={(_, v) => setLote(v)}
          renderInput={(params) => (
            <TextField {...params} placeholder="Buscar lote..."
              slotProps={{
                input: {
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <Hash size={14} color="#94a3b8" />
                      </InputAdornment>
                      {params.InputProps.startAdornment}
                    </>
                  ),
                  sx: inputSx,
                },
              }}
            />
          )}
        />

        {/* Info del lote elegido */}
        {lote && (
          <Box sx={{
            backgroundColor: '#F5F3FF', borderRadius: 2, p: 1.5,
            border: '1px solid #DDD6FE',
          }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Box>
                <Typography sx={{
                  fontSize: '0.58rem', color: '#94a3b8',
                  fontWeight: 700, textTransform: 'uppercase',
                }}>
                  Producto
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: '#3B0764', fontWeight: 700 }}>
                  Paracetamol 500mg Tabletas
                </Typography>
              </Box>
              <Box>
                <Typography sx={{
                  fontSize: '0.58rem', color: '#94a3b8',
                  fontWeight: 700, textTransform: 'uppercase',
                }}>
                  Disponible
                </Typography>
                <Typography sx={{
                  fontSize: '0.85rem', color: '#7C3AED',
                  fontWeight: 800, fontFamily: 'monospace',
                }}>
                  {cantidadDisponible.toLocaleString('en-US')}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* 3. Almacenes */}
        {tipo && (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: tipo === 'traspaso' ? '1fr 1fr' : '1fr',
            gap: 2,
          }}>
            {(tipo === 'salida' || tipo === 'traspaso' || tipo === 'reclasificacion') && (
              <FormControl fullWidth size="small" sx={selectFormSx}>
                <InputLabel>Almacén origen</InputLabel>
                <Select
                  value={almacenOrigen}
                  label="Almacén origen"
                  onChange={e => setAlmacenOrigen(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <Warehouse size={14} color="#94a3b8" />
                    </InputAdornment>
                  }
                >
                  {ALMACENES.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                </Select>
              </FormControl>
            )}

            {(tipo === 'entrada' || tipo === 'traspaso') && (
              <FormControl fullWidth size="small" sx={selectFormSx}>
                <InputLabel>Almacén destino</InputLabel>
                <Select
                  value={almacenDestino}
                  label="Almacén destino"
                  onChange={e => setAlmacenDestino(e.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <Warehouse size={14} color="#94a3b8" />
                    </InputAdornment>
                  }
                >
                  {ALMACENES.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                </Select>
              </FormControl>
            )}
          </Box>
        )}

        {/* 4. Cantidad */}
        {tipo && (
          <TextField
            label="Cantidad" type="number" value={cantidad}
            onChange={e => setCantidad(e.target.value)}
            placeholder="0" fullWidth size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography sx={{
                      fontSize: '1rem', fontWeight: 800,
                      color: cfg.color, fontFamily: 'monospace',
                    }}>
                      {cfg.signo}
                    </Typography>
                  </InputAdornment>
                ),
                sx: inputSx,
              },
            }}
          />
        )}

        {/* Validación cantidad */}
        {tipo && cantidad && lote && (
          <Box sx={{
            borderRadius: 2, px: 1.5, py: 0.8,
            backgroundColor: excede ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${excede ? '#fecaca' : '#bbf7d0'}`,
            display: 'flex', alignItems: 'center', gap: 0.8,
          }}>
            {excede
              ? <AlertTriangle size={13} color="#ef4444" />
              : <CheckCircle2 size={13} color="#16a34a" />}
            <Typography sx={{
              fontSize: '0.72rem', fontWeight: 700,
              color: excede ? '#ef4444' : '#16a34a',
            }}>
              {excede
                ? `⚠ Excede en ${(cantidadNum - cantidadDisponible).toLocaleString('en-US')} unidades`
                : `✓ Hay ${cantidadDisponible.toLocaleString('en-US')} disponibles`}
            </Typography>
          </Box>
        )}

        {/* 5. Motivo */}
        {tipo && (
          <FormControl fullWidth size="small" sx={selectFormSx}>
            <InputLabel>Motivo</InputLabel>
            <Select
              value={motivo}
              label="Motivo"
              onChange={e => setMotivo(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <FileText size={14} color="#94a3b8" />
                </InputAdornment>
              }
            >
              {MOTIVOS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
          </FormControl>
        )}

        {/* 6. Observaciones */}
        {tipo && (
          <TextField
            label="Observaciones" value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            multiline minRows={2} maxRows={4}
            placeholder="Detalles adicionales del ajuste..."
            fullWidth size="small"
            slotProps={{ input: { sx: inputSx } }}
          />
        )}

        {/* 7. Evidencia opcional */}
        {tipo && (
          <Button
            variant="outlined" startIcon={<Paperclip size={14} />}
            sx={{
              borderRadius: 2, textTransform: 'none',
              color: '#7C3AED', borderColor: '#DDD6FE',
              alignSelf: 'flex-start',
              '&:hover': { borderColor: '#7C3AED', backgroundColor: '#F5F3FF' },
            }}
          >
            Adjuntar evidencia
          </Button>
        )}

        {/* Alert final */}
        {tipo && lote && cantidad && !excede && (
          <Box sx={{
            backgroundColor: cfg.bg, borderRadius: 2, px: 1.5, py: 1,
            border: `1px solid ${cfg.border}`,
            display: 'flex', alignItems: 'center', gap: 0.8,
          }}>
            <AlertCircle size={14} color={cfg.color} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: cfg.color }}>
              Al guardar, se {tipo === 'entrada' ? 'sumarán' : tipo === 'salida' ? 'descontarán' : 'moverán'}
              {' '}{cantidadNum.toLocaleString('en-US')} u. del lote {lote}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1, borderTop: '1px solid #f1f5f9' }}>
        <Button onClick={handleClose} startIcon={<X size={14} />}
          sx={{ borderRadius: 2, textTransform: 'none', color: '#64748b' }}>
          Cancelar
        </Button>
        <Button
          variant="contained" disabled={!tipo || !lote || !cantidad || !motivo || excede}
          startIcon={<Check size={14} />}
          sx={{
            background: 'linear-gradient(135deg,#7C3AED,#D946EF)',
            borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2.5,
            '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' },
          }}
        >
          Registrar Ajuste
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════
// DIALOG DETALLE
// ═══════════════════════════════════════════════════════════
function DialogDetalle({ ajuste, open, onClose }) {
  if (!ajuste) return null
  const cfg = TIPOS_CONFIG[ajuste.tipo]
  const est = ESTATUS_CONFIG[ajuste.estatus]
  const Icon = cfg.icon

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, overflow: 'hidden' } } }}>

      <Box sx={{
        background: `linear-gradient(135deg,${cfg.grad[0]},${cfg.grad[1]})`,
        px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 1.5,
            backgroundColor: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={20} color="#fff" />
          </Box>
          <Box>
            <Typography sx={{
              fontSize: '0.58rem', color: 'rgba(255,255,255,0.6)',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
            }}>
              {cfg.label}
            </Typography>
            <Typography sx={{
              fontSize: '0.92rem', fontWeight: 800, color: '#fff',
              fontFamily: 'monospace',
            }}>
              {ajuste.folio}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            borderRadius: 2, px: 1, py: 0.3,
          }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#fff' }}>
              {est.label.toUpperCase()}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            <X size={17} />
          </IconButton>
        </Box>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        <Table size="small">
          <TableBody>
            <FRow label="Lote">
              <Typography sx={{
                fontSize: '0.85rem', fontWeight: 800, color: '#7C3AED',
                fontFamily: 'monospace',
              }}>
                {ajuste.lote}
              </Typography>
            </FRow>
            <FRow label="Producto">
              <Typography sx={{ fontSize: '0.82rem', color: '#1e293b' }}>
                {ajuste.producto}
              </Typography>
            </FRow>
            <FRow label="Motivo">
              <Typography sx={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                {ajuste.motivo}
              </Typography>
            </FRow>
            {ajuste.almacen_origen && (
              <FRow label="Almacén origen">
                <Typography sx={{ fontSize: '0.82rem', color: '#475569' }}>
                  {ajuste.almacen_origen}
                </Typography>
              </FRow>
            )}
            {ajuste.almacen_destino && (
              <FRow label="Almacén destino">
                <Typography sx={{ fontSize: '0.82rem', color: '#475569' }}>
                  {ajuste.almacen_destino}
                </Typography>
              </FRow>
            )}
            <FRow label="Cantidad">
              <Typography sx={{
                fontSize: '1.1rem', fontWeight: 800, color: cfg.color,
                fontFamily: 'monospace',
              }}>
                {ajuste.cantidad > 0 ? '+' : ''}{ajuste.cantidad.toLocaleString('en-US')}
              </Typography>
            </FRow>
            <FRow label="Fecha">
              <Typography sx={{
                fontSize: '0.82rem', color: '#475569', fontFamily: 'monospace',
              }}>
                {ajuste.fecha}
              </Typography>
            </FRow>
            {ajuste.observaciones && (
              <FRow label="Observaciones">
                <Typography sx={{
                  fontSize: '0.78rem', color: '#475569', fontStyle: 'italic',
                }}>
                  {ajuste.observaciones}
                </Typography>
              </FRow>
            )}
          </TableBody>
        </Table>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1, borderTop: '1px solid #f1f5f9' }}>
        <Button onClick={onClose} startIcon={<X size={14} />} size="small"
          sx={{ borderRadius: 2, textTransform: 'none', color: '#64748b' }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════
// MÓDULO PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function AjustesInventarioModule() {
  const [ajustes] = useState(MOCK_AJUSTES)
  const [busqueda, setBusqueda] = useState('')
  const [filtroTipo, setFiltroTipo] = useState(null)
  const [dialogNuevo, setDialogNuevo] = useState(false)
  const [ajusteAbierto, setAjusteAbierto] = useState(null)

  const total = ajustes.length
  const entradas = ajustes.filter(a => a.tipo === 'entrada').length
  const salidas = ajustes.filter(a => a.tipo === 'salida').length
  const traspasos = ajustes.filter(a => a.tipo === 'traspaso').length
  const pendientes = ajustes.filter(a => a.estatus === 'borrador' || a.estatus === 'autorizado').length

  // Balance neto
  const balanceNeto = ajustes
    .filter(a => a.estatus === 'aplicado')
    .reduce((sum, a) => sum + a.cantidad, 0)

  const ajustesFiltrados = ajustes.filter(a => {
    const q = busqueda.toLowerCase()
    const matchesBusqueda =
      a.folio.toLowerCase().includes(q) ||
      a.lote.toLowerCase().includes(q) ||
      (a.producto || '').toLowerCase().includes(q) ||
      (a.motivo || '').toLowerCase().includes(q)
    const matchesTipo = !filtroTipo || a.tipo === filtroTipo
    return matchesBusqueda && matchesTipo
  })

  function toggleFiltroTipo(t) {
    setFiltroTipo(prev => (prev === t ? null : t))
  }

  return (
    <Box sx={{ p: 4 }}>

      {/* Header del módulo */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: 2,
          background: 'linear-gradient(135deg,#7C3AED,#D946EF)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(124,58,237,0.25)',
        }}>
          <SlidersHorizontal size={22} color="#fff" />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#3B0764', lineHeight: 1.1 }}>
            Ajustes de Inventarios
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>
            Movimientos manuales de lotes · entradas, salidas y traspasos
          </Typography>
        </Box>
      </Box>

      {/* Banner de balance neto */}
      <Box sx={{
        mt: 3, mb: 3,
        backgroundColor: '#fff', borderRadius: 3,
        border: '1.5px solid #e2e8f0', p: 2.5,
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {balanceNeto >= 0
            ? <TrendingUp size={28} color="#16a34a" />
            : <TrendingDown size={28} color="#dc2626" />}
          <Box>
            <Typography sx={{
              fontSize: '0.62rem', color: '#94a3b8',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              Balance neto del periodo
            </Typography>
            <Typography sx={{
              fontSize: '1.4rem', fontWeight: 800,
              color: balanceNeto >= 0 ? '#16a34a' : '#dc2626',
              fontFamily: 'monospace', lineHeight: 1,
            }}>
              {balanceNeto >= 0 ? '+' : ''}{balanceNeto.toLocaleString('en-US')}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ height: 36, width: 1, backgroundColor: '#e2e8f0' }} />

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography sx={{
              fontSize: '0.6rem', color: '#94a3b8',
              fontWeight: 700, textTransform: 'uppercase',
            }}>
              Aplicados
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#16a34a' }}>
              {ajustes.filter(a => a.estatus === 'aplicado').length}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{
              fontSize: '0.6rem', color: '#94a3b8',
              fontWeight: 700, textTransform: 'uppercase',
            }}>
              Pendientes
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#d97706' }}>
              {pendientes}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1 }} />

        <Typography sx={{
          fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic',
        }}>
          Periodo: Mayo 2026
        </Typography>
      </Box>

      {/* Barra de acciones */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Buscar folio, lote, producto o motivo..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={14} color="#94a3b8" />
                </InputAdornment>
              ),
              sx: inputSx,
            },
          }}
          sx={{ width: 340 }} />

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {[
            { label: 'Total', value: total, color: '#7C3AED', Icon: Layers, filtro: null },
            { label: 'Entradas', value: entradas, color: '#16a34a', Icon: ArrowDownToLine, filtro: 'entrada' },
            { label: 'Salidas', value: salidas, color: '#dc2626', Icon: ArrowUpFromLine, filtro: 'salida' },
            { label: 'Traspasos', value: traspasos, color: '#0891b2', Icon: ArrowLeftRight, filtro: 'traspaso' },
            { label: 'Reclasif.', value: ajustes.filter(a => a.tipo === 'reclasificacion').length, color: '#d97706', Icon: RefreshCw, filtro: 'reclasificacion' },
          ].map(s => {
            const activo = filtroTipo === s.filtro
            return (
              <Box
                key={s.label}
                role="button"
                tabIndex={0}
                onClick={() => toggleFiltroTipo(s.filtro)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFiltroTipo(s.filtro) } }}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 0.6, cursor: 'pointer',
                  backgroundColor: activo ? `${s.color}12` : '#fff',
                  border: `1.5px solid ${activo ? s.color : `${s.color}30`}`,
                  borderRadius: 2, px: 1.4, py: 0.6,
                  transition: 'all 0.15s ease',
                  '&:hover': { backgroundColor: `${s.color}18`, borderColor: s.color },
                }}>
                <s.Icon size={13} color={s.color} />
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>
                  {s.value}
                </Typography>
                <Typography sx={{
                  fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: 0.3,
                  color: activo ? s.color : '#94a3b8',
                  fontWeight: activo ? 800 : 400,
                }}>
                  {s.label}
                </Typography>
              </Box>
            )
          })}
        </Box>

        <Box sx={{ flex: 1 }} />

        <Button startIcon={<Plus size={16} />} onClick={() => setDialogNuevo(true)} variant="contained"
          sx={{
            background: 'linear-gradient(135deg,#7C3AED,#D946EF)',
            fontWeight: 700, textTransform: 'none',
            borderRadius: 2.5, px: 2.5,
            boxShadow: '0 4px 12px rgba(124,58,237,0.25)',
            '&:hover': { boxShadow: '0 6px 20px rgba(124,58,237,0.4)' },
          }}>
          Nuevo Ajuste
        </Button>
      </Box>

      {/* Grid de cards */}
      {ajustesFiltrados.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SlidersHorizontal size={48} color="#DDD6FE" />
          <Typography sx={{ color: '#94a3b8', mt: 2, fontSize: '0.9rem' }}>
            No se encontraron ajustes
          </Typography>
          <Typography sx={{ color: '#cbd5e1', fontSize: '0.78rem', mt: 0.5 }}>
            {busqueda || filtroTipo
              ? 'Prueba con otra búsqueda o quita el filtro'
              : 'Registra un nuevo ajuste para empezar'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {ajustesFiltrados.map(ajuste => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={ajuste.id}>
              <AjusteCard
                ajuste={ajuste}
                onClick={setAjusteAbierto}
                onDelete={() => {}}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <DialogNuevoAjuste open={dialogNuevo} onClose={() => setDialogNuevo(false)} />
      <DialogDetalle
        ajuste={ajusteAbierto}
        open={!!ajusteAbierto}
        onClose={() => setAjusteAbierto(null)}
      />
    </Box>
  )
}
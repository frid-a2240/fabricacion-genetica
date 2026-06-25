import { useState } from 'react'
import {
  Box, Typography, Button, TextField, Badge, Tooltip,
  Dialog, DialogContent, DialogActions, IconButton,
  Table, TableBody, TableCell, TableRow
} from '@mui/material'
import {
  Package, FlaskConical, Beaker, Factory,
  Microscope, BadgeCheck, History, Check, X,
  CheckCircle2, AlertTriangle, XCircle, Clock, Layers
} from 'lucide-react'
import { format, parseISO, differenceInDays, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

const HOY = new Date('2026-05-13T00:00:00')

const ETAPAS_CONFIG = {
  'Insumos':                                   { icon: Package,      color: '#7C3AED', grad: ['#4c1d95','#7c3aed'] },
  'Producción de Granel':                      { icon: FlaskConical, color: '#0891b2', grad: ['#164e63','#0891b2'] },
  'Graneles UA':                               { icon: Beaker,       color: '#059669', grad: ['#064e3b','#059669'] },
  'Producción Acondicionamiento Prim/Sec':     { icon: Factory,      color: '#d97706', grad: ['#78350f','#d97706'] },
  'Laboratorio':                               { icon: Microscope,   color: '#dc2626', grad: ['#7f1d1d','#dc2626'] },
  'Liberación':                                { icon: BadgeCheck,   color: '#16a34a', grad: ['#14532d','#16a34a'] },
}
function getCfg(nombre) {
  return ETAPAS_CONFIG[nombre] || { icon: Package, color: '#6366f1', grad: ['#1e1b4b','#6366f1'] }
}

function formatFecha(iso) {
  if (!iso) return null
  try { return format(parseISO(iso), 'dd/MMM/yy', { locale: es }).toUpperCase() }
  catch { return iso }
}

function getEstado(fechaPlan, fechaActual) {
  if (fechaActual && fechaPlan) {
    const diff = differenceInDays(parseISO(fechaActual), parseISO(fechaPlan))
    if (diff > 0) return { color: '#dc2626', bg: '#fef2f2', label: 'Fuera de plan' }
    return { color: '#16a34a', bg: '#f0fdf4', label: 'Completado' }
  }
  if (fechaActual) return { color: '#16a34a', bg: '#f0fdf4', label: 'Completado' }
  if (!fechaPlan)  return { color: '#94a3b8', bg: '#f8fafc', label: 'Sin fecha' }
  const plan = parseISO(fechaPlan); const hoy = new Date(HOY); hoy.setHours(0,0,0,0)
  if (plan < hoy)  return { color: '#f59e0b', bg: '#fffbeb', label: 'Atrasado' }
  return { color: '#6366f1', bg: '#eef2ff', label: 'Programado' }
}

const inputSx = {
  borderRadius: 2, fontSize: '0.82rem', backgroundColor: '#fafafa',
  '& fieldset': { borderColor: '#e2e8f0' },
  '&:hover fieldset': { borderColor: '#C4B5FD' },
  '&.Mui-focused fieldset': { borderColor: '#7C3AED', borderWidth: 1.5 },
}

// ═══ Helpers comunes del dialog ═══
function FRow({ label, children }) {
  return (
    <TableRow>
      <TableCell sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase',
        letterSpacing: 0.4, width: '38%', backgroundColor: '#fafafa', borderRight: '1px solid #f1f5f9', py: 1.2, px: 2 }}>
        {label}
      </TableCell>
      <TableCell sx={{ py: 1, px: 1.5 }}>{children}</TableCell>
    </TableRow>
  )
}

function FInput({ value, onChange, type = 'text', placeholder, disabled }) {
  return <TextField value={value} onChange={e => onChange(e.target.value)} type={type} placeholder={placeholder}
    fullWidth size="small" disabled={disabled}
    InputProps={{ sx: { ...inputSx, backgroundColor: disabled ? '#f1f5f9' : '#fafafa' } }} />
}

function FDate({ value, onChange, helperText }) {
  return <TextField type="date" value={value} onChange={e => onChange(e.target.value)} fullWidth size="small"
    helperText={helperText} InputLabelProps={{ shrink: true }}
    InputProps={{ sx: inputSx }} FormHelperTextProps={{ sx: { fontSize: '0.6rem', color: '#94a3b8' } }} />
}

function DesfaseAlert({ editFecha, fechaPlan }) {
  if (!editFecha || !fechaPlan) return null
  const diff = differenceInDays(parseISO(editFecha), parseISO(fechaPlan))
  const ok = diff <= 0
  return (
    <Box sx={{ borderRadius: 2, px: 1.5, py: 0.8,
      backgroundColor: ok ? '#f0fdf4' : '#fef2f2',
      border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}`,
      display: 'flex', alignItems: 'center', gap: 0.8 }}>
      {ok ? <CheckCircle2 size={13} color="#16a34a" /> : <AlertTriangle size={13} color="#ef4444" />}
      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: ok ? '#16a34a' : '#ef4444' }}>
        {diff === 0 ? 'En fecha exacta del plan'
          : diff < 0 ? `${Math.abs(diff)} día${Math.abs(diff)>1?'s':''} antes del plan`
          : `⚠ ${diff} día${diff>1?'s':''} fuera de plan`}
      </Typography>
    </Box>
  )
}

function DialogHeader({ nombre, numero, cfg, estado, onClose }) {
  const Icon = cfg.icon
  return (
    <Box sx={{ background: `linear-gradient(135deg,${cfg.grad[0]},${cfg.grad[1]})`, px: 3, py: 2,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 40, height: 40, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color="#fff" />
        </Box>
        <Box>
          <Typography sx={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 1 }}>
            Etapa {String(numero).padStart(2,'0')}
          </Typography>
          <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>{nombre}</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, px: 1, py: 0.3 }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#fff' }}>
            {estado.label.toUpperCase()}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          <X size={17} />
        </IconButton>
      </Box>
    </Box>
  )
}

function DialogFooter({ onClose, onGuardar, guardando, color }) {
  return (
    <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1, borderTop: '1px solid #f1f5f9' }}>
      <Button onClick={onClose} startIcon={<X size={14} />} size="small"
        sx={{ borderRadius: 2, textTransform: 'none', color: '#64748b' }}>
        Cancelar
      </Button>
      <Button variant="contained" onClick={onGuardar} disabled={guardando}
        startIcon={guardando ? null : <Check size={14} />} size="small"
        sx={{ background: `linear-gradient(135deg,#1e1b4b,${color})`, borderRadius: 2,
          textTransform: 'none', fontWeight: 700, px: 2.5 }}>
        {guardando ? 'Guardando...' : 'Guardar'}
      </Button>
    </DialogActions>
  )
}

const paperSx = { borderRadius: 3, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }

// ═══════════════════════════════════════════════════════════════════════════
// DIALOGS POR ETAPA — los 6 campos de producto vienen siempre del lote
// ═══════════════════════════════════════════════════════════════════════════

function Dialog1({ fp, lote, open, onClose, onGuardar }) {
  const cfg = getCfg('Insumos')
  const estado = getEstado(fp?.fecha_plan, fp?.fecha_actual)
  const [plan, setPlan] = useState(fp?.fecha_plan || '')
  const [real, setReal] = useState(fp?.fecha_actual || '')
  // ── Datos del lote (deshabilitados — heredados de la creación del lote) ──
  const denG = lote?.den_generica       || ''
  const conc = lote?.concentracion      || ''
  const ff   = lote?.forma_farmaceutica || ''
  const qtyP = lote?.cantidad?.toString() || ''
  const [qtyR, setQtyR] = useState(fp?.cantidad_actual?.toString() || '')
  const [guard, setGuard] = useState(false)

  async function guardar() {
    setGuard(true)
    await onGuardar(fp.id, fp.etapa_id, plan || null, real || null, qtyR ? parseInt(qtyR) : null)
    setGuard(false); onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: paperSx }}>
      <DialogHeader nombre="OP Planner" numero={1} cfg={cfg} estado={estado} onClose={onClose} />
      <DialogContent sx={{ p: 0 }}>
        <Table size="small"><TableBody>
          <FRow label="Denominación Genérica"><FInput value={denG} onChange={()=>{}} disabled /></FRow>
          <FRow label="Concentración"><FInput value={conc} onChange={()=>{}} disabled /></FRow>
          <FRow label="Forma Farmacéutica"><FInput value={ff} onChange={()=>{}} disabled /></FRow>
          <FRow label="QTY Plan"><FInput value={qtyP} onChange={()=>{}} type="number" disabled /></FRow>
          <FRow label="Fecha Plan"><FDate value={plan} onChange={setPlan} /></FRow>
          <FRow label="Fecha Real"><FDate value={real} onChange={setReal} /></FRow>
          <FRow label="QTY Real"><FInput value={qtyR} onChange={setQtyR} type="number" /></FRow>
        </TableBody></Table>
        <Box sx={{ p: 2 }}>
          <DesfaseAlert editFecha={real} fechaPlan={plan} />
        </Box>
      </DialogContent>
      <DialogFooter onClose={onClose} onGuardar={guardar} guardando={guard} color={cfg.color} />
    </Dialog>
  )
}

function Dialog2({ fp, open, onClose, onGuardar }) {
  const cfg = getCfg('Producción de Granel')
  const estado = getEstado(fp?.fecha_plan, fp?.fecha_actual)
  const [plan, setPlan] = useState(fp?.fecha_plan || '')
  const [real, setReal] = useState(fp?.fecha_actual || '')
  const [qty, setQty]   = useState(fp?.cantidad_actual?.toString() || '')
  const [exp, setExp]   = useState(fp?.fecha_exp || '')
  const [guard, setGuard] = useState(false)

  async function guardar() {
    setGuard(true)
    await onGuardar(fp.id, fp.etapa_id, plan || null, real || null, qty ? parseInt(qty) : null, exp || null)
    setGuard(false); onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: paperSx }}>
      <DialogHeader nombre="Producción de Granel" numero={2} cfg={cfg} estado={estado} onClose={onClose} />
      <DialogContent sx={{ p: 0 }}>
        <Table size="small"><TableBody>
          <FRow label="Fecha Plan"><FDate value={plan} onChange={setPlan} /></FRow>
          <FRow label="Fecha Real"><FDate value={real} onChange={setReal} /></FRow>
          <FRow label="QTY"><FInput value={qty} onChange={setQty} type="number" /></FRow>
          <FRow label="Fecha Exp."><FDate value={exp} onChange={setExp} /></FRow>
        </TableBody></Table>
        <Box sx={{ p: 2 }}>
          <DesfaseAlert editFecha={real} fechaPlan={plan} />
        </Box>
      </DialogContent>
      <DialogFooter onClose={onClose} onGuardar={guardar} guardando={guard} color={cfg.color} />
    </Dialog>
  )
}

function Dialog3({ fp, lote, open, onClose, onGuardar }) {
  const cfg = getCfg('Graneles UA')
  const estado = getEstado(fp?.fecha_plan, fp?.fecha_actual)
  const [plan, setPlan] = useState(fp?.fecha_plan || '')
  const [real, setReal] = useState(fp?.fecha_actual || '')
  const [qtyR, setQtyR] = useState(fp?.cantidad_actual?.toString() || '')

  // ── Los 6 datos del producto + cantidad plan + lote vienen del lote padre ──
  const loteNum = lote?.lote                          || ''
  const denG    = lote?.den_generica                  || ''
  const denD    = lote?.denominacion_distintiva       || ''
  const conc    = lote?.concentracion                 || ''
  const ff      = lote?.forma_farmaceutica            || ''
  const pres    = lote?.presentacion                  || ''
  const tam     = lote?.tamano                        || ''
  const qtyP    = lote?.cantidad?.toString()          || ''

  const [guard, setGuard] = useState(false)

  async function guardar() {
    setGuard(true)
    await onGuardar(fp.id, fp.etapa_id, plan || null, real || null, qtyR ? parseInt(qtyR) : null)
    setGuard(false); onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: paperSx }}>
      <DialogHeader nombre="Planner OA" numero={3} cfg={cfg} estado={estado} onClose={onClose} />
      <DialogContent sx={{ p: 0 }}>
        <Table size="small"><TableBody>
          <FRow label="Lote"><FInput value={loteNum} onChange={()=>{}} disabled /></FRow>
          <FRow label="Denominación Genérica"><FInput value={denG} onChange={()=>{}} disabled /></FRow>
          <FRow label="Denominación Distintiva"><FInput value={denD} onChange={()=>{}} disabled /></FRow>
          <FRow label="Concentración"><FInput value={conc} onChange={()=>{}} disabled /></FRow>
          <FRow label="Forma Farmacéutica"><FInput value={ff} onChange={()=>{}} disabled /></FRow>
          <FRow label="Presentación"><FInput value={pres} onChange={()=>{}} disabled /></FRow>
          <FRow label="Tamaño"><FInput value={tam} onChange={()=>{}} disabled /></FRow>
          <FRow label="QTY Plan Producción"><FInput value={qtyP} onChange={()=>{}} type="number" disabled /></FRow>
          <FRow label="Fecha Plan Producción"><FDate value={plan} onChange={setPlan} /></FRow>
          <FRow label="Fecha Real "><FDate value={real} onChange={setReal} /></FRow>
          <FRow label="QTY Real"><FInput value={qtyR} onChange={setQtyR} type="number" /></FRow>
        </TableBody></Table>
        <Box sx={{ p: 2 }}>
          <DesfaseAlert editFecha={real} fechaPlan={plan} />
        </Box>
      </DialogContent>
      <DialogFooter onClose={onClose} onGuardar={guardar} guardando={guard} color={cfg.color} />
    </Dialog>
  )
}

function Dialog4({ fp, open, onClose, onGuardar }) {
  const cfg = getCfg('Producción Acondicionamiento Prim/Sec')
  const estado = getEstado(fp?.fecha_plan, fp?.fecha_actual)
  const [plan, setPlan] = useState(fp?.fecha_plan || '')
  const [real, setReal] = useState(fp?.fecha_actual || '')
  const [qty, setQty]   = useState(fp?.cantidad_actual?.toString() || '')
  const [exp, setExp]   = useState(fp?.fecha_exp || '')
  const [guard, setGuard] = useState(false)

  async function guardar() {
    setGuard(true)
    await onGuardar(fp.id, fp.etapa_id, plan || null, real || null, qty ? parseInt(qty) : null, exp || null)
    setGuard(false); onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: paperSx }}>
      <DialogHeader nombre="Producción Acondicionamiento Prim/Sec" numero={4} cfg={cfg} estado={estado} onClose={onClose} />
      <DialogContent sx={{ p: 0 }}>
        <Table size="small"><TableBody>
          <FRow label="Fecha Plan"><FDate value={plan} onChange={setPlan} /></FRow>
          <FRow label="Fecha Real"><FDate value={real} onChange={setReal} /></FRow>
          <FRow label="QTY"><FInput value={qty} onChange={setQty} type="number" /></FRow>
          <FRow label="Fecha Exp."><FDate value={exp} onChange={setExp} /></FRow>
        </TableBody></Table>
        <Box sx={{ p: 2 }}>
          <DesfaseAlert editFecha={real} fechaPlan={plan} />
        </Box>
      </DialogContent>
      <DialogFooter onClose={onClose} onGuardar={guardar} guardando={guard} color={cfg.color} />
    </Dialog>
  )
}

function Dialog5({ fp, open, onClose, onGuardar, fechaAnteriorReal }) {
  const cfg = getCfg('Laboratorio')
  const estado = getEstado(fp?.fecha_plan, fp?.fecha_actual)
  function calcDefault() {
    if (fp?.fecha_plan) return fp.fecha_plan
    if (fechaAnteriorReal) {
      try { return format(addDays(parseISO(fechaAnteriorReal), 7), 'yyyy-MM-dd') } catch { return '' }
    }
    return ''
  }
  const [plan, setPlan] = useState(calcDefault)
  const [real, setReal] = useState(fp?.fecha_actual || '')
  const [guard, setGuard] = useState(false)
  const circulos = ['E','F','G','H','I','J','K','L']

  async function guardar() {
    setGuard(true)
    await onGuardar(fp.id, fp.etapa_id, plan || null, real || null, null)
    setGuard(false); onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: paperSx }}>
      <DialogHeader nombre="Laboratorio" numero={5} cfg={cfg} estado={estado} onClose={onClose} />
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', gap: 1, px: 2.5, pt: 2, pb: 1, flexWrap: 'wrap' }}>
          {circulos.map(l => (
            <Box key={l} sx={{ width: 32, height: 32, borderRadius: '50%',
              background: `linear-gradient(135deg,${cfg.grad[0]},${cfg.grad[1]})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff' }}>{l}</Typography>
            </Box>
          ))}
        </Box>
        <Table size="small"><TableBody>
          <FRow label="Fecha Plan (≈7 días)"><FDate value={plan} onChange={setPlan} helperText="Default: real anterior + 7 días" /></FRow>
          <FRow label="Fecha Real"><FDate value={real} onChange={setReal} /></FRow>
        </TableBody></Table>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <DesfaseAlert editFecha={real} fechaPlan={plan} />
          <Box sx={{ backgroundColor: '#fffbeb', borderRadius: 2, px: 1.5, py: 0.8,
            border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <Clock size={13} color="#d97706" />
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#d97706' }}>
              PLT de laboratorio: 7 días hábiles
            </Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogFooter onClose={onClose} onGuardar={guardar} guardando={guard} color={cfg.color} />
    </Dialog>
  )
}

function Dialog6({ fp, lote, open, onClose, onGuardar, onUpdateLote }) {
  const cfg = getCfg('Liberación')
  const estado = getEstado(fp?.fecha_plan, fp?.fecha_actual)
  const [plan, setPlan] = useState(fp?.fecha_plan || '')
  const [real, setReal] = useState(fp?.fecha_actual || '')
  const [qty, setQty]   = useState(fp?.cantidad_actual?.toString() || '')

  // Inicializa la acción según el estatus actual del lote
  const accionInicial =
    lote?.estatus === 'liberado'  ? 'aprobar'  :
    lote?.estatus === 'rechazado' ? 'rechazar' : null
  const [accion, setAccion] = useState(accionInicial)
  const [motivo, setMotivo] = useState(lote?.motivo_rechazo || '')
  const [guard, setGuard] = useState(false)

  // No se puede guardar un rechazo sin motivo
  const motivoRequerido = accion === 'rechazar' && !motivo.trim()

  async function guardar() {
    setGuard(true)
    // 1. Guardar fechas + QTY de la etapa (siempre)
    await onGuardar(fp.id, fp.etapa_id, plan || null, real || null, qty ? parseInt(qty) : null)

    // 2. Actualizar estatus del lote si seleccionó una acción
    if (accion === 'aprobar') {
      await onUpdateLote(lote.id, { estatus: 'liberado', motivo_rechazo: null }, '✓ Lote liberado')
    } else if (accion === 'rechazar') {
      await onUpdateLote(lote.id, { estatus: 'rechazado', motivo_rechazo: motivo.trim() || null }, '✓ Lote rechazado')
    }

    setGuard(false); onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: paperSx }}>
      <DialogHeader nombre="Liberación" numero={6} cfg={cfg} estado={estado} onClose={onClose} />
      <DialogContent sx={{ p: 0 }}>
        <Table size="small"><TableBody>
          <FRow label="Fecha Plan"><FDate value={plan} onChange={setPlan} /></FRow>
          <FRow label="Fecha Real"><FDate value={real} onChange={setReal} /></FRow>
          <FRow label="QTY"><FInput value={qty} onChange={setQty} type="number" /></FRow>
        </TableBody></Table>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <DesfaseAlert editFecha={real} fechaPlan={plan} />

          {/* ─── Botones aprobar / rechazar ─── */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <Button variant={accion === 'aprobar' ? 'contained' : 'outlined'}
              startIcon={<CheckCircle2 size={15} />}
              onClick={() => setAccion(accion === 'aprobar' ? null : 'aprobar')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700,
                ...(accion === 'aprobar'
                  ? { backgroundColor: '#16a34a', '&:hover': { backgroundColor: '#15803d' } }
                  : { color: '#16a34a', borderColor: '#bbf7d0',
                    '&:hover': { backgroundColor: '#f0fdf4', borderColor: '#16a34a' } }) }}>
              Aprobar
            </Button>
            <Button variant={accion === 'rechazar' ? 'contained' : 'outlined'}
              startIcon={<X size={15} />}
              onClick={() => setAccion(accion === 'rechazar' ? null : 'rechazar')}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700,
                ...(accion === 'rechazar'
                  ? { backgroundColor: '#dc2626', '&:hover': { backgroundColor: '#b91c1c' } }
                  : { color: '#dc2626', borderColor: '#fecaca',
                    '&:hover': { backgroundColor: '#fef2f2', borderColor: '#dc2626' } }) }}>
              Rechazar
            </Button>
          </Box>

          {/* ─── Aprobado: confirmación ─── */}
          {accion === 'aprobar' && (
            <Box sx={{ backgroundColor: '#f0fdf4', borderRadius: 2, px: 1.5, py: 1,
              border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <BadgeCheck size={14} color="#16a34a" />
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a' }}>
                Al guardar, la QTY se sumará al inventario · PLT = 9 días
              </Typography>
            </Box>
          )}

          {/* ─── Rechazado: pedir motivo ─── */}
          {accion === 'rechazar' && (
            <Box sx={{ backgroundColor: '#fef2f2', borderRadius: 2, p: 1.5,
              border: '1px solid #fecaca', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <AlertTriangle size={14} color="#dc2626" />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#dc2626' }}>
                  Motivo del rechazo *
                </Typography>
              </Box>
              <TextField
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                multiline minRows={2} maxRows={4}
                placeholder="Describe brevemente por qué se rechaza el lote..."
                fullWidth size="small"
                error={motivoRequerido}
                helperText={motivoRequerido ? 'El motivo es obligatorio para rechazar' : ' '}
                InputProps={{ sx: { ...inputSx, backgroundColor: '#fff', fontSize: '0.82rem' } }}
                FormHelperTextProps={{ sx: { fontSize: '0.65rem', mx: 0 } }}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1, borderTop: '1px solid #f1f5f9' }}>
        <Button onClick={onClose} startIcon={<X size={14} />} size="small"
          sx={{ borderRadius: 2, textTransform: 'none', color: '#64748b' }}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={guardar} disabled={guard || motivoRequerido}
          startIcon={guard ? null : <Check size={14} />} size="small"
          sx={{ background: `linear-gradient(135deg,#1e1b4b,${cfg.color})`, borderRadius: 2,
            textTransform: 'none', fontWeight: 700, px: 2.5,
            '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' } }}>
          {guard ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

function EtapaDialogSelector({ fp, index, lote, open, onClose, onActualizar, onUpdateLote, ordenados }) {
  if (!fp) return null
  const nombre = fp.etapas_proceso?.nombre || ''
  const fechaAnteriorReal = index > 0 ? ordenados[index - 1]?.fecha_actual : null
  const props = { fp, lote, open, onClose, onGuardar: onActualizar, onUpdateLote }
  if (nombre === 'Insumos')                               return <Dialog1 {...props} />
  if (nombre === 'Producción de Granel')                  return <Dialog2 {...props} />
  if (nombre === 'Graneles UA')                           return <Dialog3 {...props} />
  if (nombre === 'Producción Acondicionamiento Prim/Sec') return <Dialog4 {...props} />
  if (nombre === 'Laboratorio')                           return <Dialog5 {...props} fechaAnteriorReal={fechaAnteriorReal} />
  if (nombre === 'Liberación')                            return <Dialog6 {...props} />
  return null
}

// ═══ Card visual de etapa (click → abre dialog) ═══
function EtapaCard({ fp, index, onClick }) {
  const nombre = fp.etapas_proceso?.nombre || `Etapa ${index + 1}`
  const cfg    = getCfg(nombre)
  const Icon   = cfg.icon
  const estado = getEstado(fp.fecha_plan, fp.fecha_actual)

  return (
    <Box onClick={() => onClick(fp, index)} sx={{
      minWidth: 220, maxWidth: 220, flexShrink: 0,
      borderRadius: 3, overflow: 'hidden', cursor: 'pointer',
      border: '1.5px solid #e2e8f0', backgroundColor: '#fff',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
      transition: 'all 0.2s ease',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 10px 24px ${cfg.color}30`, borderColor: cfg.color },
    }}>
      <Box sx={{ background: `linear-gradient(135deg,${cfg.grad[0]},${cfg.grad[1]})`,
        px: 1.5, py: 1.2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color="#fff" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)',
            textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Etapa {String(index + 1).padStart(2,'0')}
          </Typography>
          <Typography sx={{ fontSize: '0.76rem', fontWeight: 800, color: '#fff', lineHeight: 1.15,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {nombre}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ p: 1.8, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Plan</Typography>
          <Typography sx={{ fontSize: '0.7rem', fontFamily: 'monospace',
            color: fp.fecha_plan ? '#475569' : '#cbd5e1',
            fontStyle: fp.fecha_plan ? 'normal' : 'italic' }}>
            {formatFecha(fp.fecha_plan) || '—'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.58rem', color: cfg.color, fontWeight: 700, textTransform: 'uppercase' }}>Real</Typography>
          <Typography sx={{ fontSize: '0.7rem', fontFamily: 'monospace',
            fontWeight: fp.fecha_actual ? 700 : 400,
            color: fp.fecha_actual ? cfg.color : '#cbd5e1',
            fontStyle: fp.fecha_actual ? 'normal' : 'italic' }}>
            {formatFecha(fp.fecha_actual) || '—'}
          </Typography>
        </Box>
        {fp.cantidad_actual != null && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderTop: '1px dashed #e2e8f0', pt: 0.6 }}>
            <Typography sx={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Cant.</Typography>
            <Typography sx={{ fontSize: '0.72rem', fontFamily: 'monospace', fontWeight: 700, color: '#1e293b' }}>
              {fp.cantidad_actual.toLocaleString('en-US')}
            </Typography>
          </Box>
        )}
        <Box sx={{ backgroundColor: estado.bg, borderRadius: 1.5, py: 0.6,
          display: 'flex', justifyContent: 'center', mt: 0.5 }}>
          <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: estado.color,
            textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {estado.label}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
export function VSMFlow({ lote, fechasProceso, etapas, onActualizar, onUpdateLote, onVolver, onShowHistory, historialCount, dashStats }) {
  const [etapaAbierta, setEtapaAbierta] = useState(null)
  const [indexAbierto, setIndexAbierto] = useState(0)

  const ordenados = [...fechasProceso].sort((a, b) => (a.etapas_proceso?.orden || 0) - (b.etapas_proceso?.orden || 0))
  const hechas = dashStats.completados + dashStats.fueraDePlan
  const pct = ordenados.length > 0 ? Math.round((hechas / ordenados.length) * 100) : 0

  const statCards = [
    { label: 'Etapas',      value: dashStats.total,       color: '#7C3AED', Icon: Layers },
    { label: 'Completadas', value: dashStats.completados, color: '#16a34a', Icon: CheckCircle2 },
    { label: 'Fuera plan',  value: dashStats.fueraDePlan, color: '#dc2626', Icon: XCircle },
    { label: 'Atrasadas',   value: dashStats.atrasados,   color: '#d97706', Icon: AlertTriangle },
    { label: 'Pendientes',  value: dashStats.pendientes,  color: '#D946EF', Icon: Clock },
  ]

  return (
    <Box sx={{ p: 4 }}>

      <Box sx={{ backgroundColor: '#fff', borderRadius: 3, border: '1.5px solid #e2e8f0', p: 2.5, mb: 3,
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ width: 48, height: 48, borderRadius: 2,
            background: 'linear-gradient(135deg,#4C1D95,#7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={22} color="#fff" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: '#7C3AED',
              fontFamily: 'monospace', lineHeight: 1.1 }}>
              {lote.lote}
            </Typography>
            <Typography sx={{ fontSize: '0.85rem', color: '#475569', mt: 0.2 }}>
              {lote.producto || 'Sin producto'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {statCards.map(s => (
              <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.6,
                backgroundColor: '#fff', border: `1px solid ${s.color}30`, borderRadius: 2, px: 1.2, py: 0.5 }}>
                <s.Icon size={12} color={s.color} />
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</Typography>
                <Typography sx={{ fontSize: '0.56rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.3 }}>{s.label}</Typography>
              </Box>
            ))}
          </Box>

          <Tooltip title="Ver historial">
            <Badge badgeContent={historialCount} color="error" max={99}>
              <Button size="small" startIcon={<History size={14} />} onClick={onShowHistory} variant="outlined"
                sx={{ color: '#475569', borderColor: '#e2e8f0', textTransform: 'none', fontSize: '0.78rem',
                  '&:hover': { color: '#7C3AED', borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' } }}>
                Historial
              </Button>
            </Badge>
          </Tooltip>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2 }}>
          <Box sx={{ flex: 1, height: 6, backgroundColor: '#EDE9FE', borderRadius: 99, overflow: 'hidden' }}>
            <Box sx={{ height: '100%', width: `${pct}%`, borderRadius: 99,
              background: pct === 100 ? 'linear-gradient(90deg,#16a34a,#4ade80)' : 'linear-gradient(90deg,#7C3AED,#D946EF)',
              transition: 'width 0.6s ease' }} />
          </Box>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 800,
            color: pct === 100 ? '#16a34a' : '#7C3AED', minWidth: 38 }}>
            {pct}%
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Layers size={16} color="#7C3AED" />
        <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#3B0764',
          textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Proceso de Fabricación
        </Typography>
        <Box sx={{ flex: 1, height: 1, backgroundColor: '#E9D5FF' }} />
        <Typography sx={{ fontSize: '0.7rem', color: '#7C3AED', fontWeight: 700 }}>
          {ordenados.length} etapas · click en card para editar · desliza →
        </Typography>
      </Box>

      <Box sx={{
        overflowX: 'auto', overflowY: 'visible',
        pb: 2, pt: 0.5,
        '&::-webkit-scrollbar': { height: 8 },
        '&::-webkit-scrollbar-thumb': { backgroundColor: '#C4B5FD', borderRadius: 4 },
        '&::-webkit-scrollbar-track': { backgroundColor: '#F5F3FF' },
      }}>
        <Box sx={{ display: 'flex', gap: 2, minWidth: 'min-content' }}>
          {ordenados.map((fp, i) => (
            <EtapaCard key={fp.id} fp={fp} index={i}
              onClick={(fp, idx) => { setEtapaAbierta(fp); setIndexAbierto(idx) }} />
          ))}
        </Box>
      </Box>

      <EtapaDialogSelector
         fp={etapaAbierta} index={indexAbierto} open={!!etapaAbierta}
         lote={lote}
         onClose={() => setEtapaAbierta(null)}
         ordenados={ordenados}
         onUpdateLote={onUpdateLote}
         onActualizar={async (id, etapaId, plan, fecha, cantidad, exp) => {
         await onActualizar(id, etapaId, plan, fecha, cantidad, exp)
         setEtapaAbierta(null)
  }} />
    </Box>
  )
}
import { useState } from 'react'
import {
  Box, Typography, Button, Dialog,
  DialogContent, DialogActions, TextField, IconButton,
  Badge, Tooltip, Table, TableBody, TableCell, TableRow
} from '@mui/material'
import {
  Lock, Check, X,
  AlertTriangle, CheckCircle2, Clock, Ban,
  Package, FlaskConical, Beaker, Factory,
  Microscope, BadgeCheck, User, FileText,
  History, ArrowLeft, Layers, XCircle, Truck
} from 'lucide-react'
import { format, parseISO, differenceInDays, addDays } from 'date-fns'
import { es } from 'date-fns/locale'

const HOY = new Date('2026-05-13T00:00:00')

const ETAPAS_CONFIG = {
  'Insumos':                                   { icon: Package,      color: '#7C3AED', grad: ['#4c1d95','#7c3aed'], num: 1, dias: 0 },
  'Producción de Granel':                      { icon: FlaskConical, color: '#0891b2', grad: ['#164e63','#0891b2'], num: 2, dias: 1 },
  'Graneles UA':                               { icon: Beaker,       color: '#059669', grad: ['#064e3b','#059669'], num: 3, dias: 0 },
  'Producción Acondicionamiento Prim/Sec':     { icon: Factory,      color: '#d97706', grad: ['#78350f','#d97706'], num: 4, dias: 1 },
  'Laboratorio':                               { icon: Microscope,   color: '#dc2626', grad: ['#7f1d1d','#dc2626'], num: 5, dias: 7 },
  'Liberación':                                { icon: BadgeCheck,   color: '#16a34a', grad: ['#14532d','#16a34a'], num: 6, dias: 1 },
}

function getCfg(nombre) {
  return ETAPAS_CONFIG[nombre] || { icon: Package, color: '#6366f1', grad: ['#1e1b4b','#6366f1'], num: 0, dias: 0 }
}

function formatFecha(iso) {
  if (!iso) return null
  try { return format(parseISO(iso), 'dd/MMM/yy', { locale: es }).toUpperCase() }
  catch { return iso }
}

function getEstado(fechaPlan, fechaActual) {
  if (fechaActual && fechaPlan) {
    const diff = differenceInDays(parseISO(fechaActual), parseISO(fechaPlan))
    if (diff > 0) return { key: 'tarde', color: '#ef4444', bg: '#fef2f2', label: 'Fuera de plan' }
    return { key: 'completado', color: '#16a34a', bg: '#f0fdf4', label: 'Completado' }
  }
  if (fechaActual) return { key: 'completado', color: '#16a34a', bg: '#f0fdf4', label: 'Completado' }
  if (!fechaPlan)  return { key: 'sin_fecha',  color: '#94a3b8', bg: '#f8fafc', label: 'Sin fecha' }
  const plan = parseISO(fechaPlan); const hoy = new Date(HOY); hoy.setHours(0,0,0,0)
  if (plan < hoy)  return { key: 'atrasado',   color: '#f59e0b', bg: '#fffbeb', label: 'Atrasado' }
  if (plan.toDateString() === hoy.toDateString()) return { key: 'hoy', color: '#f59e0b', bg: '#fffbeb', label: 'Hoy' }
  return { key: 'programado', color: '#6366f1', bg: '#eef2ff', label: 'Programado' }
}

function isBloqueada(index, ordenados) { return index > 0 && !ordenados[index - 1]?.fecha_actual }
function isBloqueada30(fp) { return !!fp.fecha_actual && differenceInDays(HOY, parseISO(fp.fecha_actual)) >= 30 }

// ── Helpers ──
function FRow({ label, children, locked }) {
  return (
    <TableRow>
      <TableCell sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4, width: '38%', backgroundColor: '#fafafa', borderRight: '1px solid #f1f5f9', py: 1.2, px: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>{label}{locked && <Lock size={10} color="#cbd5e1" />}</Box>
      </TableCell>
      <TableCell sx={{ py: 1, px: 1.5 }}>{children}</TableCell>
    </TableRow>
  )
}
function FInput({ value, onChange, type = 'text', placeholder, disabled }) {
  return <TextField value={value} onChange={e => onChange(e.target.value)} type={type} placeholder={placeholder} fullWidth size="small" disabled={disabled} InputProps={{ sx: { borderRadius: 2, fontSize: '0.82rem', backgroundColor: disabled ? '#f8fafc' : '#fff' } }} />
}
function FDate({ value, onChange, disabled, helperText }) {
  return <TextField type="date" value={value} onChange={e => onChange(e.target.value)} fullWidth size="small" disabled={disabled} helperText={helperText} InputLabelProps={{ shrink: true }} InputProps={{ sx: { borderRadius: 2, fontSize: '0.82rem', backgroundColor: disabled ? '#f8fafc' : '#fff' } }} FormHelperTextProps={{ sx: { fontSize: '0.6rem', color: '#94a3b8' } }} />
}
function PlanBloqueado({ fecha }) {
  return <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', borderRadius: 2, px: 1.5, py: 0.8, border: '1px solid #e2e8f0' }}><Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', fontFamily: 'monospace' }}>{formatFecha(fecha)}</Typography><Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}><Lock size={10} color="#94a3b8" /><Typography sx={{ fontSize: '0.58rem', color: '#94a3b8' }}>bloqueada</Typography></Box></Box>
}
function DesfaseAlert({ editFecha, fechaPlan }) {
  if (!editFecha || !fechaPlan) return null
  const diff = differenceInDays(parseISO(editFecha), parseISO(fechaPlan))
  const ok = diff <= 0
  return <Box sx={{ borderRadius: 2, px: 1.5, py: 0.8, backgroundColor: ok ? '#f0fdf4' : '#fef2f2', border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}`, display: 'flex', alignItems: 'center', gap: 0.8 }}>{ok ? <CheckCircle2 size={13} color="#16a34a" /> : <AlertTriangle size={13} color="#ef4444" />}<Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: ok ? '#16a34a' : '#ef4444' }}>{diff === 0 ? 'En fecha exacta del plan' : diff < 0 ? `${Math.abs(diff)} día${Math.abs(diff)>1?'s':''} antes del plan` : `⚠ ${diff} día${diff>1?'s':''} fuera de plan`}</Typography></Box>
}
function UsuarioRow({ currentUser }) {
  return <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#F5F3FF', borderRadius: 2, px: 1.5, py: 0.8, border: '1px solid #DDD6FE' }}><Box sx={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#D946EF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>{currentUser?.charAt(0)?.toUpperCase() || '?'}</Box><Box><Typography sx={{ fontSize: '0.58rem', color: '#7C3AED', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>Usuario de captura</Typography><Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>{currentUser || '—'}</Typography></Box></Box>
}
function Bloq30() {
  return <Box sx={{ backgroundColor: '#fef2f2', borderRadius: 2, px: 1.5, py: 0.8, border: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 0.8 }}><Ban size={13} color="#ef4444" /><Typography sx={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700 }}>Bloqueado — han pasado 30+ días desde que se completó</Typography></Box>
}
function DialogHeader({ nombre, numero, cfg, estado, onClose }) {
  const Icon = cfg.icon
  return <Box sx={{ background: `linear-gradient(135deg,${cfg.grad[0]},${cfg.grad[1]})`, px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}><Box sx={{ width: 40, height: 40, borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={20} color="#fff" /></Box><Box><Typography sx={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Etapa {String(numero).padStart(2,'0')}</Typography><Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff' }}>{nombre}</Typography></Box></Box><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, px: 1, py: 0.3 }}><Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: '#fff' }}>{estado.label.toUpperCase()}</Typography></Box><IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255,255,255,0.8)' }}><X size={17} /></IconButton></Box></Box>
}
function DialogFooter({ onClose, onGuardar, guardando, disabled, color }) {
  return <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1, borderTop: '1px solid #f1f5f9' }}><Button onClick={onClose} startIcon={<X size={14} />} sx={{ borderRadius: 2, textTransform: 'none', color: '#64748b' }} size="small">Cancelar</Button><Button variant="contained" onClick={onGuardar} disabled={guardando || disabled} startIcon={guardando ? null : <Check size={14} />} size="small" sx={{ background: `linear-gradient(135deg,#1e1b4b,${color})`, borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2.5 }}>{guardando ? 'Guardando...' : 'Guardar'}</Button></DialogActions>
}
const paperSx = { borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }

// ═══ DIALOGS POR ETAPA ═══
function Dialog1({ fp, open, onClose, currentUser, onGuardar, bloq30 }) {
  const tienePlan = !!fp?.fecha_plan; const cfg = getCfg('Insumos'); const estado = getEstado(fp?.fecha_plan, fp?.fecha_actual)
  const [plan, setPlan] = useState(fp?.fecha_plan || ''); const [real, setReal] = useState(fp?.fecha_actual || '')
  const [denG, setDenG] = useState(''); const [conc, setConc] = useState(''); const [ff, setFf] = useState('')
  const [qtyP, setQtyP] = useState(''); const [qtyR, setQtyR] = useState(fp?.cantidad_actual?.toString() || '')
  const [guard, setGuard] = useState(false)
  async function guardar() { setGuard(true); await onGuardar(fp.id, fp.etapa_id, tienePlan ? fp.fecha_plan : plan, real || null, qtyR ? parseInt(qtyR) : null); setGuard(false); onClose() }
  return <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: paperSx }}>
    <DialogHeader nombre="OP Planner" numero={1} cfg={cfg} estado={estado} onClose={onClose} />
    <DialogContent sx={{ p: 0 }}>
      <Table size="small"><TableBody>
        <FRow label="Denominación Genérica"><FInput value={denG} onChange={setDenG} placeholder="Denominación" /></FRow>
        <FRow label="Concentración"><FInput value={conc} onChange={setConc} placeholder="Ej: 600 mg" /></FRow>
        <FRow label="Forma Farmacéutica"><FInput value={ff} onChange={setFf} placeholder="Ej: Tabletas" /></FRow>
        <FRow label="QTY Plan"><FInput value={qtyP} onChange={setQtyP} type="number" /></FRow>
        <FRow label="Fecha Plan" locked>{tienePlan ? <PlanBloqueado fecha={fp.fecha_plan} /> : <FDate value={plan} onChange={setPlan} helperText="⚠ Solo se establece una vez" />}</FRow>
        <FRow label="Fecha Real"><FDate value={real} onChange={setReal} disabled={bloq30} /></FRow>
        <FRow label="QTY Real"><FInput value={qtyR} onChange={setQtyR} type="number" disabled={bloq30} /></FRow>
      </TableBody></Table>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <DesfaseAlert editFecha={real} fechaPlan={fp?.fecha_plan} />
        {bloq30 && <Bloq30 />}<UsuarioRow currentUser={currentUser} />
      </Box>
    </DialogContent>
    <DialogFooter onClose={onClose} onGuardar={guardar} guardando={guard} disabled={bloq30 || (!tienePlan && !plan)} color={cfg.color} />
  </Dialog>
}

function Dialog2({ fp, open, onClose, currentUser, onGuardar, bloq30 }) {
  const tienePlan = !!fp?.fecha_plan; const cfg = getCfg('Producción de Granel'); const estado = getEstado(fp?.fecha_plan, fp?.fecha_actual)
  const [plan, setPlan] = useState(fp?.fecha_plan || ''); const [real, setReal] = useState(fp?.fecha_actual || '')
  const [qty, setQty] = useState(fp?.cantidad_actual?.toString() || ''); const [exp, setExp] = useState(fp?.fecha_exp || '')
  const [guard, setGuard] = useState(false)
  async function guardar() { setGuard(true); await onGuardar(fp.id, fp.etapa_id, tienePlan ? fp.fecha_plan : plan, real || null, qty ? parseInt(qty) : null, exp || null); setGuard(false); onClose() }
  return <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: paperSx }}>
    <DialogHeader nombre="Producción de Granel" numero={2} cfg={cfg} estado={estado} onClose={onClose} />
    <DialogContent sx={{ p: 0 }}>
      <Table size="small"><TableBody>
        <FRow label="Fecha Plan" locked>{tienePlan ? <PlanBloqueado fecha={fp.fecha_plan} /> : <FDate value={plan} onChange={setPlan} helperText="⚠ Solo se establece una vez" />}</FRow>
        <FRow label="Fecha Real"><FDate value={real} onChange={setReal} disabled={bloq30} /></FRow>
        <FRow label="QTY"><FInput value={qty} onChange={setQty} type="number" disabled={bloq30} /></FRow>
        <FRow label="Fecha Exp."><FDate value={exp} onChange={setExp} disabled={bloq30} /></FRow>
      </TableBody></Table>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <DesfaseAlert editFecha={real} fechaPlan={fp?.fecha_plan} />
        {bloq30 && <Bloq30 />}<UsuarioRow currentUser={currentUser} />
      </Box>
    </DialogContent>
    <DialogFooter onClose={onClose} onGuardar={guardar} guardando={guard} disabled={bloq30 || (!tienePlan && !plan)} color={cfg.color} />
  </Dialog>
}

function Dialog3({ fp, open, onClose, currentUser, onGuardar, bloq30 }) {
  const tienePlan = !!fp?.fecha_plan; const cfg = getCfg('Graneles UA'); const estado = getEstado(fp?.fecha_plan, fp?.fecha_actual)
  const [plan, setPlan] = useState(fp?.fecha_plan || ''); const [qtyR, setQtyR] = useState(fp?.cantidad_actual?.toString() || '')
  const [denD, setDenD] = useState(''); const [pres, setPres] = useState(''); const [lot, setLot] = useState('')
  const [tam, setTam] = useState(''); const [denG, setDenG] = useState(''); const [conc, setConc] = useState('')
  const [ff, setFf] = useState(''); const [qtyP, setQtyP] = useState(''); const [guard, setGuard] = useState(false)
  async function guardar() { setGuard(true); await onGuardar(fp.id, fp.etapa_id, tienePlan ? fp.fecha_plan : plan, null, qtyR ? parseInt(qtyR) : null); setGuard(false); onClose() }
  return <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: paperSx }}>
    <DialogHeader nombre="Planner OA" numero={3} cfg={cfg} estado={estado} onClose={onClose} />
    <DialogContent sx={{ p: 0 }}>
      <Table size="small"><TableBody>
        <FRow label="Denominación Distintiva"><FInput value={denD} onChange={setDenD} /></FRow>
        <FRow label="Presentación"><FInput value={pres} onChange={setPres} /></FRow>
        <FRow label="Lote"><FInput value={lot} onChange={setLot} /></FRow>
        <FRow label="Fecha Plan" locked>{tienePlan ? <PlanBloqueado fecha={fp.fecha_plan} /> : <FDate value={plan} onChange={setPlan} helperText="⚠ Solo se establece una vez" />}</FRow>
        <FRow label="Tamaño"><FInput value={tam} onChange={setTam} /></FRow>
        <FRow label="Denominación Genérica"><FInput value={denG} onChange={setDenG} /></FRow>
        <FRow label="Concentración"><FInput value={conc} onChange={setConc} /></FRow>
        <FRow label="Forma Farmacéutica"><FInput value={ff} onChange={setFf} /></FRow>
        <FRow label="QTY Plan"><FInput value={qtyP} onChange={setQtyP} type="number" /></FRow>
        <FRow label="QTY Real"><FInput value={qtyR} onChange={setQtyR} type="number" disabled={bloq30} /></FRow>
      </TableBody></Table>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>{bloq30 && <Bloq30 />}<UsuarioRow currentUser={currentUser} /></Box>
    </DialogContent>
    <DialogFooter onClose={onClose} onGuardar={guardar} guardando={guard} disabled={bloq30 || (!tienePlan && !plan)} color={cfg.color} />
  </Dialog>
}

function Dialog4({ fp, open, onClose, currentUser, onGuardar, bloq30 }) {
  const tienePlan = !!fp?.fecha_plan; const cfg = getCfg('Producción Acondicionamiento Prim/Sec'); const estado = getEstado(fp?.fecha_plan, fp?.fecha_actual)
  const [plan, setPlan] = useState(fp?.fecha_plan || ''); const [real, setReal] = useState(fp?.fecha_actual || '')
  const [qty, setQty] = useState(fp?.cantidad_actual?.toString() || ''); const [exp, setExp] = useState(fp?.fecha_exp || '')
  const [guard, setGuard] = useState(false)
  async function guardar() { setGuard(true); await onGuardar(fp.id, fp.etapa_id, tienePlan ? fp.fecha_plan : plan, real || null, qty ? parseInt(qty) : null, exp || null); setGuard(false); onClose() }
  return <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: paperSx }}>
    <DialogHeader nombre="Producción Acondicionamiento Prim/Sec" numero={4} cfg={cfg} estado={estado} onClose={onClose} />
    <DialogContent sx={{ p: 0 }}>
      <Table size="small"><TableBody>
        <FRow label="Fecha Plan" locked>{tienePlan ? <PlanBloqueado fecha={fp.fecha_plan} /> : <FDate value={plan} onChange={setPlan} helperText="⚠ Solo se establece una vez" />}</FRow>
        <FRow label="Fecha Real"><FDate value={real} onChange={setReal} disabled={bloq30} /></FRow>
        <FRow label="QTY"><FInput value={qty} onChange={setQty} type="number" disabled={bloq30} /></FRow>
        <FRow label="Fecha Exp."><FDate value={exp} onChange={setExp} disabled={bloq30} /></FRow>
      </TableBody></Table>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <DesfaseAlert editFecha={real} fechaPlan={fp?.fecha_plan} />
        {bloq30 && <Bloq30 />}<UsuarioRow currentUser={currentUser} />
      </Box>
    </DialogContent>
    <DialogFooter onClose={onClose} onGuardar={guardar} guardando={guard} disabled={bloq30 || (!tienePlan && !plan)} color={cfg.color} />
  </Dialog>
}

function Dialog5({ fp, open, onClose, currentUser, onGuardar, bloq30, fechaAnteriorReal }) {
  const tienePlan = !!fp?.fecha_plan; const cfg = getCfg('Laboratorio'); const estado = getEstado(fp?.fecha_plan, fp?.fecha_actual)
  function calcDefault() { if (tienePlan) return fp.fecha_plan; if (fechaAnteriorReal) { try { return format(addDays(parseISO(fechaAnteriorReal), 7), 'yyyy-MM-dd') } catch { return '' } } return '' }
  const [plan, setPlan] = useState(calcDefault); const [real, setReal] = useState(fp?.fecha_actual || '')
  const [guard, setGuard] = useState(false)
  const circulos = ['E','F','G','H','I','J','K','L']
  async function guardar() { setGuard(true); await onGuardar(fp.id, fp.etapa_id, tienePlan ? fp.fecha_plan : plan, real || null, null); setGuard(false); onClose() }
  return <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: paperSx }}>
    <DialogHeader nombre="Laboratorio" numero={5} cfg={cfg} estado={estado} onClose={onClose} />
    <DialogContent sx={{ p: 0 }}>
      <Box sx={{ display: 'flex', gap: 1, px: 2.5, pt: 2, pb: 1, flexWrap: 'wrap' }}>
        {circulos.map(l => <Box key={l} sx={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg,${cfg.grad[0]},${cfg.grad[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff' }}>{l}</Typography></Box>)}
      </Box>
      <Table size="small"><TableBody>
        <FRow label="Fecha Plan (≈7 días)" locked>{tienePlan ? <PlanBloqueado fecha={fp.fecha_plan} /> : <FDate value={plan} onChange={setPlan} helperText="Default: real anterior + 7 días" />}</FRow>
        <FRow label="Fecha Real"><FDate value={real} onChange={setReal} disabled={bloq30} /></FRow>
      </TableBody></Table>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <DesfaseAlert editFecha={real} fechaPlan={fp?.fecha_plan || plan} />
        <Box sx={{ backgroundColor: '#fffbeb', borderRadius: 2, px: 1.5, py: 0.8, border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 0.8 }}><Clock size={13} color="#d97706" /><Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#d97706' }}>PLT de laboratorio: 7 días hábiles</Typography></Box>
        {bloq30 && <Bloq30 />}<UsuarioRow currentUser={currentUser} />
      </Box>
    </DialogContent>
    <DialogFooter onClose={onClose} onGuardar={guardar} guardando={guard} disabled={bloq30 || (!tienePlan && !plan)} color={cfg.color} />
  </Dialog>
}

function Dialog6({ fp, open, onClose, currentUser, onGuardar, bloq30 }) {
  const tienePlan = !!fp?.fecha_plan; const cfg = getCfg('Liberación'); const estado = getEstado(fp?.fecha_plan, fp?.fecha_actual)
  const [plan, setPlan] = useState(fp?.fecha_plan || ''); const [real, setReal] = useState(fp?.fecha_actual || '')
  const [qty, setQty] = useState(fp?.cantidad_actual?.toString() || ''); const [guard, setGuard] = useState(false)
  const [accion, setAccion] = useState(null)
  async function guardar() { setGuard(true); await onGuardar(fp.id, fp.etapa_id, tienePlan ? fp.fecha_plan : plan, real || null, qty ? parseInt(qty) : null); setGuard(false); onClose() }
  return <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: paperSx }}>
    <DialogHeader nombre="Liberación" numero={6} cfg={cfg} estado={estado} onClose={onClose} />
    <DialogContent sx={{ p: 0 }}>
      <Table size="small"><TableBody>
        <FRow label="Fecha Plan" locked>{tienePlan ? <PlanBloqueado fecha={fp.fecha_plan} /> : <FDate value={plan} onChange={setPlan} helperText="⚠ Solo se establece una vez" />}</FRow>
        <FRow label="Fecha Real"><FDate value={real} onChange={setReal} disabled={bloq30} /></FRow>
        <FRow label="QTY"><FInput value={qty} onChange={setQty} type="number" disabled={bloq30} /></FRow>
      </TableBody></Table>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <DesfaseAlert editFecha={real} fechaPlan={fp?.fecha_plan} />
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
          <Button variant={accion === 'aprobar' ? 'contained' : 'outlined'} startIcon={<CheckCircle2 size={15} />} onClick={() => setAccion(accion === 'aprobar' ? null : 'aprobar')} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, ...(accion === 'aprobar' ? { backgroundColor: '#16a34a', '&:hover': { backgroundColor: '#15803d' } } : { color: '#16a34a', borderColor: '#bbf7d0', '&:hover': { backgroundColor: '#f0fdf4', borderColor: '#16a34a' } }) }}>Aprobar</Button>
          <Button variant={accion === 'rechazar' ? 'contained' : 'outlined'} startIcon={<X size={15} />} onClick={() => setAccion(accion === 'rechazar' ? null : 'rechazar')} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, ...(accion === 'rechazar' ? { backgroundColor: '#dc2626', '&:hover': { backgroundColor: '#b91c1c' } } : { color: '#dc2626', borderColor: '#fecaca', '&:hover': { backgroundColor: '#fef2f2', borderColor: '#dc2626' } }) }}>Rechazar</Button>
        </Box>
        {accion === 'aprobar' && <Box sx={{ backgroundColor: '#f0fdf4', borderRadius: 2, px: 1.5, py: 1, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 0.8 }}><BadgeCheck size={14} color="#16a34a" /><Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a' }}>Al guardar, la QTY se sumará al inventario · PLT = 9 días</Typography></Box>}
        {bloq30 && <Bloq30 />}<UsuarioRow currentUser={currentUser} />
      </Box>
    </DialogContent>
    <DialogFooter onClose={onClose} onGuardar={guardar} guardando={guard} disabled={bloq30 || (!tienePlan && !plan)} color={cfg.color} />
  </Dialog>
}

function EtapaDialogSelector({ fp, index, open, onClose, currentUser, onActualizar, ordenados }) {
  if (!fp) return null
  const nombre = fp.etapas_proceso?.nombre || ''
  const bloq30 = isBloqueada30(fp)
  const fechaAnteriorReal = index > 0 ? ordenados[index - 1]?.fecha_actual : null
  const props = { fp, open, onClose, currentUser, onGuardar: onActualizar, bloq30 }
  if (nombre === 'Insumos')                               return <Dialog1 {...props} />
  if (nombre === 'Producción de Granel')                  return <Dialog2 {...props} />
  if (nombre === 'Graneles UA')                           return <Dialog3 {...props} />
  if (nombre === 'Producción Acondicionamiento Prim/Sec') return <Dialog4 {...props} />
  if (nombre === 'Laboratorio')                           return <Dialog5 {...props} fechaAnteriorReal={fechaAnteriorReal} />
  if (nombre === 'Liberación')                            return <Dialog6 {...props} />
  return null
}

// ── Tarjeta de etapa (dentro del recuadro morado) ──
function EtapaCard({ fp, index, ordenados, onClick }) {
  const bloqueada = isBloqueada(index, ordenados)
  const estado    = getEstado(fp.fecha_plan, fp.fecha_actual)
  const nombre    = fp.etapas_proceso?.nombre || `Etapa ${index + 1}`
  const cfg       = getCfg(nombre)
  const Icon      = cfg.icon

  return (
    <Box onClick={() => !bloqueada && onClick(fp, index)} sx={{
      width: 155, borderRadius: '12px', overflow: 'hidden',
      cursor: bloqueada ? 'not-allowed' : 'pointer',
      border: `2px solid ${bloqueada ? '#e2e8f0' : cfg.color}`,
      backgroundColor: '#fff',
      boxShadow: bloqueada ? 'none' : `0 4px 14px ${cfg.color}25`,
      opacity: bloqueada ? 0.55 : 1,
      transition: 'all 0.2s ease',
      '&:hover': bloqueada ? {} : { transform: 'translateY(-4px)', boxShadow: `0 10px 24px ${cfg.color}40` },
    }}>
      {/* Header con color */}
      <Box sx={{ background: `linear-gradient(135deg,${cfg.grad[0]},${cfg.color})`, px: 1.2, py: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
        <Box sx={{ width: 26, height: 26, borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {bloqueada ? <Lock size={13} color="#fff" /> : <Icon size={13} color="#fff" />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.5rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Etapa {String(index + 1).padStart(2,'0')}</Typography>
          <Typography sx={{ fontSize: '0.66rem', fontWeight: 800, color: '#fff', lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{nombre}</Typography>
        </Box>
      </Box>

      {/* Body con fechas */}
      <Box sx={{ p: 1.2, display: 'flex', flexDirection: 'column', gap: 0.6 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.52rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Plan</Typography>
          <Typography sx={{ fontSize: '0.62rem', fontFamily: 'monospace', color: fp.fecha_plan ? '#475569' : '#cbd5e1', fontStyle: fp.fecha_plan ? 'normal' : 'italic' }}>{formatFecha(fp.fecha_plan) || '—'}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.52rem', color: cfg.color, fontWeight: 700, textTransform: 'uppercase' }}>Real</Typography>
          <Typography sx={{ fontSize: '0.62rem', fontFamily: 'monospace', fontWeight: fp.fecha_actual ? 700 : 400, color: fp.fecha_actual ? cfg.color : '#cbd5e1', fontStyle: fp.fecha_actual ? 'normal' : 'italic' }}>{formatFecha(fp.fecha_actual) || '—'}</Typography>
        </Box>
        <Box sx={{ backgroundColor: estado.bg, borderRadius: 1, py: 0.3, mt: 0.3, display: 'flex', justifyContent: 'center' }}>
          <Typography sx={{ fontSize: '0.5rem', fontWeight: 800, color: estado.color, textTransform: 'uppercase', letterSpacing: 0.4 }}>{bloqueada ? 'BLOQUEADA' : estado.label}</Typography>
        </Box>
      </Box>
    </Box>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════
export function VSMFlow({ lote, fechasProceso, etapas, currentUser, onActualizar, onVolver, onShowHistory, historialCount, dashStats }) {
  const [etapaAbierta, setEtapaAbierta] = useState(null)
  const [indexAbierto, setIndexAbierto] = useState(0)

  const ordenados = [...fechasProceso].sort((a, b) => (a.etapas_proceso?.orden || 0) - (b.etapas_proceso?.orden || 0))
  const completadas = ordenados.filter(fp => fp.fecha_actual).length
  const pct = ordenados.length > 0 ? Math.round((completadas / ordenados.length) * 100) : 0

  const statCards = [
    { label: 'Etapas',      value: dashStats.total,       color: '#7C3AED', icon: Layers },
    { label: 'Completadas', value: dashStats.completados, color: '#16a34a', icon: CheckCircle2 },
    { label: 'Fuera plan',  value: dashStats.fueraDePlan, color: '#dc2626', icon: XCircle },
    { label: 'Atrasadas',   value: dashStats.atrasados,   color: '#d97706', icon: AlertTriangle },
    { label: 'Pendientes',  value: dashStats.pendientes,  color: '#D946EF', icon: Clock },
  ]

  return (
    <Box sx={{ backgroundColor: '#fff', pb: 4 }}>

      {/* Barra del lote */}
      <Box sx={{ px: 4, py: 1.5, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', backgroundColor: '#fafafa', borderBottom: '1px solid #f1f5f9' }}>
        <Button size="small" startIcon={<ArrowLeft size={14} />} onClick={onVolver}
          sx={{ color: '#64748b', textTransform: 'none', fontSize: '0.78rem', borderRadius: 2, border: '1px solid #e2e8f0', px: 1.5, backgroundColor: '#fff', '&:hover': { color: '#7C3AED', borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' } }}>
          Lotes
        </Button>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem', color: '#7C3AED' }}>{lote.lote}</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lote.producto}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.4 }}>
            <Box sx={{ flex: 1, maxWidth: 200, height: 4, backgroundColor: '#EDE9FE', borderRadius: 99, overflow: 'hidden' }}>
              <Box sx={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: pct === 100 ? 'linear-gradient(90deg,#16a34a,#4ade80)' : 'linear-gradient(90deg,#7C3AED,#D946EF)', transition: 'width 0.6s ease' }} />
            </Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: pct === 100 ? '#16a34a' : '#7C3AED' }}>{pct}%</Typography>
          </Box>
        </Box>

        {/* Stats compactas */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {statCards.map(s => { const Icon = s.icon
            return <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.6, backgroundColor: '#fff', border: `1px solid ${s.color}30`, borderRadius: 2, px: 1.2, py: 0.5 }}>
              <Icon size={12} color={s.color} />
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</Typography>
              <Typography sx={{ fontSize: '0.56rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.3 }}>{s.label}</Typography>
            </Box> })}
        </Box>

        <Tooltip title="Ver historial">
          <Badge badgeContent={historialCount} color="error" max={99}>
            <Button size="small" startIcon={<History size={14} />} onClick={onShowHistory} variant="outlined"
              sx={{ color: '#64748b', borderColor: '#e2e8f0', textTransform: 'none', fontSize: '0.75rem', borderRadius: 2, backgroundColor: '#fff', '&:hover': { color: '#7C3AED', borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' } }}>
              Historial
            </Button>
          </Badge>
        </Tooltip>
      </Box>

      {/* ═══ RECUADRO MORADO con flujo ondulado ═══ */}
      <Box sx={{ px: 4, pt: 3 }}>
        <Box sx={{
          borderRadius: '12px',
          border: '3px solid #C084FC',
          backgroundColor: '#fff',
          boxShadow: '0 4px 24px rgba(192,132,252,0.15)',
          overflow: 'hidden',
        }}>
          {/* Título del proceso */}
          <Box sx={{ background: 'linear-gradient(90deg,#F5F3FF,#FDF4FF)', px: 3, py: 1.5, borderBottom: '2px solid #E9D5FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Layers size={16} color="#7C3AED" />
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#3B0764', letterSpacing: 0.3, textTransform: 'uppercase' }}>
                Proceso de Fabricación
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.7rem', color: '#7C3AED', fontWeight: 700 }}>
              PLT TOTAL · 9 DÍAS HÁBILES
            </Typography>
          </Box>

          {/* Flujo ondulado */}
          <Box sx={{ overflowX: 'auto', backgroundColor: '#fff' }}>
            <Box sx={{ position: 'relative', minWidth: `${ordenados.length * 200 + 200}px`, height: 420, px: 4, py: 2 }}>

              {/* Río SVG */}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="riverGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"  stopColor="#C084FC" stopOpacity="0.2" />
                    <stop offset="50%" stopColor="#7C3AED" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#C084FC" stopOpacity="0.2" />
                  </linearGradient>
                </defs>
                <path d={`M 50,210
                         C 200,80 300,340 480,210
                         S 720,80 900,210
                         S 1140,340 1320,210
                         S 1560,80 1740,210`}
                      stroke="url(#riverGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>

              {/* Nodos del flujo */}
              <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', height: '100%', gap: 0 }}>

                {/* Nodo INICIO (fábrica) */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 1, flexShrink: 0 }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: '14px', background: 'linear-gradient(135deg,#475569,#1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(30,41,59,0.3)' }}>
                    <Factory size={24} color="#fff" />
                  </Box>
                  <Typography sx={{ fontSize: '0.58rem', color: '#475569', mt: 0.8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>Fabricación</Typography>
                </Box>

                {/* Etapas alternando arriba/abajo */}
                {ordenados.map((fp, i) => {
                  const esArriba = i % 2 === 0
                  const cfg = getCfg(fp.etapas_proceso?.nombre || '')
                  return (
                    <Box key={fp.id} sx={{ position: 'relative', width: 190, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {esArriba ? (
                        <Box sx={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <EtapaCard fp={fp} index={i} ordenados={ordenados} onClick={(fp, idx) => { setEtapaAbierta(fp); setIndexAbierto(idx) }} />
                          <Box sx={{ width: 2, height: 32, background: `linear-gradient(180deg,${cfg.color}80,transparent)` }} />
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: cfg.color, border: '3px solid #fff', boxShadow: `0 0 0 2px ${cfg.color}50` }} />
                        </Box>
                      ) : (
                        <Box sx={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: cfg.color, border: '3px solid #fff', boxShadow: `0 0 0 2px ${cfg.color}50` }} />
                          <Box sx={{ width: 2, height: 32, background: `linear-gradient(180deg,transparent,${cfg.color}80)` }} />
                          <EtapaCard fp={fp} index={i} ordenados={ordenados} onClick={(fp, idx) => { setEtapaAbierta(fp); setIndexAbierto(idx) }} />
                        </Box>
                      )}
                    </Box>
                  )
                })}

                {/* Nodo META (camión) */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ml: 1, flexShrink: 0 }}>
                  <Box sx={{ width: 56, height: 56, borderRadius: '14px',
                    background: pct === 100 ? 'linear-gradient(135deg,#16a34a,#22c55e)' : 'linear-gradient(135deg,#cbd5e1,#94a3b8)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: pct === 100 ? '0 4px 14px rgba(22,163,74,0.35)' : '0 2px 8px rgba(148,163,184,0.2)' }}>
                    <Truck size={24} color="#fff" />
                  </Box>
                  <Typography sx={{ fontSize: '0.58rem', color: pct === 100 ? '#16a34a' : '#94a3b8', mt: 0.8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {pct === 100 ? 'Liberado' : 'Meta'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ═══ TIMELINE EJEMPLO (estilo Visio) ═══ */}
      <Box sx={{ px: 4, pt: 3 }}>
        <Box sx={{ borderRadius: '12px', border: '1.5px solid #e2e8f0', backgroundColor: '#fafafa', p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <CheckCircle2 size={14} color="#7C3AED" />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#3B0764', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Línea de Tiempo · Seguimiento del Lote
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'stretch', overflowX: 'auto', gap: 0 }}>
            {/* Producto inicial */}
            <Box sx={{ minWidth: 130, p: 1.2, backgroundColor: '#1e293b', borderRadius: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', flexShrink: 0 }}>
              <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Producto</Typography>
              <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#fff', mt: 0.2 }}>{lote.lote}</Typography>
              <Typography sx={{ fontSize: '0.58rem', color: '#cbd5e1', mt: 0.3, lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{lote.producto}</Typography>
            </Box>

            {/* Etapas en línea */}
            {ordenados.map((fp, i) => {
              const cfg = getCfg(fp.etapas_proceso?.nombre || '')
              const estado = getEstado(fp.fecha_plan, fp.fecha_actual)
              const completed = !!fp.fecha_actual
              return (
                <Box key={fp.id} sx={{ display: 'flex', alignItems: 'stretch', flexShrink: 0 }}>
                  {/* Flecha */}
                  <Box sx={{ display: 'flex', alignItems: 'center', px: 0.6 }}>
                    <Box sx={{
                      width: 0, height: 0,
                      borderTop: '8px solid transparent', borderBottom: '8px solid transparent',
                      borderLeft: `10px solid ${completed ? cfg.color : '#cbd5e1'}`,
                    }} />
                  </Box>
                  <Box sx={{ minWidth: 140, p: 1.2, backgroundColor: completed ? '#fff' : '#f8fafc',
                    border: `1.5px solid ${completed ? cfg.color + '60' : '#e2e8f0'}`,
                    borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
                    <Typography sx={{ fontSize: '0.58rem', color: cfg.color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                      Etapa {String(i + 1).padStart(2, '0')}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.2, mt: 0.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {fp.etapas_proceso?.nombre}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.6 }}>
                      {completed ? <CheckCircle2 size={11} color="#16a34a" /> : <Clock size={11} color="#94a3b8" />}
                      <Typography sx={{ fontSize: '0.62rem', fontFamily: 'monospace', fontWeight: 700,
                        color: completed ? cfg.color : '#94a3b8',
                        fontStyle: completed ? 'normal' : 'italic' }}>
                        {formatFecha(fp.fecha_actual) || 'Pendiente'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )
            })}

            {/* Meta */}
            <Box sx={{ display: 'flex', alignItems: 'center', px: 0.6 }}>
              <Box sx={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: `10px solid ${pct === 100 ? '#16a34a' : '#cbd5e1'}` }} />
            </Box>
            <Box sx={{ minWidth: 140, p: 1.2,
              background: pct === 100 ? 'linear-gradient(135deg,#16a34a,#22c55e)' : 'linear-gradient(135deg,#e2e8f0,#cbd5e1)',
              borderRadius: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', flexShrink: 0 }}>
              <Truck size={18} color="#fff" style={{ margin: '0 auto' }} />
              <Typography sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.8)', fontWeight: 700, textTransform: 'uppercase', mt: 0.3 }}>Meta</Typography>
              <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff', mt: 0.2 }}>
                {pct === 100 ? 'Liberado' : 'Pendiente'}
              </Typography>
            </Box>
          </Box>

          {/* Resumen abajo */}
          <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px dashed #cbd5e1', display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#16a34a' }} />
              <Typography sx={{ fontSize: '0.65rem', color: '#475569' }}>
                <strong style={{ color: '#16a34a' }}>{dashStats.completados}</strong> completadas
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#dc2626' }} />
              <Typography sx={{ fontSize: '0.65rem', color: '#475569' }}>
                <strong style={{ color: '#dc2626' }}>{dashStats.fueraDePlan}</strong> fuera de plan
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#d97706' }} />
              <Typography sx={{ fontSize: '0.65rem', color: '#475569' }}>
                <strong style={{ color: '#d97706' }}>{dashStats.atrasados}</strong> atrasadas
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }} />
            <Typography sx={{ fontSize: '0.68rem', color: '#7C3AED', fontWeight: 700 }}>
              Avance: {pct}% · {dashStats.completados} de {dashStats.total} etapas
            </Typography>
          </Box>
        </Box>
      </Box>

      <EtapaDialogSelector
        fp={etapaAbierta} index={indexAbierto} open={!!etapaAbierta}
        onClose={() => setEtapaAbierta(null)} currentUser={currentUser}
        ordenados={ordenados}
        onActualizar={async (id, etapaId, plan, fecha, cantidad, exp) => {
          await onActualizar(id, etapaId, plan, fecha, cantidad, exp)
          setEtapaAbierta(null)
        }} />
    </Box>
  )
}
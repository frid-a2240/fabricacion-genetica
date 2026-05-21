import { useState } from 'react'
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, InputAdornment, CircularProgress, IconButton
} from '@mui/material'
import {
  Plus, Search, CheckCircle2, XCircle, AlertTriangle, Clock,
  Package, Factory, Truck, Lock, Layers, X,
  Hash, FileText, Calendar, Beaker
} from 'lucide-react'
import { supabase } from '../lib/supabase.js'

// Paleta de colores que rotan
const LOTE_COLORS = [
  { color: '#7C3AED', grad: ['#4c1d95','#7c3aed'] },
  { color: '#0891b2', grad: ['#164e63','#0891b2'] },
  { color: '#059669', grad: ['#064e3b','#059669'] },
  { color: '#d97706', grad: ['#78350f','#d97706'] },
  { color: '#dc2626', grad: ['#7f1d1d','#dc2626'] },
  { color: '#16a34a', grad: ['#14532d','#16a34a'] },
  { color: '#D946EF', grad: ['#86198f','#d946ef'] },
  { color: '#3b82f6', grad: ['#1e3a8a','#3b82f6'] },
]
function getColorForLote(index) { return LOTE_COLORS[index % LOTE_COLORS.length] }

function getEstatusBadge(lote) {
  if (lote.estatus === 'liberado')  return { label: 'Liberado',  color: '#16a34a', bg: '#f0fdf4', Icon: CheckCircle2 }
  if (lote.estatus === 'cancelado') return { label: 'Cancelado', color: '#dc2626', bg: '#fef2f2', Icon: XCircle }
  if (lote.estatus === 'rechazado') return { label: 'Rechazado', color: '#d97706', bg: '#fffbeb', Icon: AlertTriangle }
  return { label: 'Activo', color: '#7C3AED', bg: '#F5F3FF', Icon: Clock }
}

// ── Tarjeta de lote ──
function LoteCard({ lote, colorCfg, onClick }) {
  const badge = getEstatusBadge(lote)
  const bloqueada = lote.estatus === 'cancelado' || lote.estatus === 'rechazado'

  return (
    <Box onClick={() => !bloqueada && onClick(lote)} sx={{
      width: 230, borderRadius: '14px', overflow: 'hidden',
      cursor: bloqueada ? 'not-allowed' : 'pointer',
      border: `2px solid ${bloqueada ? '#e2e8f0' : colorCfg.color}`,
      backgroundColor: '#fff',
      boxShadow: bloqueada ? 'none' : `0 6px 18px ${colorCfg.color}25`,
      opacity: bloqueada ? 0.55 : 1,
      transition: 'all 0.2s ease',
      '&:hover': bloqueada ? {} : { transform: 'translateY(-6px)', boxShadow: `0 16px 32px ${colorCfg.color}40` },
    }}>
      <Box sx={{ background: `linear-gradient(135deg,${colorCfg.grad[0]},${colorCfg.color})`, px: 1.8, py: 1.4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {bloqueada ? <Lock size={17} color="#fff" /> : <Package size={17} color="#fff" />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Lote</Typography>
          <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff', lineHeight: 1.1, fontFamily: 'monospace' }}>{lote.lote}</Typography>
        </Box>
      </Box>
      <Box sx={{ p: 1.6, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography sx={{ fontSize: '0.78rem', color: '#1e293b', fontWeight: 600, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 38 }}>
          {lote.producto || 'Sin producto'}
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #e2e8f0', pt: 0.8 }}>
          <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>Cantidad</Typography>
          <Typography sx={{ fontSize: '0.82rem', fontFamily: 'monospace', fontWeight: 800, color: '#475569' }}>
            {lote.cantidad ? lote.cantidad.toLocaleString() : '—'}
          </Typography>
        </Box>
        <Box sx={{ backgroundColor: badge.bg, borderRadius: 1.5, py: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
          <badge.Icon size={11} color={badge.color} />
          <Typography sx={{ fontSize: '0.62rem', fontWeight: 800, color: badge.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{badge.label}</Typography>
        </Box>
      </Box>
    </Box>
  )
}

// ── Campo del dialog (estructura limpia con label arriba + input) ──
function Campo({ label, required, icon: Icon, children, helper, fullWidth }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, gridColumn: fullWidth ? '1 / -1' : 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
        {Icon && <Icon size={12} color="#7C3AED" />}
        <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {label}
          {required && <Box component="span" sx={{ color: '#dc2626', ml: 0.3 }}>*</Box>}
        </Typography>
      </Box>
      {children}
      {helper && (
        <Typography sx={{ fontSize: '0.62rem', color: '#94a3b8', mt: -0.3, display: 'flex', alignItems: 'center', gap: 0.3 }}>
          <Lock size={9} /> {helper}
        </Typography>
      )}
    </Box>
  )
}

const inputSx = {
  borderRadius: 2, fontSize: '0.88rem', backgroundColor: '#fafafa',
  '& fieldset': { borderColor: '#e2e8f0' },
  '&:hover fieldset': { borderColor: '#C4B5FD' },
  '&.Mui-focused fieldset': { borderColor: '#7C3AED', borderWidth: 1.5 },
  '&.Mui-focused': { backgroundColor: '#fff' },
}

// ═══════════════════════════════════════════════════════════════════════════
export function LoteSelector({ lotes, loading, onSelect, onRefresh, currentUser }) {
  const [busqueda, setBusqueda]       = useState('')
  const [dialogNuevo, setDialogNuevo] = useState(false)
  const [guardando, setGuardando]     = useState(false)
  const [nuevoLote, setNuevoLote]     = useState({
    lote: '', den_generica: '', concentracion: '', forma_farmaceutica: '',
    qty_plan: '', plan: '', real: '', qty_real: ''
  })

  const lotesFiltrados = lotes.filter(l =>
    l.lote.toLowerCase().includes(busqueda.toLowerCase()) ||
    (l.producto || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  function setField(key, val) { setNuevoLote(p => ({ ...p, [key]: val })) }

  async function handleCrearLote() {
    if (!nuevoLote.lote || !nuevoLote.den_generica) return
    setGuardando(true)
    const producto = [nuevoLote.den_generica, nuevoLote.concentracion, nuevoLote.forma_farmaceutica]
      .filter(Boolean).join(' ')
    const { error } = await supabase.from('lotes').insert({
      lote: nuevoLote.lote.toUpperCase(), producto,
      cantidad: parseInt(nuevoLote.qty_plan) || null,
    })
    setGuardando(false)
    if (!error) {
      setDialogNuevo(false)
      setNuevoLote({ lote: '', den_generica: '', concentracion: '', forma_farmaceutica: '', qty_plan: '', plan: '', real: '', qty_real: '' })
      onRefresh()
    }
  }

  const totalLotes = lotes.length
  const activos    = lotes.filter(l => !l.estatus || l.estatus === 'activo').length
  const liberados  = lotes.filter(l => l.estatus === 'liberado').length

  const cardWidth   = 280   // ancho horizontal por lote
  const cardHeight  = 580   // altura total del flujo
  const middleY     = cardHeight / 2  // centro vertical (290)
  const peakOffset  = 200   // qué tan arriba/abajo se van las olas
  const containerWidth = lotesFiltrados.length * cardWidth + 280

  function generarPathRio(n) {
    if (n === 0) return ''
    const startX = 100, stepX = cardWidth
    let path = `M ${startX},${middleY}`
    for (let i = 0; i < n; i++) {
      const x1 = startX + i * stepX + stepX / 4
      const y1 = i % 2 === 0 ? middleY - peakOffset : middleY + peakOffset
      const x2 = startX + i * stepX + 3 * stepX / 4
      const y2 = i % 2 === 0 ? middleY + peakOffset : middleY - peakOffset
      const x3 = startX + (i + 1) * stepX
      const y3 = middleY
      path += ` C ${x1},${y1} ${x2},${y2} ${x3},${y3}`
    }
    return path
  }

  return (
    <Box sx={{ minHeight: 'calc(100vh - 80px)', backgroundColor: '#fff', pb: 4 }}>

      {/* Barra acciones */}
      <Box sx={{ px: 4, py: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9' }}>
        <TextField size="small" placeholder="Buscar lote o producto..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={14} color="#94a3b8" /></InputAdornment> }}
          sx={{ width: 280, '& .MuiOutlinedInput-root': { backgroundColor: '#fafafa', borderRadius: 3, '& fieldset': { borderColor: '#e2e8f0' }, '&:hover fieldset': { borderColor: '#DDD6FE' } } }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[
            { label: 'Total',     value: totalLotes, color: '#7C3AED', Icon: Layers },
            { label: 'Activos',   value: activos,    color: '#0891b2', Icon: Clock },
            { label: 'Liberados', value: liberados,  color: '#16a34a', Icon: CheckCircle2 },
          ].map(s => (
            <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.6, backgroundColor: '#fff', border: `1px solid ${s.color}30`, borderRadius: 2, px: 1.2, py: 0.5 }}>
              <s.Icon size={12} color={s.color} />
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</Typography>
              <Typography sx={{ fontSize: '0.56rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.3 }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ flex: 1 }} />
        <Button size="small" startIcon={<Plus size={15} />} onClick={() => setDialogNuevo(true)} variant="contained"
          sx={{ background: 'linear-gradient(135deg,#7C3AED,#D946EF)', fontWeight: 700, textTransform: 'none', borderRadius: 3, fontSize: '0.82rem', px: 2.5, boxShadow: '0 4px 12px rgba(124,58,237,0.25)', '&:hover': { boxShadow: '0 6px 20px rgba(124,58,237,0.4)' } }}>
          Nuevo Lote
        </Button>
      </Box>

      {/* RECUADRO MORADO con flujo */}
      <Box sx={{ px: 4, pt: 3 }}>
        <Box sx={{ borderRadius: '12px', border: '3px solid #C084FC', backgroundColor: '#fff', boxShadow: '0 4px 24px rgba(192,132,252,0.15)', overflow: 'hidden' }}>
          <Box sx={{ background: 'linear-gradient(90deg,#F5F3FF,#FDF4FF)', px: 3, py: 1.5, borderBottom: '2px solid #E9D5FF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Package size={16} color="#7C3AED" />
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#3B0764', letterSpacing: 0.3, textTransform: 'uppercase' }}>
                Lotes en Seguimiento
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.7rem', color: '#7C3AED', fontWeight: 700 }}>
              {lotesFiltrados.length} LOTE{lotesFiltrados.length !== 1 ? 'S' : ''} · CLICK PARA VER PROCESO
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress sx={{ color: '#7C3AED' }} size={44} />
            </Box>
          ) : lotesFiltrados.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Package size={48} color="#DDD6FE" />
              <Typography sx={{ color: '#94a3b8', mt: 2, fontSize: '0.9rem' }}>No se encontraron lotes</Typography>
              <Typography sx={{ color: '#cbd5e1', fontSize: '0.78rem', mt: 0.5 }}>
                {busqueda ? 'Prueba con otra búsqueda' : 'Crea un nuevo lote para empezar'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflowX: 'auto', backgroundColor: '#fff' }}>
              <Box sx={{ position: 'relative', minWidth: `${containerWidth}px`, height: cardHeight, px: 2, py: 2 }}>
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
                  <defs>
                    <linearGradient id="riverGradLotes" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%"   stopColor="#C084FC" stopOpacity="0.25" />
                      <stop offset="50%"  stopColor="#7C3AED" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#C084FC" stopOpacity="0.25" />
                    </linearGradient>
                  </defs>
                  <path d={generarPathRio(lotesFiltrados.length)}
                        stroke="url(#riverGradLotes)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                </svg>

                <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', height: '100%' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 1.5, flexShrink: 0 }}>
                    <Box sx={{ width: 72, height: 72, borderRadius: '16px', background: 'linear-gradient(135deg,#475569,#1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(30,41,59,0.35)' }}>
                      <Factory size={32} color="#fff" />
                    </Box>
                    <Typography sx={{ fontSize: '0.7rem', color: '#475569', mt: 1, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>Inicio</Typography>
                  </Box>

                  {lotesFiltrados.map((lote, i) => {
                    const esArriba = i % 2 === 0
                    const colorCfg = getColorForLote(i)
                    return (
                      <Box key={lote.id} sx={{ position: 'relative', width: cardWidth, height: cardHeight - 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {esArriba ? (
                          <Box sx={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <LoteCard lote={lote} colorCfg={colorCfg} onClick={onSelect} />
                            <Box sx={{ width: 2, height: 50, background: `linear-gradient(180deg,${colorCfg.color}90,transparent)` }} />
                            <Box sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: colorCfg.color, border: '3px solid #fff', boxShadow: `0 0 0 3px ${colorCfg.color}50` }} />
                          </Box>
                        ) : (
                          <Box sx={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Box sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: colorCfg.color, border: '3px solid #fff', boxShadow: `0 0 0 3px ${colorCfg.color}50` }} />
                            <Box sx={{ width: 2, height: 50, background: `linear-gradient(180deg,transparent,${colorCfg.color}90)` }} />
                            <LoteCard lote={lote} colorCfg={colorCfg} onClick={onSelect} />
                          </Box>
                        )}
                      </Box>
                    )
                  })}

                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ml: 1.5, flexShrink: 0 }}>
                    <Box sx={{ width: 72, height: 72, borderRadius: '16px',
                      background: liberados > 0 ? 'linear-gradient(135deg,#16a34a,#22c55e)' : 'linear-gradient(135deg,#cbd5e1,#94a3b8)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: liberados > 0 ? '0 6px 20px rgba(22,163,74,0.4)' : '0 3px 10px rgba(148,163,184,0.2)' }}>
                      <Truck size={32} color="#fff" />
                    </Box>
                    <Typography sx={{ fontSize: '0.7rem', color: liberados > 0 ? '#16a34a' : '#94a3b8', mt: 1, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                      Meta
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* ═══ DIALOG NUEVO LOTE — Rediseñado ═══ */}
      <Dialog open={dialogNuevo} onClose={() => setDialogNuevo(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(124,58,237,0.25)' } }}>

        {/* Header con gradiente */}
        <DialogTitle sx={{
          p: 0,
          background: 'linear-gradient(135deg,#3B0764 0%,#7C3AED 60%,#D946EF 100%)',
          color: '#fff',
        }}>
          <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={20} color="#fff" />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Acción</Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>Registrar Nuevo Lote</Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDialogNuevo(false)} size="small" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              <X size={18} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>

          {/* Sección 1: IDENTIFICACIÓN */}
          <Box sx={{ px: 3, pt: 2.5, pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 22, height: 22, borderRadius: '6px', backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Hash size={12} color="#7C3AED" />
              </Box>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#3B0764', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Identificación del Lote
              </Typography>
              <Box sx={{ flex: 1, height: 1, backgroundColor: '#F5F3FF' }} />
            </Box>

            <Campo label="Número de Lote" required icon={Hash}>
              <TextField value={nuevoLote.lote}
                onChange={e => setField('lote', e.target.value)}
                placeholder="Ej: 602003A" fullWidth size="small"
                InputProps={{ sx: inputSx }} />
            </Campo>
          </Box>

          {/* Sección 2: PRODUCTO */}
          <Box sx={{ px: 3, pb: 2, backgroundColor: '#fafafa', py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 22, height: 22, borderRadius: '6px', backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Beaker size={12} color="#7C3AED" />
              </Box>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#3B0764', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Información del Producto
              </Typography>
              <Box sx={{ flex: 1, height: 1, backgroundColor: '#E9D5FF' }} />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Campo label="Denominación Genérica" required icon={FileText} fullWidth>
                <TextField value={nuevoLote.den_generica}
                  onChange={e => setField('den_generica', e.target.value)}
                  placeholder="Ej: Ibuprofeno" fullWidth size="small"
                  InputProps={{ sx: inputSx }} />
              </Campo>

              <Campo label="Concentración" icon={Hash}>
                <TextField value={nuevoLote.concentracion}
                  onChange={e => setField('concentracion', e.target.value)}
                  placeholder="Ej: 600 mg" fullWidth size="small"
                  InputProps={{ sx: inputSx }} />
              </Campo>

              <Campo label="Forma Farmacéutica" icon={Beaker}>
                <TextField value={nuevoLote.forma_farmaceutica}
                  onChange={e => setField('forma_farmaceutica', e.target.value)}
                  placeholder="Ej: Tabletas" fullWidth size="small"
                  InputProps={{ sx: inputSx }} />
              </Campo>
            </Box>
          </Box>

          {/* Sección 3: PLANIFICACIÓN */}
          <Box sx={{ px: 3, py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 22, height: 22, borderRadius: '6px', backgroundColor: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={12} color="#7C3AED" />
              </Box>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#3B0764', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Planificación y Cantidades
              </Typography>
              <Box sx={{ flex: 1, height: 1, backgroundColor: '#F5F3FF' }} />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Campo label="Fecha Plan" icon={Calendar} helper="No editable una vez guardada">
                <TextField type="date" value={nuevoLote.plan}
                  onChange={e => setField('plan', e.target.value)}
                  fullWidth size="small"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: inputSx }} />
              </Campo>

              <Campo label="Fecha Real" icon={Calendar}>
                <TextField type="date" value={nuevoLote.real}
                  onChange={e => setField('real', e.target.value)}
                  fullWidth size="small"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{ sx: inputSx }} />
              </Campo>

              <Campo label="QTY Plan" icon={Hash}>
                <TextField type="number" value={nuevoLote.qty_plan}
                  onChange={e => setField('qty_plan', e.target.value)}
                  placeholder="Ej: 10000" fullWidth size="small"
                  InputProps={{ sx: inputSx }} />
              </Campo>

              <Campo label="QTY Real" icon={Hash}>
                <TextField type="number" value={nuevoLote.qty_real}
                  onChange={e => setField('qty_real', e.target.value)}
                  placeholder="Cantidad real" fullWidth size="small"
                  InputProps={{ sx: inputSx }} />
              </Campo>
            </Box>
          </Box>

          {/* Aviso */}
          <Box sx={{ px: 3, pb: 2 }}>
            <Box sx={{ backgroundColor: '#F5F3FF', borderRadius: 2, px: 1.8, py: 1.2, border: '1px solid #DDD6FE', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Lock size={13} color="#7C3AED" />
              <Typography sx={{ fontSize: '0.7rem', color: '#6D28D9', fontWeight: 600 }}>
                Los campos con * son obligatorios. La fecha plan se bloqueará tras guardar.
              </Typography>
            </Box>
          </Box>

        </DialogContent>

        {/* Footer */}
        <DialogActions sx={{ px: 3, py: 2, gap: 1, borderTop: '1px solid #f1f5f9', backgroundColor: '#fafafa' }}>
          <Button onClick={() => setDialogNuevo(false)}
            startIcon={<X size={14} />}
            sx={{ borderRadius: 2, textTransform: 'none', color: '#64748b', fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={handleCrearLote}
            disabled={guardando || !nuevoLote.lote || !nuevoLote.den_generica}
            startIcon={guardando ? null : <Plus size={14} />}
            sx={{
              background: 'linear-gradient(135deg,#7C3AED,#D946EF)',
              borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3,
              boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
              '&:hover': { boxShadow: '0 6px 20px rgba(124,58,237,0.4)' },
              '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8' },
            }}>
            {guardando ? 'Guardando...' : 'Crear Lote'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
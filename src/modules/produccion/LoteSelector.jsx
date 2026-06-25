import { useState } from 'react'
import {
  Box, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, InputAdornment, CircularProgress, IconButton, Grid
} from '@mui/material'
import {
  Plus, Search, CheckCircle2, XCircle, AlertTriangle, Clock,
  Package, Layers, X, Hash, Beaker, FileText, Trash2, AlertCircle,
  Tag, Ruler, FlaskConical
} from 'lucide-react'
import { supabase } from '../../lib/supabase.js'

function getEstatusBadge(lote) {
  if (lote.estatus === 'liberado')  return { label: 'Liberado',  color: '#16a34a', bg: '#f0fdf4', Icon: CheckCircle2 }
  if (lote.estatus === 'cancelado') return { label: 'Cancelado', color: '#dc2626', bg: '#fef2f2', Icon: XCircle }
  if (lote.estatus === 'rechazado') return { label: 'Rechazado', color: '#d97706', bg: '#fffbeb', Icon: AlertTriangle }
  return { label: 'Activo', color: '#7C3AED', bg: '#F5F3FF', Icon: Clock }
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
      {/* Botón eliminar — aparece al hover */}
      <IconButton
        className="delete-btn"
        onClick={(e) => { e.stopPropagation(); onDelete(lote) }}
        size="small"
        sx={{
          position: 'absolute', top: 6, right: 6, zIndex: 2,
          backgroundColor: 'rgba(255,255,255,0.95)',
          color: '#dc2626', opacity: 0,
          width: 26, height: 26,
          transition: 'opacity 0.2s, background-color 0.15s',
          '&:hover': { backgroundColor: '#fee2e2' },
        }}>
        <Trash2 size={13} />
      </IconButton>

      {/* Header */}
      <Box sx={{ background: 'linear-gradient(135deg,#4C1D95,#7C3AED)', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ width: 34, height: 34, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Package size={16} color="#fff" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Lote</Typography>
          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#fff', fontFamily: 'monospace', lineHeight: 1.1 }}>{lote.lote}</Typography>
        </Box>
      </Box>
      {/* Body */}
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

export function LoteSelector({ lotes, loading, onSelect, onRefresh }) {
  const [busqueda, setBusqueda]       = useState('')
  const [dialogNuevo, setDialogNuevo] = useState(false)
  const [guardando, setGuardando]     = useState(false)
  const [loteAEliminar, setLoteAEliminar] = useState(null)
  const [eliminando, setEliminando]       = useState(false)
  const [nuevoLote, setNuevoLote]     = useState({
    lote: '',
    den_generica: '',
    concentracion: '',
    forma_farmaceutica: '',
    denominacion_distintiva: '',
    presentacion: '',
    tamano: '',
    qty_plan: ''
  })

  const lotesFiltrados = lotes.filter(l =>
    l.lote.toLowerCase().includes(busqueda.toLowerCase()) ||
    (l.producto || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  function setField(key, val) { setNuevoLote(p => ({ ...p, [key]: val })) }

  function resetNuevoLote() {
    setNuevoLote({
      lote: '',
      den_generica: '',
      concentracion: '',
      forma_farmaceutica: '',
      denominacion_distintiva: '',
      presentacion: '',
      tamano: '',
      qty_plan: ''
    })
  }

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
      tamano:                  nuevoLote.tamano                  || null,
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

    // Borrar primero las tablas hijas, luego el lote
    await supabase.from('historial_ediciones').delete().eq('lote_id', loteAEliminar.id)
    await supabase.from('fechas_proceso').delete().eq('lote_id', loteAEliminar.id)
    const { error } = await supabase.from('lotes').delete().eq('id', loteAEliminar.id)

    setEliminando(false)
    setLoteAEliminar(null)
    if (!error) onRefresh()
  }


  const total     = lotes.length
  const activos   = lotes.filter(l => !l.estatus || l.estatus === 'activo').length
  const liberados = lotes.filter(l => l.estatus === 'liberado').length

  return (
    <Box sx={{ p: 4 }}>

      {/* Barra de acciones */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Buscar lote o producto..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search size={14} color="#94a3b8" /></InputAdornment>, sx: inputSx }}
          sx={{ width: 320 }} />

        <Box sx={{ display: 'flex', gap: 1 }}>
          {[
            { label: 'Total',     value: total,     color: '#7C3AED', Icon: Layers },
            { label: 'Activos',   value: activos,   color: '#0891b2', Icon: Clock },
            { label: 'Liberados', value: liberados, color: '#16a34a', Icon: CheckCircle2 },
          ].map(s => (
            <Box key={s.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.6, backgroundColor: '#fff', border: `1px solid ${s.color}30`, borderRadius: 2, px: 1.4, py: 0.6 }}>
              <s.Icon size={13} color={s.color} />
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</Typography>
              <Typography sx={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.3 }}>{s.label}</Typography>
            </Box>
          ))}
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
            {busqueda ? 'Prueba con otra búsqueda' : 'Crea un nuevo lote para empezar'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {lotesFiltrados.map(lote => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={lote.id}>
              <LoteCard lote={lote} onClick={onSelect} onDelete={setLoteAEliminar} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ═══ Dialog nuevo lote — ahora con 6 campos de producto ═══ */}
      <Dialog open={dialogNuevo} onClose={() => setDialogNuevo(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ p: 0, background: 'linear-gradient(135deg,#4C1D95,#7C3AED)', color: '#fff' }}>
          <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Plus size={20} />
              <Box>
                <Typography sx={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.1 }}>Nuevo Lote</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)' }}>
                  Estos datos se heredarán a todas las etapas
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setDialogNuevo(false)} size="small" sx={{ color: 'rgba(255,255,255,0.85)' }}>
              <X size={18} />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>

          {/* ─── Identificación del lote ─── */}
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#7C3AED',
            textTransform: 'uppercase', letterSpacing: 0.5, mt: -0.5 }}>
            Identificación
          </Typography>

          <TextField label="Número de Lote *" value={nuevoLote.lote}
            onChange={e => setField('lote', e.target.value)}
            placeholder="Ej: 602003A" fullWidth size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><Hash size={14} color="#94a3b8" /></InputAdornment>, sx: inputSx }} />

          {/* ─── Datos del producto ─── */}
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#7C3AED',
            textTransform: 'uppercase', letterSpacing: 0.5, mt: 1 }}>
            Datos del producto
          </Typography>

          <TextField label="Denominación Genérica *" value={nuevoLote.den_generica}
            onChange={e => setField('den_generica', e.target.value)}
            placeholder="Ej: Ibuprofeno" fullWidth size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><FlaskConical size={14} color="#94a3b8" /></InputAdornment>, sx: inputSx }} />

          <TextField label="Denominación Distintiva" value={nuevoLote.denominacion_distintiva}
            onChange={e => setField('denominacion_distintiva', e.target.value)}
            placeholder="Ej: Algidol, Advil, etc." fullWidth size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><Tag size={14} color="#94a3b8" /></InputAdornment>, sx: inputSx }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Concentración" value={nuevoLote.concentracion}
              onChange={e => setField('concentracion', e.target.value)}
              placeholder="600 mg" fullWidth size="small"
              InputProps={{ startAdornment: <InputAdornment position="start"><Hash size={14} color="#94a3b8" /></InputAdornment>, sx: inputSx }} />

            <TextField label="Forma Farmacéutica" value={nuevoLote.forma_farmaceutica}
              onChange={e => setField('forma_farmaceutica', e.target.value)}
              placeholder="Tabletas" fullWidth size="small"
              InputProps={{ startAdornment: <InputAdornment position="start"><Beaker size={14} color="#94a3b8" /></InputAdornment>, sx: inputSx }} />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Presentación" value={nuevoLote.presentacion}
              onChange={e => setField('presentacion', e.target.value)}
              placeholder="Caja c/30" fullWidth size="small"
              InputProps={{ startAdornment: <InputAdornment position="start"><Package size={14} color="#94a3b8" /></InputAdornment>, sx: inputSx }} />

            <TextField label="Tamaño" value={nuevoLote.tamano}
              onChange={e => setField('tamano', e.target.value)}
              placeholder="Ej: 100 mL, 50 kg" fullWidth size="small"
              InputProps={{ startAdornment: <InputAdornment position="start"><Ruler size={14} color="#94a3b8" /></InputAdornment>, sx: inputSx }} />
          </Box>

          {/* ─── Cantidad ─── */}
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#7C3AED',
            textTransform: 'uppercase', letterSpacing: 0.5, mt: 1 }}>
            Plan de fabricación
          </Typography>

          <TextField label="Cantidad Plan" type="number" value={nuevoLote.qty_plan}
            onChange={e => setField('qty_plan', e.target.value)}
            placeholder="10000" fullWidth size="small"
            InputProps={{ sx: inputSx }} />
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
        maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
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
import { useState } from 'react'
import {
  Box, Typography, Button, Chip, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, CircularProgress, Badge, Tooltip
} from '@mui/material'
import { Plus, Search, History, Package, ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase.js'

function getEstilo(lote) {
  if (lote.estatus === 'liberado')  return { label: 'Liberado',  bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' }
  if (lote.estatus === 'cancelado') return { label: 'Cancelado', bg: '#fff5f5', color: '#dc2626', border: '#fecaca' }
  if (lote.estatus === 'rechazado') return { label: 'Rechazado', bg: '#fffbeb', color: '#d97706', border: '#fde68a' }
  return { label: 'Activo', bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' }
}

function getEstatusIcon(estatus) {
  if (estatus === 'liberado')  return <CheckCircle2 size={12} />
  if (estatus === 'cancelado') return <XCircle size={12} />
  if (estatus === 'rechazado') return <AlertTriangle size={12} />
  return <Clock size={12} />
}

export function LoteSelector({
  lotes, selectedLote, onSelect, loading, onRefresh,
  onShowHistory, historialCount
}) {
  const [busqueda, setBusqueda]     = useState('')
  const [dialogNuevo, setDialogNuevo] = useState(false)
  const [nuevoLote, setNuevoLote]   = useState({ lote: '', producto: '', cantidad: '' })
  const [guardando, setGuardando]   = useState(false)

  const lotesFiltrados = lotes.filter(l =>
    l.lote.toLowerCase().includes(busqueda.toLowerCase()) ||
    l.producto.toLowerCase().includes(busqueda.toLowerCase())
  )

  async function handleCrearLote() {
    if (!nuevoLote.lote || !nuevoLote.producto) return
    setGuardando(true)
    const { error } = await supabase.from('lotes').insert({
      lote:     nuevoLote.lote.toUpperCase(),
      producto: nuevoLote.producto,
      cantidad: parseInt(nuevoLote.cantidad) || null,
    })
    setGuardando(false)
    if (!error) {
      setDialogNuevo(false)
      setNuevoLote({ lote: '', producto: '', cantidad: '' })
      onRefresh()
    }
  }

  // ── Vista: lote seleccionado ──────────────────────────────────────────────
  if (selectedLote) {
    const estilo = getEstilo(selectedLote)
    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
          px: 3, py: 1.8,
          background: 'linear-gradient(135deg, #3B0764, #7C3AED)',
          borderRadius: 4,
          boxShadow: '0 2px 12px rgba(124,58,237,0.18)',
        }}>
          {/* Botón volver */}
          <Button
            size="small"
            startIcon={<ArrowLeft size={15} />}
            onClick={() => onSelect(null)}
            sx={{
              color: '#E9D5FF', borderColor: 'rgba(233,213,255,0.4)',
              textTransform: 'none', fontSize: '0.78rem', borderRadius: 3,
              '&:hover': { borderColor: '#E9D5FF', backgroundColor: 'rgba(255,255,255,0.08)' }
            }}
            variant="outlined"
          >
            Todos los lotes
          </Button>

          <Package size={18} color="#E9D5FF" />

          {/* Info lote activo */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1rem', fontFamily: 'monospace', lineHeight: 1 }}>
              {selectedLote.lote}
            </Typography>
            <Typography sx={{ color: 'rgba(233,213,255,0.75)', fontSize: '0.78rem', mt: 0.3,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selectedLote.producto}
            </Typography>
          </Box>

          {selectedLote.cantidad && (
            <Typography sx={{ color: '#E9D5FF', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'monospace' }}>
              {selectedLote.cantidad.toLocaleString()} uds
            </Typography>
          )}

          <Chip
            label={getEstilo(selectedLote).label}
            size="small"
            icon={getEstatusIcon(selectedLote.estatus)}
            sx={{
              backgroundColor: estilo.bg, color: estilo.color,
              border: `1px solid ${estilo.border}`,
              fontWeight: 700, fontSize: '0.7rem',
              '& .MuiChip-icon': { color: estilo.color }
            }}
          />

          <Tooltip title="Ver historial de movimientos">
            <Badge badgeContent={historialCount} color="error" max={99}>
              <Button
                size="small" startIcon={<History size={15} />}
                onClick={onShowHistory}
                variant="outlined"
                sx={{ color: '#E9D5FF', borderColor: 'rgba(233,213,255,0.4)', textTransform: 'none',
                  fontSize: '0.78rem', borderRadius: 3,
                  '&:hover': { borderColor: '#E9D5FF', backgroundColor: 'rgba(255,255,255,0.08)' } }}
              >
                Historial
              </Button>
            </Badge>
          </Tooltip>
        </Box>
      </Box>
    )
  }

  // ── Vista: mosaico de lotes ───────────────────────────────────────────────
  return (
    <Box sx={{ mb: 3 }}>

      {/* Barra superior */}
      <Box sx={{
        px: 3, py: 2,
        background: 'linear-gradient(135deg, #3B0764, #7C3AED)',
        borderRadius: '16px 16px 0 0',
        display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
      }}>
        <Package size={20} color="#E9D5FF" />
        <Typography sx={{ color: '#fff', fontWeight: 700, flexGrow: 1, fontSize: '0.9rem', letterSpacing: 0.3 }}>
          LOTES DE PRODUCCIÓN
        </Typography>
        <TextField
          size="small"
          placeholder="Buscar lote o producto..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={14} color="rgba(255,255,255,0.55)" />
              </InputAdornment>
            ),
          }}
          sx={{
            width: 220,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: '#fff', fontSize: '0.8rem', borderRadius: 3,
              '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
              '& input::placeholder': { color: 'rgba(255,255,255,0.5)' },
            }
          }}
        />
        <Button
          size="small" startIcon={<Plus size={15} />}
          onClick={() => setDialogNuevo(true)}
          variant="contained"
          sx={{
            backgroundColor: '#D946EF', color: '#fff', fontWeight: 700,
            textTransform: 'none', fontSize: '0.78rem', borderRadius: 3,
            '&:hover': { backgroundColor: '#C026D3' }
          }}
        >
          Nuevo Lote
        </Button>
      </Box>

      {/* Grid mosaico */}
      <Box sx={{
        border: '1.5px solid #DDD6FE', borderTop: 'none',
        borderRadius: '0 0 16px 16px',
        backgroundColor: '#fafafa',
        p: 2.5,
        minHeight: 120,
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress size={32} sx={{ color: '#7C3AED' }} />
          </Box>
        ) : lotesFiltrados.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Package size={32} color="#DDD6FE" />
            <Typography sx={{ color: '#94a3b8', mt: 1, fontSize: '0.85rem' }}>
              No se encontraron lotes
            </Typography>
          </Box>
        ) : (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: 2,
          }}>
            {lotesFiltrados.map(lote => {
              const estilo = getEstilo(lote)
              return (
                <Box
                  key={lote.id}
                  onClick={() => onSelect(lote)}
                  sx={{
                    borderRadius: 3,
                    border: `1.5px solid ${estilo.border}`,
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: `0 8px 24px ${estilo.color}22`,
                      borderColor: estilo.color,
                    },
                  }}
                >
                  {/* Header tarjeta */}
                  <Box sx={{
                    px: 1.8, py: 1.2,
                    backgroundColor: estilo.bg,
                    borderBottom: `1px solid ${estilo.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <Typography sx={{
                      fontFamily: 'monospace', fontWeight: 800,
                      fontSize: '0.9rem', color: estilo.color, letterSpacing: 0.5,
                    }}>
                      {lote.lote}
                    </Typography>
                    <Chip
                      label={estilo.label}
                      size="small"
                      icon={getEstatusIcon(lote.estatus)}
                      sx={{
                        height: 20, fontSize: '0.62rem', fontWeight: 700,
                        backgroundColor: '#fff', color: estilo.color,
                        border: `1px solid ${estilo.border}`, borderRadius: 2,
                        '& .MuiChip-icon': { color: estilo.color, fontSize: 10 },
                      }}
                    />
                  </Box>

                  {/* Body tarjeta */}
                  <Box sx={{ px: 1.8, py: 1.4 }}>
                    <Typography sx={{
                      fontSize: '0.76rem', color: '#374151', lineHeight: 1.4,
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      mb: 1.2, minHeight: 36,
                    }}>
                      {lote.producto}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                        Cantidad
                      </Typography>
                      <Typography sx={{ fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 700, color: '#475569' }}>
                        {lote.cantidad ? lote.cantidad.toLocaleString() : '—'}
                      </Typography>
                    </Box>

                    {/* Botón ver */}
                    <Box sx={{
                      mt: 1.5, pt: 1.2, borderTop: `1px solid ${estilo.border}`,
                      display: 'flex', justifyContent: 'center',
                    }}>
                      <Typography sx={{
                        fontSize: '0.7rem', fontWeight: 700, color: estilo.color,
                        textTransform: 'uppercase', letterSpacing: 0.5,
                      }}>
                        Ver proceso →
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}
      </Box>

      {/* Dialog nuevo lote */}
      <Dialog open={dialogNuevo} onClose={() => setDialogNuevo(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #3B0764, #7C3AED)',
          color: '#fff', fontWeight: 700, borderRadius: '16px 16px 0 0'
        }}>
          Registrar Nuevo Lote
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Número de Lote *" value={nuevoLote.lote}
            onChange={e => setNuevoLote(p => ({ ...p, lote: e.target.value }))}
            placeholder="Ej: 510020A" fullWidth
            InputProps={{ sx: { borderRadius: 3 } }}
          />
          <TextField
            label="Producto *" value={nuevoLote.producto}
            onChange={e => setNuevoLote(p => ({ ...p, producto: e.target.value }))}
            placeholder="Ej: Terlisgen 250 mg frasco con 30 tabletas" fullWidth
            InputProps={{ sx: { borderRadius: 3 } }}
          />
          <TextField
            label="Cantidad" type="number" value={nuevoLote.cantidad}
            onChange={e => setNuevoLote(p => ({ ...p, cantidad: e.target.value }))}
            placeholder="Ej: 10000" fullWidth
            InputProps={{ sx: { borderRadius: 3 } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDialogNuevo(false)} sx={{ borderRadius: 3 }}>Cancelar</Button>
          <Button
            variant="contained" onClick={handleCrearLote}
            disabled={guardando || !nuevoLote.lote || !nuevoLote.producto}
            sx={{ backgroundColor: '#7C3AED', borderRadius: 3, '&:hover': { backgroundColor: '#6D28D9' } }}
          >
            {guardando ? 'Guardando...' : 'Crear Lote'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
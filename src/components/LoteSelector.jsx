import { useState } from 'react'
import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Button, Chip,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  Tooltip, Badge
} from '@mui/material'
import { Plus, Search, History, Package } from 'lucide-react'
import { supabase } from '../lib/supabase.js'

export function LoteSelector({ lotes, selectedLote, onSelect, loading, onRefresh, onShowHistory, historialCount }) {
  const [busqueda, setBusqueda] = useState('')
  const [dialogNuevo, setDialogNuevo] = useState(false)
  const [nuevoLote, setNuevoLote] = useState({ lote: '', producto: '', cantidad: '' })
  const [guardando, setGuardando] = useState(false)

  const lotesFiltrados = lotes.filter(l =>
    l.lote.toLowerCase().includes(busqueda.toLowerCase()) ||
    l.producto.toLowerCase().includes(busqueda.toLowerCase())
  )

  async function handleCrearLote() {
    if (!nuevoLote.lote || !nuevoLote.producto) return
    setGuardando(true)
    const { error } = await supabase.from('lotes').insert({
      lote: nuevoLote.lote.toUpperCase(),
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

  function getEstilo(lote) {
    if (lote.estatus === 'liberado')  return { label: 'Liberado',  color: 'success' }
    if (lote.estatus === 'cancelado') return { label: 'Cancelado', color: 'error' }
    if (lote.estatus === 'rechazado') return { label: 'Rechazado', color: 'warning' }
    return { label: 'Activo', color: 'primary' }
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1.5px solid #DDD6FE', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>

        {/* Encabezado */}
        <Box sx={{
          px: 3, py: 2,
          background: 'linear-gradient(135deg, #3B0764, #7C3AED)',
          display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap'
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
            InputProps={{ startAdornment: <Search size={15} color="#94a3b8" style={{ marginRight: 6 }} /> }}
            sx={{
              width: 230,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255,255,255,0.12)',
                color: '#fff', fontSize: '0.8rem', borderRadius: 3,
                '& fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                '& input::placeholder': { color: 'rgba(255,255,255,0.55)' },
              }
            }}
          />
          {selectedLote && (
            <Tooltip title="Ver historial de movimientos">
              <Badge badgeContent={historialCount} color="error" max={99}>
                <Button size="small" startIcon={<History size={15} />} onClick={onShowHistory}
                  sx={{ color: '#E9D5FF', borderColor: '#E9D5FF', textTransform: 'none', fontSize: '0.78rem', borderRadius: 3 }}
                  variant="outlined">
                  Historial
                </Button>
              </Badge>
            </Tooltip>
          )}
          <Button size="small" startIcon={<Plus size={15} />} onClick={() => setDialogNuevo(true)}
            variant="contained"
            sx={{ backgroundColor: '#D946EF', color: '#fff', fontWeight: 700, textTransform: 'none',
              fontSize: '0.78rem', borderRadius: 3, '&:hover': { backgroundColor: '#C026D3' } }}>
            Nuevo Lote
          </Button>
        </Box>

        {/* Tabla */}
        <TableContainer sx={{ maxHeight: 260 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {['LOTE', 'PRODUCTO', 'CANTIDAD', 'ESTATUS', ''].map(h => (
                  <TableCell key={h} sx={{
                    backgroundColor: '#F5F3FF', fontWeight: 700, fontSize: '0.7rem',
                    letterSpacing: 0.6, color: '#6D28D9', py: 1.2, borderBottom: '1.5px solid #DDD6FE'
                  }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: '#94a3b8' }}>Cargando lotes...</TableCell></TableRow>
              ) : lotesFiltrados.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: '#94a3b8' }}>No se encontraron lotes</TableCell></TableRow>
              ) : (
                lotesFiltrados.map(lote => {
                  const isSelected = selectedLote?.id === lote.id
                  const { label, color } = getEstilo(lote)
                  return (
                    <TableRow key={lote.id} onClick={() => onSelect(lote)}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#F5F3FF' : 'transparent',
                        '&:hover': { backgroundColor: isSelected ? '#EDE9FE' : '#FAFAFA' },
                        borderLeft: isSelected ? '4px solid #7C3AED' : '4px solid transparent',
                        transition: 'background-color 0.15s',
                      }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#6D28D9', fontFamily: 'monospace' }}>
                        {lote.lote}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#374151', maxWidth: 280 }}>
                        {lote.producto}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'right', fontFamily: 'monospace' }}>
                        {lote.cantidad ? lote.cantidad.toLocaleString() : '—'}
                      </TableCell>
                      <TableCell>
                        <Chip label={label} color={color} size="small"
                          sx={{ fontSize: '0.68rem', height: 20, borderRadius: 2 }} />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', pr: 2 }}>
                        {isSelected && (
                          <Typography sx={{ fontSize: '0.68rem', color: '#7C3AED', fontWeight: 700 }}>
                            ► ACTIVO
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog nuevo lote */}
      <Dialog open={dialogNuevo} onClose={() => setDialogNuevo(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #3B0764, #7C3AED)', color: '#fff', fontWeight: 700, borderRadius: '16px 16px 0 0' }}>
          Registrar Nuevo Lote
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField label="Número de Lote *" value={nuevoLote.lote}
            onChange={e => setNuevoLote(p => ({ ...p, lote: e.target.value }))}
            placeholder="Ej: 510020A" fullWidth
            InputProps={{ sx: { borderRadius: 3 } }} />
          <TextField label="Producto *" value={nuevoLote.producto}
            onChange={e => setNuevoLote(p => ({ ...p, producto: e.target.value }))}
            placeholder="Ej: Terlisgen 250 mg frasco con 30 tabletas" fullWidth
            InputProps={{ sx: { borderRadius: 3 } }} />
          <TextField label="Cantidad" type="number" value={nuevoLote.cantidad}
            onChange={e => setNuevoLote(p => ({ ...p, cantidad: e.target.value }))}
            placeholder="Ej: 10000" fullWidth
            InputProps={{ sx: { borderRadius: 3 } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setDialogNuevo(false)} sx={{ borderRadius: 3 }}>Cancelar</Button>
          <Button variant="contained" onClick={handleCrearLote}
            disabled={guardando || !nuevoLote.lote || !nuevoLote.producto}
            sx={{ backgroundColor: '#7C3AED', borderRadius: 3, '&:hover': { backgroundColor: '#6D28D9' } }}>
            {guardando ? 'Guardando...' : 'Crear Lote'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
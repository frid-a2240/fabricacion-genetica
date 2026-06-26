import { useState, useEffect, useMemo } from 'react'
import {
  Box, Typography, CircularProgress, Button, TextField, InputAdornment,
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip
} from '@mui/material'
import { History, RefreshCw, Search, X, BadgeCheck, Truck } from 'lucide-react'
import { supabase } from '../../lib/supabase.js'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ORDEN_ETAPA } from '../../constants/etapas.js'

function fmtFecha(iso) {
  if (!iso) return '—'
  try { return format(parseISO(iso), 'dd/MMM/yy', { locale: es }).toUpperCase() }
  catch { return iso }
}

function etapaDe(fechasLote, orden) {
  return fechasLote.find(f => f.etapas_proceso?.orden === orden)
}

export default function ConsultaHistorialModule() {
  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => { cargarHistorial() }, [])

  async function cargarHistorial() {
    setCargando(true)
    const [{ data: lotes }, { data: fechas }] = await Promise.all([
      supabase.from('lotes').select('*')
        .in('estatus', ['liberado', 'enviado'])
        .order('created_at', { ascending: false }),
      supabase.from('fechas_proceso').select('*, etapas_proceso(nombre, orden)'),
    ])

    const fechasPorLote = {}
    ;(fechas || []).forEach(f => {
      if (!fechasPorLote[f.lote_id]) fechasPorLote[f.lote_id] = []
      fechasPorLote[f.lote_id].push(f)
    })

    const items = (lotes || []).map(lote => {
      const fechasLote = fechasPorLote[lote.id] || []
      const aceptado = etapaDe(fechasLote, ORDEN_ETAPA.ACEPTADO)
      const envio = etapaDe(fechasLote, ORDEN_ETAPA.ENVIO)
      return { lote, fechasLote, aceptado, envio }
    })

    setRegistros(items)
    setCargando(false)
  }

  const filtrados = useMemo(() => {
    if (!query.trim()) return registros
    const q = query.toLowerCase()
    return registros.filter(({ lote }) =>
      lote.lote?.toLowerCase().includes(q) ||
      lote.producto?.toLowerCase().includes(q) ||
      lote.den_generica?.toLowerCase().includes(q) ||
      lote.denominacion_distintiva?.toLowerCase().includes(q)
    )
  }, [query, registros])

  const pendientes = filtrados.filter(r => r.lote.estatus === 'liberado').length
  const enviados = filtrados.filter(r => r.lote.estatus === 'enviado').length

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <Box sx={{
        px: 4, py: 2, backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
      }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: 2,
          background: 'linear-gradient(135deg,#4C1D95,#7C3AED)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <History size={22} color="#fff" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 200 }}>
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
            Consulta Historial
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
            Lotes aceptados y enviados · fuera del inventario activo
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip size="small" icon={<BadgeCheck size={12} />} label={`Pend. envío: ${pendientes}`}
            sx={{ fontWeight: 700, backgroundColor: '#f0fdf4', color: '#16a34a' }} />
          <Chip size="small" icon={<Truck size={12} />} label={`Enviados: ${enviados}`}
            sx={{ fontWeight: 700, backgroundColor: '#ecfeff', color: '#0891b2' }} />
        </Box>
        <Box sx={{ width: 320 }}>
          <TextField value={query} onChange={e => setQuery(e.target.value)} size="small" fullWidth
            placeholder="Buscar lote o producto..."
            slotProps={{ input: {
              startAdornment: <InputAdornment position="start"><Search size={14} color="#94a3b8" /></InputAdornment>,
              endAdornment: query && (
                <InputAdornment position="end">
                  <Box onClick={() => setQuery('')} sx={{ cursor: 'pointer', display: 'flex' }}>
                    <X size={14} color="#94a3b8" />
                  </Box>
                </InputAdornment>
              ),
              sx: { fontSize: '0.82rem', backgroundColor: '#fafafa', borderRadius: 2 },
            } }} />
        </Box>
        <Button size="small" startIcon={<RefreshCw size={13} />} onClick={cargarHistorial}
          sx={{ textTransform: 'none', color: '#475569' }}>
          Actualizar
        </Button>
      </Box>

      <Box sx={{ p: 4, flex: 1 }}>
        {cargando ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#7C3AED' }} />
          </Box>
        ) : filtrados.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <History size={48} color="#DDD6FE" />
            <Typography sx={{ color: '#94a3b8', mt: 2 }}>
              {query ? 'Sin resultados para esta búsqueda' : 'Aún no hay lotes aceptados o enviados'}
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1.5px solid #e2e8f0' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F5F3FF' }}>
                  {['Lote', 'Producto', 'Estatus', 'Fecha Aceptado', 'Cant. Aceptada', 'Fecha Envío', 'Cant. Enviada'].map(h => (
                    <TableCell key={h} sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtrados.map(({ lote, aceptado, envio }) => (
                  <TableRow key={lote.id} hover>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#7C3AED' }}>
                      {lote.lote}
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>
                        {lote.denominacion_distintiva || lote.producto}
                      </Typography>
                      <Typography sx={{ fontSize: '0.68rem', color: '#64748b' }}>
                        {lote.den_generica} {lote.concentracion}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={lote.estatus === 'enviado' ? 'Enviado' : 'Pend. envío'}
                        sx={{
                          fontWeight: 700, fontSize: '0.62rem',
                          backgroundColor: lote.estatus === 'enviado' ? '#ecfeff' : '#f0fdf4',
                          color: lote.estatus === 'enviado' ? '#0891b2' : '#16a34a',
                        }} />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                      {fmtFecha(aceptado?.fecha_actual)}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {aceptado?.cantidad_actual?.toLocaleString('en-US') ?? '—'}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                      {fmtFecha(envio?.fecha_actual)}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
                      {envio?.cantidad_actual?.toLocaleString('en-US') ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  )
}

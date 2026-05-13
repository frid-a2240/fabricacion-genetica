import { useState, useEffect } from 'react'
import {
  Box, Paper, Typography, Tabs, Tab, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert
} from '@mui/material'
import { Search, Layers, Cog, Clock, Package, Zap, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase.js'

function StatMini({ icon: Icon, label, value, unit, color, bg }) {
  return (
    <Box sx={{
      flex: 1, minWidth: 140,
      backgroundColor: bg,
      border: `1.5px solid ${color}33`,
      borderRadius: 3, p: 2,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <Box sx={{ backgroundColor: color + '20', borderRadius: 2, p: 0.6, display: 'flex' }}>
          <Icon size={15} color={color} />
        </Box>
        <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {label}
        </Typography>
      </Box>
      <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color, lineHeight: 1 }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500, mt: 0.3 }}>
        {unit}
      </Typography>
    </Box>
  )
}

export function TiemposTecnicos() {
  const [tab, setTab] = useState(0)
  const [acond, setAcond] = useState([])
  const [proc, setProc]   = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => { cargarTodos() }, [])

  // Limpiar selección al cambiar de tab
  useEffect(() => { setSelected(null); setBusqueda('') }, [tab])

  async function cargarTodos() {
    setLoading(true)
    const [{ data: aData }, { data: pData }] = await Promise.all([
      supabase.from('tiempos_acondicionamiento').select('*').order('producto'),
      supabase.from('tiempos_proceso').select('*').order('producto'),
    ])
    setAcond(aData || [])
    setProc(pData || [])
    setLoading(false)
  }

  // Filtros
  const acondFiltrado = acond.filter(r =>
    !busqueda || (r.producto || '').toLowerCase().includes(busqueda.toLowerCase())
  )
  const procFiltrado = proc.filter(r =>
    !busqueda || (r.producto || '').toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <Box>
      {/* Header del módulo */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#3B0764', letterSpacing: 0.3 }}>
          Tiempos Técnicos
        </Typography>
        <Typography sx={{ fontSize: '0.85rem', color: '#64748b', mt: 0.3 }}>
          Referencia de tiempos de acondicionamiento y procesos de fabricación por producto
        </Typography>
      </Box>

      <Paper elevation={0} sx={{
        borderRadius: 4, overflow: 'hidden',
        border: '1.5px solid #DDD6FE',
        boxShadow: '0 2px 12px rgba(124,58,237,0.06)'
      }}>
        {/* Tabs */}
        <Box sx={{
          background: 'linear-gradient(135deg, #2E1065 0%, #4C1D95 50%, #7C3AED 100%)',
          px: 2, py: 0,
        }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none', fontSize: '0.85rem', fontWeight: 600,
                minHeight: 52, color: 'rgba(233,213,255,0.7)',
                '&.Mui-selected': { color: '#fff' }
              },
              '& .MuiTabs-indicator': { backgroundColor: '#D946EF', height: 3, borderRadius: 2 }
            }}>
            <Tab icon={<Layers size={16} />} iconPosition="start" label="Acondicionamiento" />
            <Tab icon={<Cog size={16} />}    iconPosition="start" label="Proceso de Fabricación" />
          </Tabs>
        </Box>

        {/* Barra de búsqueda */}
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #EDE9FE', backgroundColor: '#FAFAFA' }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar producto..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search size={15} color="#94a3b8" /></InputAdornment>,
              sx: { borderRadius: 3, backgroundColor: '#fff' }
            }}
          />
        </Box>

        {/* Loading */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: '#7C3AED' }} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', minHeight: 500 }}>

            {/* Tabla izquierda */}
            <Box sx={{ flex: '0 0 45%', borderRight: '1px solid #EDE9FE', overflow: 'auto', maxHeight: 650 }}>
              {tab === 0 ? (
                <TablaAcond rows={acondFiltrado} selected={selected} onSelect={setSelected} />
              ) : (
                <TablaProc rows={procFiltrado} selected={selected} onSelect={setSelected} />
              )}
            </Box>

            {/* Detalle derecha */}
            <Box sx={{ flex: 1, p: 3, backgroundColor: '#FAFAFA' }}>
              {!selected ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400 }}>
                  <Box sx={{
                    width: 64, height: 64, borderRadius: 4,
                    backgroundColor: '#F5F3FF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2
                  }}>
                    {tab === 0 ? <Layers size={28} color="#7C3AED" /> : <Cog size={28} color="#7C3AED" />}
                  </Box>
                  <Typography sx={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
                    Selecciona un producto
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', mt: 0.5 }}>
                    Haz clic en una fila de la tabla para ver el detalle
                  </Typography>
                </Box>
              ) : tab === 0 ? (
                <DetalleAcond data={selected} />
              ) : (
                <DetalleProc data={selected} />
              )}
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  )
}

/* ============ TABLA ACONDICIONAMIENTO ============ */
function TablaAcond({ rows, selected, onSelect }) {
  if (rows.length === 0) {
    return <Alert severity="info" sx={{ m: 2 }}>No hay registros</Alert>
  }
  return (
    <TableContainer>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {['PRODUCTO', 'TAMAÑO LOTE', 'TIEMPO'].map(h => (
              <TableCell key={h} sx={{
                backgroundColor: '#F5F3FF', fontWeight: 700, fontSize: '0.66rem',
                letterSpacing: 0.5, color: '#6D28D9', py: 1.3, borderBottom: '1.5px solid #DDD6FE'
              }}>
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(r => {
            const isSel = selected?.id === r.id
            return (
              <TableRow key={r.id} onClick={() => onSelect(r)}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: isSel ? '#F5F3FF' : 'transparent',
                  borderLeft: isSel ? '3px solid #7C3AED' : '3px solid transparent',
                  '&:hover': { backgroundColor: isSel ? '#EDE9FE' : '#FAFAFA' },
                }}>
                <TableCell sx={{ fontSize: '0.76rem', fontWeight: 600, color: '#1e293b' }}>
                  {r.producto}
                </TableCell>
                <TableCell sx={{ fontSize: '0.76rem', color: '#475569', fontFamily: 'monospace' }}>
                  {r.tamano_lote ? Number(r.tamano_lote).toLocaleString() : '—'}
                </TableCell>
                <TableCell sx={{ fontSize: '0.76rem' }}>
                  <Chip
                    label={`${r.tiempo_total_dias || 0} d`}
                    size="small"
                    sx={{ height: 20, fontSize: '0.66rem', fontWeight: 700,
                      backgroundColor: '#FDF4FF', color: '#D946EF', border: '1px solid #F5D0FE', borderRadius: 2 }}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

/* ============ TABLA PROCESO ============ */
function TablaProc({ rows, selected, onSelect }) {
  if (rows.length === 0) {
    return <Alert severity="info" sx={{ m: 2 }}>No hay registros</Alert>
  }
  return (
    <TableContainer>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {['PRODUCTO', 'CAPACIDAD', 'KG/DÍA'].map(h => (
              <TableCell key={h} sx={{
                backgroundColor: '#F5F3FF', fontWeight: 700, fontSize: '0.66rem',
                letterSpacing: 0.5, color: '#6D28D9', py: 1.3, borderBottom: '1.5px solid #DDD6FE'
              }}>
                {h}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(r => {
            const isSel = selected?.id === r.id
            return (
              <TableRow key={r.id} onClick={() => onSelect(r)}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: isSel ? '#F5F3FF' : 'transparent',
                  borderLeft: isSel ? '3px solid #7C3AED' : '3px solid transparent',
                  '&:hover': { backgroundColor: isSel ? '#EDE9FE' : '#FAFAFA' },
                }}>
                <TableCell sx={{ fontSize: '0.76rem', fontWeight: 600, color: '#1e293b' }}>
                  {r.producto}
                </TableCell>
                <TableCell sx={{ fontSize: '0.76rem', color: '#475569', fontFamily: 'monospace' }}>
                  {r.capacidad ? Number(r.capacidad).toLocaleString() : '—'}
                </TableCell>
                <TableCell sx={{ fontSize: '0.76rem' }}>
                  <Chip
                    label={`${r.kg_por_dia ? Number(r.kg_por_dia).toLocaleString() : '0'}`}
                    size="small"
                    sx={{ height: 20, fontSize: '0.66rem', fontWeight: 700,
                      backgroundColor: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', borderRadius: 2 }}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

/* ============ DETALLE ACONDICIONAMIENTO ============ */
function DetalleAcond({ data }) {
  return (
    <Box>
      <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#3B0764', mb: 0.3 }}>
        {data.producto}
      </Typography>
      <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mb: 2.5 }}>
        Detalle de tiempos de acondicionamiento
      </Typography>

      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <StatMini icon={Package}    label="Tamaño Lote"  value={Number(data.tamano_lote || 0).toLocaleString()} unit="unidades" color="#7C3AED" bg="#F5F3FF" />
        <StatMini icon={Clock}      label="Surtido"      value={data.surtido_dias || '—'}                       unit="días"     color="#D946EF" bg="#FDF4FF" />
        <StatMini icon={TrendingUp} label="Tiempo Total" value={data.tiempo_total_dias || '—'}                  unit="días"     color="#d97706" bg="#fffbeb" />
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1.5px solid #EDE9FE', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2, py: 1.2, backgroundColor: '#F5F3FF', borderBottom: '1px solid #EDE9FE' }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Máquinas de Acondicionamiento
          </Typography>
        </Box>
        <MaquinaRow label="Primario"   maquina={data.maquina_primario}   capacidad={data.capacidad_primario}   unidad={data.unidad_primario}   color="#7C3AED" />
        <MaquinaRow label="Secundario" maquina={data.maquina_secundario} capacidad={data.capacidad_secundario} unidad={data.unidad_secundario} color="#D946EF" />
      </Paper>
    </Box>
  )
}

/* ============ DETALLE PROCESO ============ */
function DetalleProc({ data }) {
  return (
    <Box>
      <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#3B0764', mb: 0.3 }}>
        {data.producto}
      </Typography>
      <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mb: 2.5 }}>
        Detalle de proceso de fabricación
      </Typography>

      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        <StatMini icon={Clock}      label="Surtido"    value={data.surtido_dias || '—'}                       unit="días"        color="#7C3AED" bg="#F5F3FF" />
        <StatMini icon={Zap}        label="Capacidad"  value={Number(data.capacidad || 0).toLocaleString()}   unit={data.unidad} color="#16a34a" bg="#f0fdf4" />
        <StatMini icon={TrendingUp} label="Producción" value={Number(data.kg_por_dia || 0).toLocaleString()}  unit="kg/día"      color="#D946EF" bg="#FDF4FF" />
      </Box>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1.5px solid #EDE9FE', overflow: 'hidden', mb: 2 }}>
        <Box sx={{ px: 2, py: 1.2, backgroundColor: '#F5F3FF', borderBottom: '1px solid #EDE9FE' }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Máquina Principal
          </Typography>
        </Box>
        <MaquinaRow label="Tableteadora / Encapsuladora" maquina={data.maquina} capacidad={data.capacidad} unidad={data.unidad} color="#16a34a" />
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 160, p: 2, backgroundColor: '#f0fdf4', borderRadius: 3, border: '1px solid #bbf7d0' }}>
          <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
            Concentración
          </Typography>
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#16a34a' }}>
            {Number(data.mg_por_unidad || 0).toLocaleString()}
          </Typography>
          <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>mg / unidad</Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 160, p: 2, backgroundColor: '#FDF4FF', borderRadius: 3, border: '1px solid #F5D0FE' }}>
          <Typography sx={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', mb: 0.5 }}>
            Rendimiento
          </Typography>
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#D946EF' }}>
            {Number(data.kg_por_dia || 0).toLocaleString()}
          </Typography>
          <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>kg producidos / día</Typography>
        </Box>
      </Box>
    </Box>
  )
}

/* ============ MAQUINA ROW ============ */
function MaquinaRow({ label, maquina, capacidad, unidad, color }) {
  if (!maquina) return null
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      py: 1.3, px: 2,
      borderBottom: '1px solid #f1f5f9',
      '&:last-child': { borderBottom: 'none' }
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
        <Box>
          <Typography sx={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.3 }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>
            {maquina}
          </Typography>
        </Box>
      </Box>
      {capacidad && (
        <Chip
          label={`${Number(capacidad).toLocaleString()} ${unidad || ''}`}
          size="small"
          sx={{ backgroundColor: color + '15', color, border: `1px solid ${color}33`,
            fontWeight: 700, fontSize: '0.7rem', borderRadius: 2 }}
        />
      )}
    </Box>
  )
}
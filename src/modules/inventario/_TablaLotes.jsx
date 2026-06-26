import { useState } from 'react'
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Switch, FormControlLabel
} from '@mui/material'
import { History, PackageOpen, Layers } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const COLOR_WHS = {
  whs1: '#7C3AED', whs2: '#d97706', whs3: '#ca8a04', whs4: '#16a34a', whs5: '#dc2626',
}
const NOMBRE_WHS = {
  whs1: 'WHS1 Granel', whs2: 'WHS2 Acondic.', whs3: 'WHS3 Cuarentena',
  whs4: 'WHS4 Liberado', whs5: 'WHS5 Rechazado',
}

function fmtFecha(iso) {
  if (!iso) return '—'
  try { return format(parseISO(iso), 'dd/MMM/yy', { locale: es }).toUpperCase() }
  catch { return iso }
}

// Agrupa los lotes por (den_generica + concentracion + presentacion)
function agruparPorProducto(lotes) {
  const grupos = {}
  lotes.forEach(item => {
    const { lote } = item
    const gen  = lote.den_generica   || lote.producto || 'Sin clasificar'
    const conc = lote.concentracion  || '—'
    const pres = lote.presentacion   || '—'
    const key  = `${gen}|${conc}|${pres}`
    if (!grupos[key]) {
      grupos[key] = {
        key,
        titulo: `${gen} · ${conc} · ${pres}`,
        items: [],
      }
    }
    grupos[key].items.push(item)
  })
  return Object.values(grupos).sort((a, b) => a.titulo.localeCompare(b.titulo))
}

// ═══════════════════════════════════════════════════════════════
// Tarjeta de UN grupo de producto
// ═══════════════════════════════════════════════════════════════
function GrupoProducto({ grupo, color, etapaOrden, almacenId, verHistorico }) {
  const actuales = grupo.items.filter(l => l.almacenActual === almacenId)

  // Suma solo de los lotes actualmente aquí (no históricos)
  const sumaActual = actuales.reduce((acc, { fechasLote }) => {
    const e = fechasLote.find(f => f.etapas_proceso?.orden === etapaOrden)
    return acc + (e?.cantidad_actual || 0)
  }, 0)

  const visibles = verHistorico ? grupo.items : actuales
  if (visibles.length === 0) return null

  return (
    <Paper elevation={0} sx={{
      borderRadius: 3, overflow: 'hidden',
      border: '1.5px solid #e2e8f0',
      boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      mb: 2,
    }}>
      {/* ── Header del grupo ── */}
      <Box sx={{
        px: 2.5, py: 1.5,
        background: `linear-gradient(135deg, ${color}15, ${color}05)`,
        borderBottom: `2px solid ${color}40`,
        display: 'flex', alignItems: 'center', gap: 1.2,
      }}>
        <Box sx={{
          width: 32, height: 32, borderRadius: 1.5,
          backgroundColor: color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Layers size={16} color="#fff" />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{
            fontSize: '0.58rem', color: '#94a3b8', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: 0.6, lineHeight: 1,
          }}>
            Producto
          </Typography>
          <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color, lineHeight: 1.2 }}>
            {grupo.titulo}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{
            fontSize: '0.58rem', color: '#94a3b8', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            Actualmente aquí
          </Typography>
          <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color, lineHeight: 1.1 }}>
            {actuales.length} {actuales.length === 1 ? 'lote' : 'lotes'} · {sumaActual.toLocaleString('en-US')} u.
          </Typography>
        </Box>
      </Box>

      {/* ── Tabla ── */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Lote', 'Producto', 'Cantidad', 'Fecha entrada', 'Estado'].map(h => (
                <TableCell key={h} sx={{
                  backgroundColor: '#f8fafc', fontWeight: 800, fontSize: '0.66rem',
                  color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5,
                  py: 1.2, borderBottom: '1.5px solid #e2e8f0',
                }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibles.map(({ lote, fechasLote, almacenActual }, i) => {
              const etapa = fechasLote.find(f => f.etapas_proceso?.orden === etapaOrden)
              const cantidad = etapa?.cantidad_actual
              const fechaEntrada = etapa?.fecha_actual
              const aqui = almacenActual === almacenId

              return (
                <TableRow key={lote.id} sx={{
                  backgroundColor: i % 2 === 0 ? '#fff' : '#fdfdfd',
                  opacity: aqui ? 1 : 0.55,
                  '&:hover': { backgroundColor: `${color}10`, opacity: 1 },
                }}>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color, fontSize: '0.88rem' }}>
                    {lote.lote}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.82rem', color: '#1e293b' }}>
                    {lote.denominacion_distintiva || lote.producto || 'Sin producto'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                    {cantidad != null ? cantidad.toLocaleString('en-US') : '—'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#64748b' }}>
                    {fmtFecha(fechaEntrada)}
                  </TableCell>
                  <TableCell>
                    {aqui ? (
                      <Chip size="small" label="Aquí ahora"
                        sx={{ backgroundColor: color, color: '#fff', fontWeight: 800,
                              fontSize: '0.65rem', height: 22 }} />
                    ) : almacenActual ? (
                      <Chip size="small" label={`→ ${NOMBRE_WHS[almacenActual]}`}
                        sx={{ backgroundColor: `${COLOR_WHS[almacenActual]}15`,
                              color: COLOR_WHS[almacenActual], fontWeight: 700,
                              fontSize: '0.62rem', height: 22 }} />
                    ) : (
                      <Chip size="small" label="—"
                        sx={{ backgroundColor: '#f1f5f9', color: '#94a3b8',
                              fontSize: '0.62rem', height: 22 }} />
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}

// ═══════════════════════════════════════════════════════════════
// Componente principal
// ═══════════════════════════════════════════════════════════════
export function TablaLotes({ lotes, color, etapaOrden, almacenId }) {
  const [verHistorico, setVerHistorico] = useState(false)

  const grupos = agruparPorProducto(lotes)
  const actuales   = lotes.filter(l => l.almacenActual === almacenId)
  const historicos = lotes.filter(l => l.almacenActual !== almacenId)

  // Productos distintos que están actualmente aquí
  const productosActuales = new Set(
    actuales.map(({ lote }) =>
      `${lote.den_generica || lote.producto}|${lote.concentracion}|${lote.presentacion}`
    )
  ).size

  const algoVisible = verHistorico ? lotes.length > 0 : actuales.length > 0

  return (
    <Box>
      {/* ── Barra global ── */}
      <Paper elevation={0} sx={{
        borderRadius: 3, mb: 2,
        border: `1.5px solid ${color}40`,
        backgroundColor: `${color}10`,
        px: 2.5, py: 1.5,
        display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <Box>
          <Typography sx={{
            fontSize: '0.58rem', color: '#94a3b8', fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: 0.5,
          }}>
            Resumen del almacén
          </Typography>
          <Typography sx={{ fontSize: '1rem', fontWeight: 800, color, lineHeight: 1.1 }}>
            {productosActuales} {productosActuales === 1 ? 'producto' : 'productos'} · {actuales.length} {actuales.length === 1 ? 'lote' : 'lotes'} actualmente aquí
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        {historicos.length > 0 && (
          <FormControlLabel
            control={
              <Switch
                checked={verHistorico}
                onChange={(e) => setVerHistorico(e.target.checked)}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: color },
                }}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <History size={14} color={verHistorico ? color : '#64748b'} />
                <Typography sx={{
                  fontSize: '0.75rem', fontWeight: 700,
                  color: verHistorico ? color : '#64748b',
                }}>
                  Ver lotes que pasaron ({historicos.length})
                </Typography>
              </Box>
            }
            sx={{ m: 0 }}
          />
        )}
      </Paper>

      {/* ── Empty state ── */}
      {!algoVisible ? (
        <Paper elevation={0} sx={{
          borderRadius: 3, border: '1.5px solid #e2e8f0',
          p: 5, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 1.2,
        }}>
          <PackageOpen size={40} color={`${color}40`} />
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color }}>
            Sin lotes actualmente aquí
          </Typography>
          {historicos.length > 0 && (
            <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', maxWidth: 380 }}>
              Hay {historicos.length} {historicos.length === 1 ? 'lote que pasó' : 'lotes que pasaron'} por aquí — actívalo arriba si los quieres ver
            </Typography>
          )}
        </Paper>
      ) : (
        grupos.map(g => (
          <GrupoProducto
            key={g.key}
            grupo={g}
            color={color}
            etapaOrden={etapaOrden}
            almacenId={almacenId}
            verHistorico={verHistorico}
          />
        ))
      )}
    </Box>
  )
}
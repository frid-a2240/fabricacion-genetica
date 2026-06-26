import {
  Box, Paper, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip
} from '@mui/material'
import {
  ClipboardList, CheckCircle2, AlertTriangle, XCircle, Clock, TrendingUp, TrendingDown, Minus,
  Package, FlaskConical, Beaker, Tag, Hash, BadgeCheck, Ban
} from 'lucide-react'
import { format, parseISO, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'

const HOY = new Date('2026-05-13T00:00:00')

function formatFecha(iso) {
  if (!iso) return null
  try { return format(parseISO(iso), 'dd/MMM/yy', { locale: es }).toUpperCase() }
  catch { return iso }
}

// Extrae unidades por presentación de strings tipo "Caja con 10", "Caja c/10", "Frasco c/60 cápsulas"
function unidadesPorPresentacion(presentacion) {
  if (!presentacion) return null
  const m = presentacion.match(/(?:con|c\/?)\s*(\d+)/i) || presentacion.match(/(\d+)/)
  return m ? parseInt(m[1]) : null
}

// Calcula el desfase en días entre fecha plan y fecha real
function calcDesfase(fechaPlan, fechaReal) {
  if (!fechaPlan || !fechaReal) return null
  try { return differenceInDays(parseISO(fechaReal), parseISO(fechaPlan)) }
  catch { return null }
}

// Devuelve estado de la etapa según fechas
function getEstado(fechaPlan, fechaReal) {
  if (fechaReal && fechaPlan) {
    const diff = differenceInDays(parseISO(fechaReal), parseISO(fechaPlan))
    if (diff > 0) return { label: 'Fuera de plan', color: '#dc2626', bg: '#fef2f2', Icon: XCircle }
    return { label: 'Completada',  color: '#16a34a', bg: '#f0fdf4', Icon: CheckCircle2 }
  }
  if (fechaReal) return { label: 'Completada', color: '#16a34a', bg: '#f0fdf4', Icon: CheckCircle2 }
  if (!fechaPlan) return { label: 'Sin fecha', color: '#94a3b8', bg: '#f8fafc', Icon: Minus }
  const plan = parseISO(fechaPlan); const hoy = new Date(HOY); hoy.setHours(0,0,0,0)
  if (plan < hoy) return { label: 'Atrasada',   color: '#d97706', bg: '#fffbeb', Icon: AlertTriangle }
  return { label: 'Programada', color: '#6366f1', bg: '#eef2ff', Icon: Clock }
}

export function ResumenLote({ lote, fechasProceso }) {
  const ordenados = [...fechasProceso].sort(
    (a, b) => (a.etapas_proceso?.orden || 0) - (b.etapas_proceso?.orden || 0)
  )

  // ── Totales globales ──────────────────────────────────────────
  const divisor       = unidadesPorPresentacion(lote?.presentacion)
  const qtyPlanGranel = lote?.cantidad || 0
  const qtyPlanPres   = divisor ? Math.floor(qtyPlanGranel / divisor) : null

  let totalRetraso       = 0
  let totalAdelanto      = 0
  let etapasFueraDePlan  = 0
  let etapasEnPlan       = 0
  let etapasPendientes   = 0

  ordenados.forEach(fp => {
    const desfase = calcDesfase(fp.fecha_plan, fp.fecha_actual)
    if (desfase !== null) {
      if (desfase > 0) { totalRetraso  += desfase;  etapasFueraDePlan++ }
      else             { totalAdelanto += Math.abs(desfase); etapasEnPlan++ }
    } else if (!fp.fecha_actual) {
      etapasPendientes++
    } else {
      etapasEnPlan++
    }
  })

  // QTY real por sección: granel (orden 1-2) y presentaciones (orden 3-6)
  const ultimaConCant = (filtro) =>
    [...ordenados].filter(filtro).filter(fp => fp.cantidad_actual != null).slice(-1)[0]?.cantidad_actual ?? null

  const realGranel = ultimaConCant(fp => (fp.etapas_proceso?.orden || 0) <= 2)
  const realPres   = ultimaConCant(fp => (fp.etapas_proceso?.orden || 0) >= 3)

  const desfaseNeto = totalRetraso - totalAdelanto
  const pctGranel = qtyPlanGranel > 0 && realGranel != null
    ? Math.round((realGranel / qtyPlanGranel) * 100) : null
  const pctPres = qtyPlanPres != null && qtyPlanPres > 0 && realPres != null
    ? Math.round((realPres / qtyPlanPres) * 100) : null

  // Helper: plan por etapa, en su unidad correcta
  const planDeEtapa = (orden) => {
    if (orden <= 2) return qtyPlanGranel
    return qtyPlanPres
  }

  // ── Indicadores arriba de la tabla ───────────────────────────
  const stats = [
    { label: 'Retraso total',  value: `${totalRetraso} días`,  color: '#dc2626', Icon: TrendingUp,   show: true },
    { label: 'Adelanto total', value: `${totalAdelanto} días`, color: '#16a34a', Icon: TrendingDown, show: true },
    { label: 'Desfase neto',   value: `${desfaseNeto >= 0 ? '+' : ''}${desfaseNeto} días`,
      color: desfaseNeto > 0 ? '#dc2626' : desfaseNeto < 0 ? '#16a34a' : '#64748b',
      Icon: desfaseNeto > 0 ? TrendingUp : desfaseNeto < 0 ? TrendingDown : Minus, show: true },
    { label: 'Fuera de plan',  value: `${etapasFueraDePlan} etapas`, color: '#dc2626', Icon: XCircle, show: true },
    { label: 'En plan',        value: `${etapasEnPlan} etapas`,      color: '#16a34a', Icon: CheckCircle2, show: true },
    { label: 'Pendientes',     value: `${etapasPendientes} etapas`,  color: '#6366f1', Icon: Clock, show: true },
  ]

  return (
    <Paper elevation={0} sx={{
      mt: 3, borderRadius: 3, overflow: 'hidden',
      border: '1.5px solid #e2e8f0',
      boxShadow: '0 4px 20px rgba(124,58,237,0.06)'
    }}>
      {/* ─── Header ─── */}
      <Box sx={{
        px: 3, py: 2,
        background: 'linear-gradient(135deg,#4C1D95,#7C3AED)',
        display: 'flex', alignItems: 'center', gap: 2
      }}>
        <ClipboardList size={22} color="#fff" />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem', letterSpacing: 0.4 }}>
            RESUMEN DEL LOTE — {lote.lote}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.74rem', mt: 0.2 }}>
            Comparativo plan vs real · {ordenados.length} etapas
          </Typography>
        </Box>
      </Box>

      {/* ─── Banner de estado del lote (liberado / rechazado) ─── */}
      {lote?.estatus === 'liberado' && (
        <Box sx={{
          px: 3, py: 1.5, backgroundColor: '#f0fdf4',
          borderBottom: '1px solid #bbf7d0',
          display: 'flex', alignItems: 'center', gap: 1.2
        }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: 1.5, flexShrink: 0,
            backgroundColor: '#16a34a',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <BadgeCheck size={17} color="#fff" />
          </Box>
          <Box>
            <Typography sx={{
              fontSize: '0.6rem', fontWeight: 800, color: '#15803d',
              textTransform: 'uppercase', letterSpacing: 0.6
            }}>
              Estado del lote
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#16a34a', lineHeight: 1.1 }}>
              LOTE ACEPTADO · Pendiente de envío
            </Typography>
          </Box>
        </Box>
      )}

      {lote?.estatus === 'enviado' && (
        <Box sx={{
          px: 3, py: 1.5, backgroundColor: '#ecfeff',
          borderBottom: '1px solid #a5f3fc',
          display: 'flex', alignItems: 'center', gap: 1.2
        }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: 1.5, flexShrink: 0,
            backgroundColor: '#0891b2',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Package size={17} color="#fff" />
          </Box>
          <Box>
            <Typography sx={{
              fontSize: '0.6rem', fontWeight: 800, color: '#0e7490',
              textTransform: 'uppercase', letterSpacing: 0.6
            }}>
              Estado del lote
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#0891b2', lineHeight: 1.1 }}>
              LOTE ENVIADO
            </Typography>
          </Box>
        </Box>
      )}

      {lote?.estatus === 'rechazado' && (
        <Box sx={{
          px: 3, py: 1.8, backgroundColor: '#fef2f2',
          borderBottom: '1px solid #fecaca',
          display: 'flex', alignItems: 'flex-start', gap: 1.2
        }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: 1.5, flexShrink: 0,
            backgroundColor: '#dc2626',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Ban size={17} color="#fff" />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
              fontSize: '0.6rem', fontWeight: 800, color: '#991b1b',
              textTransform: 'uppercase', letterSpacing: 0.6
            }}>
              Estado del lote
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#dc2626', lineHeight: 1.1, mb: 0.4 }}>
              LOTE RECHAZADO
            </Typography>
            {lote?.motivo_rechazo ? (
              <Box sx={{
                mt: 0.6, backgroundColor: '#fff', border: '1px solid #fecaca',
                borderRadius: 1.5, p: 1
              }}>
                <Typography sx={{
                  fontSize: '0.58rem', fontWeight: 700, color: '#991b1b',
                  textTransform: 'uppercase', letterSpacing: 0.5, mb: 0.3
                }}>
                  Motivo
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: '#7f1d1d', lineHeight: 1.35, whiteSpace: 'pre-wrap' }}>
                  {lote.motivo_rechazo}
                </Typography>
              </Box>
            ) : (
              <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic', mt: 0.3 }}>
                Sin motivo registrado
              </Typography>
            )}
          </Box>
        </Box>
      )}

      {/* ─── Ficha del Producto ─── */}
      <Box sx={{
        px: 3, py: 2,
        backgroundColor: '#fff',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Package size={14} color="#7C3AED" />
          <Typography sx={{
            fontSize: '0.7rem', fontWeight: 800, color: '#4C1D95',
            textTransform: 'uppercase', letterSpacing: 0.6
          }}>
            Ficha del Producto
          </Typography>
          <Box sx={{ flex: 1, height: 1, backgroundColor: '#EDE9FE' }} />
        </Box>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 1.2
        }}>
          {[
            { label: 'Denominación Genérica',    value: lote?.den_generica,             Icon: FlaskConical, color: '#7C3AED' },
            { label: 'Concentración',            value: lote?.concentracion,            Icon: Hash,         color: '#0891b2' },
            { label: 'Forma Farmacéutica',       value: lote?.forma_farmaceutica,       Icon: Beaker,       color: '#059669' },
            { label: 'Denominación Distintiva',  value: lote?.denominacion_distintiva,  Icon: Tag,          color: '#d97706' },
            { label: 'Presentación',             value: lote?.presentacion,             Icon: Package,      color: '#dc2626' },
          ].map(f => (
            <Box key={f.label} sx={{
              backgroundColor: '#fafafa', borderRadius: 2,
              border: `1px solid ${f.color}25`, p: 1.2,
              display: 'flex', alignItems: 'center', gap: 1.2
            }}>
              <Box sx={{
                width: 30, height: 30, borderRadius: 1.5, flexShrink: 0,
                backgroundColor: `${f.color}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <f.Icon size={15} color={f.color} />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{
                  fontSize: '0.58rem', color: '#94a3b8', fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 0.4
                }}>
                  {f.label}
                </Typography>
                <Typography sx={{
                  fontSize: '0.82rem',
                  fontWeight: f.value ? 700 : 400,
                  color: f.value ? '#1e293b' : '#cbd5e1',
                  fontStyle: f.value ? 'normal' : 'italic',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {f.value || 'No capturado'}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ─── Stats globales ─── */}
      <Box sx={{
        px: 3, py: 2,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 1.5,
        backgroundColor: '#fafafa',
        borderBottom: '1px solid #f1f5f9'
      }}>
        {stats.filter(s => s.show).map(s => (
          <Box key={s.label} sx={{
            backgroundColor: '#fff', borderRadius: 2,
            border: `1px solid ${s.color}30`, p: 1.2,
            display: 'flex', alignItems: 'center', gap: 1
          }}>
            <Box sx={{
              width: 30, height: 30, borderRadius: 1.5, flexShrink: 0,
              backgroundColor: `${s.color}15`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <s.Icon size={15} color={s.color} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{
                fontSize: '0.58rem', color: '#94a3b8', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 0.4
              }}>
                {s.label}
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: s.color, lineHeight: 1.1 }}>
                {s.value}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* ─── Tabla detallada ─── */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['#', 'Etapa', 'Fecha Plan', 'Fecha Real', 'Desfase', 'QTY Plan', 'QTY Real', 'Estado'].map(h => (
                <TableCell key={h} sx={{
                  backgroundColor: '#f8fafc', fontSize: '0.66rem', fontWeight: 800,
                  letterSpacing: 0.5, color: '#475569', py: 1.2,
                  borderBottom: '1.5px solid #e2e8f0', whiteSpace: 'nowrap',
                  textTransform: 'uppercase'
                }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {ordenados.map((fp, i) => {
              const nombre  = fp.etapas_proceso?.nombre || `Etapa ${i + 1}`
              const desfase = calcDesfase(fp.fecha_plan, fp.fecha_actual)
              const estado  = getEstado(fp.fecha_plan, fp.fecha_actual)
              const EstadoIcon = estado.Icon
              const planEtapa = planDeEtapa(fp.etapas_proceso?.orden || 0)

              return (
                <TableRow key={fp.id} sx={{
                  '&:hover': { backgroundColor: '#fafafa' },
                  backgroundColor: i % 2 === 0 ? '#fff' : '#fdfdfd'
                }}>
                  <TableCell sx={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace', fontWeight: 700, width: 36 }}>
                    {String(i + 1).padStart(2, '0')}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.78rem', color: '#1e293b', fontWeight: 600 }}>
                    {nombre}
                  </TableCell>
                  <TableCell sx={{
                    fontSize: '0.74rem', fontFamily: 'monospace',
                    color: fp.fecha_plan ? '#475569' : '#cbd5e1',
                    fontStyle: fp.fecha_plan ? 'normal' : 'italic'
                  }}>
                    {formatFecha(fp.fecha_plan) || '—'}
                  </TableCell>
                  <TableCell sx={{
                    fontSize: '0.74rem', fontFamily: 'monospace', fontWeight: 700,
                    color: fp.fecha_actual ? '#7C3AED' : '#cbd5e1',
                    fontStyle: fp.fecha_actual ? 'normal' : 'italic'
                  }}>
                    {formatFecha(fp.fecha_actual) || '—'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.74rem', fontFamily: 'monospace', fontWeight: 700 }}>
                    {desfase === null ? (
                      <Typography sx={{ fontSize: '0.72rem', color: '#cbd5e1', fontStyle: 'italic' }}>—</Typography>
                    ) : desfase > 0 ? (
                      <Chip size="small" label={`+${desfase} d retraso`}
                        sx={{ backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
                    ) : desfase < 0 ? (
                      <Chip size="small" label={`${desfase} d adelanto`}
                        sx={{ backgroundColor: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
                    ) : (
                      <Chip size="small" label="En fecha"
                        sx={{ backgroundColor: '#eef2ff', color: '#6366f1', fontWeight: 700, fontSize: '0.68rem', height: 22 }} />
                    )}
                  </TableCell>
                  <TableCell sx={{
                    fontSize: '0.74rem', fontFamily: 'monospace',
                    color: planEtapa != null ? '#475569' : '#cbd5e1', fontWeight: 600
                  }}>
                    {planEtapa != null ? planEtapa.toLocaleString('en-US') : '—'}
                  </TableCell>
                  <TableCell sx={{
                    fontSize: '0.74rem', fontFamily: 'monospace', fontWeight: 700,
                    color: fp.cantidad_actual != null ? '#1e293b' : '#cbd5e1',
                    fontStyle: fp.cantidad_actual != null ? 'normal' : 'italic'
                  }}>
                    {fp.cantidad_actual != null ? fp.cantidad_actual.toLocaleString('en-US') : '—'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{
                      backgroundColor: estado.bg, borderRadius: 1.5,
                      px: 1, py: 0.4, display: 'inline-flex', alignItems: 'center', gap: 0.5
                    }}>
                      <EstadoIcon size={11} color={estado.color} />
                      <Typography sx={{
                        fontSize: '0.65rem', fontWeight: 800, color: estado.color,
                        textTransform: 'uppercase', letterSpacing: 0.4
                      }}>
                        {estado.label}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )
            })}

            {/* ─── Totales Granel (etapas 1-2, en tabletas/cápsulas) ─── */}
            <TableRow sx={{ backgroundColor: '#F5F3FF', borderTop: '2px solid #C4B5FD' }}>
              <TableCell colSpan={4} sx={{
                fontSize: '0.78rem', fontWeight: 800, color: '#4C1D95',
                textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5
              }}>
                Total Granel <span style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: 600 }}>(tabletas/cápsulas)</span>
              </TableCell>
              <TableCell sx={{ py: 1.5 }}>
                <Chip size="small"
                  label={`${desfaseNeto >= 0 ? '+' : ''}${desfaseNeto} d neto`}
                  sx={{
                    backgroundColor: desfaseNeto > 0 ? '#fef2f2' : desfaseNeto < 0 ? '#f0fdf4' : '#eef2ff',
                    color:           desfaseNeto > 0 ? '#dc2626' : desfaseNeto < 0 ? '#16a34a' : '#6366f1',
                    fontWeight: 800, fontSize: '0.7rem', height: 24
                  }} />
              </TableCell>
              <TableCell sx={{ fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 800, color: '#4C1D95', py: 1.5 }}>
                {qtyPlanGranel ? qtyPlanGranel.toLocaleString('en-US') : '—'}
              </TableCell>
              <TableCell sx={{ fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 800, color: '#4C1D95', py: 1.5 }}>
                {realGranel != null ? realGranel.toLocaleString('en-US') : '—'}
              </TableCell>
              <TableCell sx={{ py: 1.5 }}>
                {pctGranel != null && (
                  <Chip size="small" label={`${pctGranel}% cumpl.`}
                    sx={{
                      backgroundColor: pctGranel >= 95 ? '#f0fdf4' : pctGranel >= 85 ? '#fffbeb' : '#fef2f2',
                      color:           pctGranel >= 95 ? '#16a34a' : pctGranel >= 85 ? '#d97706' : '#dc2626',
                      fontWeight: 800, fontSize: '0.7rem', height: 24
                    }} />
                )}
              </TableCell>
            </TableRow>

            {/* ─── Totales Presentaciones (etapas 3-6, en cajas/frascos) ─── */}
            <TableRow sx={{ backgroundColor: '#F5F3FF' }}>
              <TableCell colSpan={5} sx={{
                fontSize: '0.78rem', fontWeight: 800, color: '#4C1D95',
                textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5
              }}>
                Total Presentaciones <span style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: 600 }}>
                  ({lote?.presentacion || '—'}{divisor ? ` · ÷${divisor}` : ''})
                </span>
              </TableCell>
              <TableCell sx={{ fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 800, color: '#4C1D95', py: 1.5 }}>
                {qtyPlanPres != null ? qtyPlanPres.toLocaleString('en-US') : '—'}
              </TableCell>
              <TableCell sx={{ fontSize: '0.78rem', fontFamily: 'monospace', fontWeight: 800, color: '#4C1D95', py: 1.5 }}>
                {realPres != null ? realPres.toLocaleString('en-US') : '—'}
              </TableCell>
              <TableCell sx={{ py: 1.5 }}>
                {pctPres != null && (
                  <Chip size="small" label={`${pctPres}% cumpl.`}
                    sx={{
                      backgroundColor: pctPres >= 95 ? '#f0fdf4' : pctPres >= 85 ? '#fffbeb' : '#fef2f2',
                      color:           pctPres >= 95 ? '#16a34a' : pctPres >= 85 ? '#d97706' : '#dc2626',
                      fontWeight: 800, fontSize: '0.7rem', height: 24
                    }} />
                )}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  )
}
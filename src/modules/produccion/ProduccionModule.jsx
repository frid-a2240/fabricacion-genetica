import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, CircularProgress, Snackbar, Alert
} from '@mui/material'
import { RefreshCw, ArrowLeft } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'
import { supabase } from '../../lib/supabase.js'
import { LoteSelector } from './LoteSelector.jsx'
import { VSMFlow } from './VSMFlow.jsx'
import { HistoryPanel } from './HistoryPanel.jsx'
import { ResumenLote } from './ResumenLote.jsx'

const HOY = new Date('2026-05-13T00:00:00')

export default function App() {
  const [lotes, setLotes]                 = useState([])
  const [selectedLote, setSelectedLote]   = useState(null)
  const [fechasProceso, setFechasProceso] = useState([])
  const [etapas, setEtapas]               = useState([])
  const [historial, setHistorial]         = useState([])
  const [loading, setLoading]             = useState(true)
  const [loadingProceso, setLoadingProceso] = useState(false)
  const [showHistory, setShowHistory]     = useState(false)
  const [snackbar, setSnackbar]           = useState({ open: false, message: '', severity: 'success' })
  const [dashStats, setDashStats]         = useState({ total: 0, completados: 0, fueraDePlan: 0, atrasados: 0, pendientes: 0 })

  useEffect(() => {
    cargarEtapas()
    cargarLotes()
  }, [])

  // Calcula los contadores cada vez que cambian las fechas del lote seleccionado
  useEffect(() => {
    if (fechasProceso.length === 0) {
      setDashStats({ total: 0, completados: 0, fueraDePlan: 0, atrasados: 0, pendientes: 0 })
      return
    }
    const hoy = new Date(HOY); hoy.setHours(0, 0, 0, 0)
    let completados = 0, fueraDePlan = 0, atrasados = 0, pendientes = 0
    fechasProceso.forEach(fp => {
      if (fp.fecha_actual) {
        if (fp.fecha_plan && differenceInDays(parseISO(fp.fecha_actual), parseISO(fp.fecha_plan)) > 0) fueraDePlan++
        else completados++
      } else if (fp.fecha_plan && parseISO(fp.fecha_plan) < hoy) atrasados++
      else pendientes++
    })
    setDashStats({ total: fechasProceso.length, completados, fueraDePlan, atrasados, pendientes })
  }, [fechasProceso])

  async function cargarEtapas() {
    const { data } = await supabase.from('etapas_proceso').select('*').order('orden')
    setEtapas(data || [])
  }

  async function cargarLotes() {
    setLoading(true)
    const { data } = await supabase.from('lotes').select('*').order('created_at', { ascending: false })
    setLotes(data || [])
    setLoading(false)
  }

  async function seleccionarLote(lote) {
    if (!lote) {
      setSelectedLote(null); setFechasProceso([]); setHistorial([]); setShowHistory(false)
      return
    }
    setSelectedLote(lote); setLoadingProceso(true); setShowHistory(false)

    let etapasActuales = etapas
    if (etapasActuales.length === 0) {
      const { data } = await supabase.from('etapas_proceso').select('*').order('orden')
      etapasActuales = data || []; setEtapas(etapasActuales)
    }

    const { data: fechas } = await supabase
      .from('fechas_proceso').select('*, etapas_proceso(nombre, orden)')
      .eq('lote_id', lote.id).order('etapas_proceso(orden)')

    const fechasExistentes = fechas || []
    const etapasConRegistro = new Set(fechasExistentes.map(f => f.etapa_id))
    const etapasFaltantes = etapasActuales.filter(e => !etapasConRegistro.has(e.id))
    if (etapasFaltantes.length > 0) {
      await supabase.from('fechas_proceso').insert(
        etapasFaltantes.map(e => ({ lote_id: lote.id, etapa_id: e.id, fecha_plan: null, fecha_actual: null, cantidad_actual: null }))
      )
    }
    const { data: fechasCompletas } = await supabase
      .from('fechas_proceso').select('*, etapas_proceso(nombre, orden)')
      .eq('lote_id', lote.id).order('etapas_proceso(orden)')
    setFechasProceso(fechasCompletas || [])

    const { data: hist } = await supabase
      .from('historial_ediciones').select('*').eq('lote_id', lote.id).order('fecha_captura', { ascending: false })
    setHistorial(hist || [])
    setLoadingProceso(false)
  }

  async function handleActualizarFecha(fechaProcesoId, etapaId, nuevaPlan, nuevaFecha, nuevaCantidad, exp = null) {
    const registro = fechasProceso.find(fp => fp.id === fechaProcesoId)
    const fechaAnterior = registro?.fecha_actual || null

    const payload = {
      fecha_plan: nuevaPlan || null,
      fecha_actual: nuevaFecha || null,
      cantidad_actual: nuevaCantidad || null,
    }
    if (exp !== null) payload.fecha_exp = exp || null

    const { error } = await supabase.from('fechas_proceso').update(payload).eq('id', fechaProcesoId)
    if (error) {
      // Si la tabla no tiene la columna fecha_exp, reintenta sin ella
      if (error.message?.includes('fecha_exp')) {
        const { error: e2 } = await supabase.from('fechas_proceso')
          .update({ fecha_plan: nuevaPlan || null, fecha_actual: nuevaFecha || null, cantidad_actual: nuevaCantidad || null })
          .eq('id', fechaProcesoId)
        if (e2) { setSnackbar({ open: true, message: 'Error: ' + e2.message, severity: 'error' }); return }
      } else {
        setSnackbar({ open: true, message: 'Error: ' + error.message, severity: 'error' }); return
      }
    }

    // Guardar en historial (sin usuario, queda como "—")
    const etapa = etapas.find(e => e.id === etapaId)
    await supabase.from('historial_ediciones').insert({
      lote_id: selectedLote.id, etapa_id: etapaId, lote: selectedLote.lote,
      etapa_nombre: etapa?.nombre || '', cantidad: nuevaCantidad || null,
      nombre_usuario: '—', fecha_captura: new Date().toISOString(),
      fecha_actual_anterior: fechaAnterior, fecha_actual_nueva: nuevaFecha || null,
    })

    setFechasProceso(prev => prev.map(fp =>
      fp.id === fechaProcesoId
        ? { ...fp, fecha_plan: nuevaPlan || null, fecha_actual: nuevaFecha || null, cantidad_actual: nuevaCantidad || null }
        : fp
    ))
    setHistorial(prev => [{
      lote_id: selectedLote.id, etapa_id: etapaId, lote: selectedLote.lote,
      etapa_nombre: etapa?.nombre || '', cantidad: nuevaCantidad || null,
      nombre_usuario: '—', fecha_captura: new Date().toISOString(),
      fecha_actual_anterior: fechaAnterior, fecha_actual_nueva: nuevaFecha || null,
    }, ...prev])
    setSnackbar({ open: true, message: '✓ Guardado correctamente', severity: 'success' })
  }

  // Actualiza campos del lote (estatus, motivo_rechazo, etc.)
  async function handleUpdateLote(loteId, updates, message = '✓ Lote actualizado') {
    const { error } = await supabase.from('lotes').update(updates).eq('id', loteId)
    if (error) {
      setSnackbar({ open: true, message: 'Error: ' + error.message, severity: 'error' })
      return
    }
    setSelectedLote(prev => prev ? { ...prev, ...updates } : prev)
    setLotes(prev => prev.map(l => l.id === loteId ? { ...l, ...updates } : l))
    if (message) setSnackbar({ open: true, message, severity: 'success' })
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>

      {/* ═══ TOP BAR — simple ═══ */}
      <Box sx={{
        px: 4, py: 1.5,
        backgroundColor: '#fff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', gap: 2,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <Box component="img" src="/genetica-icon.png" alt="Genética Laboratorios"
          sx={{ height: 42, objectFit: 'contain', flexShrink: 0 }}
          onError={(e) => { e.target.style.display = 'none' }} />

        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', lineHeight: 1.1 }}>
            Seguimiento de Procesos de Fabricación
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
            MRP · Gestión de Lotes
          </Typography>
        </Box>

        {/* Botón volver / actualizar */}
        {selectedLote ? (
          <Button size="small" startIcon={<ArrowLeft size={14} />}
            onClick={() => seleccionarLote(null)}
            sx={{ textTransform: 'none', color: '#475569',
              '&:hover': { color: '#7C3AED', backgroundColor: '#F5F3FF' } }}>
            Volver a lotes
          </Button>
        ) : (
          <Button size="small" startIcon={<RefreshCw size={13} />}
            onClick={cargarLotes}
            sx={{ textTransform: 'none', color: '#475569',
              '&:hover': { color: '#7C3AED', backgroundColor: '#F5F3FF' } }}>
            Actualizar
          </Button>
        )}
      </Box>

      {/* CONTENIDO */}
      <Box sx={{ flex: 1 }}>

        {!selectedLote && (
          <LoteSelector
            lotes={lotes}
            loading={loading}
            onSelect={seleccionarLote}
            onRefresh={cargarLotes}
          />
        )}

        {selectedLote && (
          <>
            {loadingProceso ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress size={48} sx={{ color: '#7C3AED' }} />
              </Box>
            ) : fechasProceso.length > 0 ? (
              <>
                <VSMFlow
                  lote={selectedLote}
                  fechasProceso={fechasProceso}
                  etapas={etapas}
                  onActualizar={handleActualizarFecha}
                  onUpdateLote={handleUpdateLote}
                  onVolver={() => seleccionarLote(null)}
                  onShowHistory={() => setShowHistory(true)}
                  historialCount={historial.length}
                  dashStats={dashStats}
                />

                {/* ═══ RESUMEN DEL LOTE — plan vs real + desfases ═══ */}
                <Box sx={{ px: 4, pb: 4 }}>
                  <ResumenLote
                    lote={selectedLote}
                    fechasProceso={fechasProceso}
                  />
                </Box>

                {showHistory && (
                  <Box sx={{ px: 4, pb: 4 }}>
                    <HistoryPanel
                      historial={historial}
                      lote={selectedLote}
                      onClose={() => setShowHistory(false)}
                    />
                  </Box>
                )}
              </>
            ) : (
              <Alert severity="info" sx={{ m: 4 }}>Cargando procesos...</Alert>
            )}
          </>
        )}
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} variant="filled"
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
import { useState, useEffect } from 'react'
import {
  Box, Typography, Button, CircularProgress, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip
} from '@mui/material'
import { User, RefreshCw, Package, Clock, LogOut } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'
import { supabase } from './lib/supabase.js'
import { LoteSelector } from './components/LoteSelector.jsx'
import { VSMFlow } from './components/VSMFlow.jsx'
import { HistoryPanel } from './components/HistoryPanel.jsx'
import { TiemposTecnicos } from './components/TiemposTecnicos.jsx'

const HOY = new Date('2026-05-13T00:00:00')

export default function App({ usuario, permisos, onLogout }) {
  const [vista, setVista]               = useState('lotes')
  const [lotes, setLotes]               = useState([])
  const [selectedLote, setSelectedLote] = useState(null)
  const [fechasProceso, setFechasProceso] = useState([])
  const [etapas, setEtapas]             = useState([])
  const [historial, setHistorial]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [loadingProceso, setLoadingProceso] = useState(false)
  const [showHistory, setShowHistory]   = useState(false)
  const [snackbar, setSnackbar]         = useState({ open: false, message: '', severity: 'success' })
  const [userDialog, setUserDialog]     = useState(false)
  const [currentUser, setCurrentUser]   = useState(() => localStorage.getItem('vsm_usuario') || '')
  const [tempUser, setTempUser]         = useState('')
  const [dashStats, setDashStats]       = useState({ total: 0, completados: 0, fueraDePlan: 0, atrasados: 0, pendientes: 0 })

  useEffect(() => {
    if (!currentUser) { setTempUser(''); setUserDialog(true) }
    cargarEtapas()
    cargarLotes()
  }, [])

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
    const usuario = currentUser || localStorage.getItem('vsm_usuario') || ''
    if (!usuario.trim()) { setTempUser(''); setUserDialog(true); return }
    if (!currentUser) setCurrentUser(usuario)

    const registro = fechasProceso.find(fp => fp.id === fechaProcesoId)
    const fechaAnterior = registro?.fecha_actual || null

    const payload = { fecha_plan: nuevaPlan || null, fecha_actual: nuevaFecha || null, cantidad_actual: nuevaCantidad || null }
    if (exp !== null) payload.fecha_exp = exp || null

    const { error } = await supabase.from('fechas_proceso').update(payload).eq('id', fechaProcesoId)
    if (error) {
      if (error.message?.includes('fecha_exp')) {
        const { error: e2 } = await supabase.from('fechas_proceso')
          .update({ fecha_plan: nuevaPlan || null, fecha_actual: nuevaFecha || null, cantidad_actual: nuevaCantidad || null })
          .eq('id', fechaProcesoId)
        if (e2) { setSnackbar({ open: true, message: 'Error: ' + e2.message, severity: 'error' }); return }
      } else { setSnackbar({ open: true, message: 'Error: ' + error.message, severity: 'error' }); return }
    }

    const etapa = etapas.find(e => e.id === etapaId)
    await supabase.from('historial_ediciones').insert({
      lote_id: selectedLote.id, etapa_id: etapaId, lote: selectedLote.lote,
      etapa_nombre: etapa?.nombre || '', cantidad: nuevaCantidad || null,
      nombre_usuario: usuario, fecha_captura: new Date().toISOString(),
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
      nombre_usuario: usuario, fecha_captura: new Date().toISOString(),
      fecha_actual_anterior: fechaAnterior, fecha_actual_nueva: nuevaFecha || null,
    }, ...prev])
    setSnackbar({ open: true, message: '✓ Guardado correctamente', severity: 'success' })
  }

  function handleGuardarUsuario() {
    if (!tempUser.trim()) return
    localStorage.setItem('vsm_usuario', tempUser.trim())
    setCurrentUser(tempUser.trim()); setUserDialog(false)
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* ═══ TOP BAR — LOGO + TÍTULO + NAV ═══ */}
      <Box sx={{
        px: 4, py: 1.5,
        backgroundColor: '#fff',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', gap: 3,
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        {/* LOGO izquierda */}
        <Box component="img" src="/genetica-icon.png" alt="Genética Laboratorios"
          sx={{ height: 48, objectFit: 'contain', flexShrink: 0 }} />

        {/* Título */}
        <Typography sx={{
          fontSize: '1.05rem', fontWeight: 600, color: '#1e293b',
          letterSpacing: 0.2, flex: 1,
        }}>
          Seguimiento de Fechas de Procesos de Fabricación
        </Typography>

        {/* Botones nav derecha */}
        <Box sx={{ display: 'flex', gap: 0.8 }}>
          {[
            { id: 'lotes',   label: 'Lotes',           icon: Package },
            { id: 'tiempos', label: 'Tiempos Técnicos', icon: Clock },
          ].map(item => {
            const Icon = item.icon
            const isActive = vista === item.id
            return (
              <Button key={item.id}
                startIcon={<Icon size={15} />}
                onClick={() => { setVista(item.id); if (item.id !== 'lotes') seleccionarLote(null) }}
                size="small"
                sx={{
                  textTransform: 'none', fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem', borderRadius: 2, px: 2, py: 0.8,
                  color: isActive ? '#7C3AED' : '#475569',
                  backgroundColor: isActive ? '#F5F3FF' : 'transparent',
                  border: isActive ? '1.5px solid #C4B5FD' : '1.5px solid transparent',
                  '&:hover': { backgroundColor: '#F5F3FF', color: '#7C3AED' },
                }}>
                {item.label}
              </Button>
            )
          })}
        </Box>

        {/* Actualizar */}
        {vista === 'lotes' && (
          <Button size="small" startIcon={<RefreshCw size={13} />}
            onClick={() => { cargarLotes(); if (selectedLote) seleccionarLote(selectedLote) }}
            sx={{ color: '#94a3b8', textTransform: 'none', fontSize: '0.72rem', borderRadius: 2, minWidth: 0,
              '&:hover': { color: '#7C3AED', backgroundColor: '#F5F3FF' } }}>
            Actualizar
          </Button>
        )}

        {/* Chip usuario */}
        {currentUser && (
          <Chip icon={<User size={12} />} label={currentUser} size="small"
            onClick={() => { setTempUser(currentUser); setUserDialog(true) }}
            sx={{ backgroundColor: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE',
              cursor: 'pointer', '& .MuiChip-icon': { color: '#7C3AED' }, fontSize: '0.7rem', height: 24 }} />
        )}

        {/* Botón cerrar sesión */}
        {onLogout && (
          <Button size="small" onClick={onLogout} startIcon={<LogOut size={13} />}
            sx={{
              color: '#94a3b8', textTransform: 'none', fontSize: '0.72rem', borderRadius: 2,
              '&:hover': { color: '#ef4444', backgroundColor: '#FFF1F2' },
            }}>
            Salir
          </Button>
        )}
      </Box>

      {/* CONTENIDO */}
      <Box sx={{ flex: 1 }}>

        {vista === 'tiempos' && (
          <Box sx={{ p: 4 }}><TiemposTecnicos /></Box>
        )}

        {vista === 'lotes' && !selectedLote && (
          <LoteSelector
            lotes={lotes} loading={loading}
            onSelect={seleccionarLote} onRefresh={cargarLotes}
            currentUser={currentUser}
          />
        )}

        {vista === 'lotes' && selectedLote && (
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
                  currentUser={currentUser}
                  onActualizar={handleActualizarFecha}
                  onVolver={() => seleccionarLote(null)}
                  onShowHistory={() => setShowHistory(true)}
                  historialCount={historial.length}
                  dashStats={dashStats}
                />
                {showHistory && (
                  <Box sx={{ px: 4, pb: 4 }}>
                    <HistoryPanel historial={historial} lote={selectedLote} onClose={() => setShowHistory(false)} />
                  </Box>
                )}
              </>
            ) : (
              <Alert severity="info" sx={{ m: 4 }}>Cargando procesos...</Alert>
            )}
          </>
        )}
      </Box>

      {/* Dialog usuario */}
      <Dialog open={userDialog} onClose={() => currentUser && setUserDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogTitle sx={{ fontWeight: 700, background: 'linear-gradient(135deg,#3B0764,#7C3AED)', color: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <User size={18} color="#E9D5FF" />
            Identificación de Usuario
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 2, color: '#666', fontSize: '0.82rem' }}>
            Tu nombre quedará registrado en cada cambio que realices.
          </Typography>
          <TextField autoFocus fullWidth label="Nombre de usuario" value={tempUser}
            onChange={e => setTempUser(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGuardarUsuario()}
            placeholder="Ej: tu nombre" InputProps={{ sx: { borderRadius: 3 } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          {currentUser && <Button onClick={() => setUserDialog(false)} sx={{ textTransform: 'none' }}>Cancelar</Button>}
          <Button variant="contained" onClick={handleGuardarUsuario} disabled={!tempUser.trim()}
            sx={{ background: 'linear-gradient(135deg,#7C3AED,#D946EF)', borderRadius: 3, textTransform: 'none', fontWeight: 700 }}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
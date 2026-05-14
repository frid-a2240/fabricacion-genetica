import { useState, useEffect } from 'react'
import {
  Box, AppBar, Toolbar, Typography,
  Button, CircularProgress, Alert, Snackbar,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Chip
} from '@mui/material'
import { RefreshCw, User } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'
import { supabase } from './lib/supabase.js'
import { Dashboard } from './components/Dashboard.jsx'
import { LoteSelector } from './components/LoteSelector.jsx'
import { VSMFlow } from './components/VSMFlow.jsx'
import { HistoryPanel } from './components/HistoryPanel.jsx'
import { Sidebar } from './components/Sidebar.jsx'
import { TiemposTecnicos } from './components/TiemposTecnicos.jsx'

// Fecha de referencia "hoy" — cambia a new Date() cuando quieras usar la fecha real del sistema
const HOY = new Date('2026-05-13T00:00:00')

export default function App() {
  const [vista, setVista] = useState('lotes')
  const [lotes, setLotes] = useState([])
  const [selectedLote, setSelectedLote] = useState(null)
  const [fechasProceso, setFechasProceso] = useState([])
  const [etapas, setEtapas] = useState([])
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingProceso, setLoadingProceso] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [showHistory, setShowHistory] = useState(false)
  const [userDialog, setUserDialog] = useState(false)
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('vsm_usuario') || '')
  const [tempUser, setTempUser] = useState('')
  const [dashStats, setDashStats] = useState({
    total: 0, completados: 0, fueraDePlan: 0, atrasados: 0, pendientes: 0
  })

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
    const hoy = new Date(HOY)
    hoy.setHours(0, 0, 0, 0)
    let completados = 0, fueraDePlan = 0, atrasados = 0, pendientes = 0
    fechasProceso.forEach(fp => {
      if (fp.fecha_actual) {
        if (fp.fecha_plan && differenceInDays(parseISO(fp.fecha_actual), parseISO(fp.fecha_plan)) > 0) {
          fueraDePlan++
        } else {
          completados++
        }
      } else if (fp.fecha_plan && parseISO(fp.fecha_plan) < hoy) {
        atrasados++
      } else {
        pendientes++
      }
    })
    setDashStats({ total: fechasProceso.length, completados, fueraDePlan, atrasados, pendientes })
  }, [fechasProceso])

  async function cargarEtapas() {
    const { data, error } = await supabase.from('etapas_proceso').select('*').order('orden')
    if (!error) setEtapas(data || [])
  }

  async function cargarLotes() {
    setLoading(true)
    const { data, error } = await supabase.from('lotes').select('*').order('created_at', { ascending: false })
    if (!error) setLotes(data || [])
    setLoading(false)
  }

  async function seleccionarLote(lote) {
    // null = volver al mosaico
    if (!lote) {
      setSelectedLote(null)
      setFechasProceso([])
      setHistorial([])
      setShowHistory(false)
      return
    }

    setSelectedLote(lote)
    setLoadingProceso(true)
    setShowHistory(false)

    let etapasActuales = etapas
    if (etapasActuales.length === 0) {
      const { data } = await supabase.from('etapas_proceso').select('*').order('orden')
      etapasActuales = data || []
      setEtapas(etapasActuales)
    }

    const { data: fechas, error: errFechas } = await supabase
      .from('fechas_proceso')
      .select('*, etapas_proceso(nombre, orden)')
      .eq('lote_id', lote.id)
      .order('etapas_proceso(orden)')

    if (!errFechas) {
      const fechasExistentes = fechas || []
      const etapasConRegistro = new Set(fechasExistentes.map(f => f.etapa_id))
      const etapasFaltantes = etapasActuales.filter(e => !etapasConRegistro.has(e.id))
      if (etapasFaltantes.length > 0) {
        const nuevasFilas = etapasFaltantes.map(etapa => ({
          lote_id: lote.id,
          etapa_id: etapa.id,
          fecha_plan: null,
          fecha_actual: null,
          cantidad_actual: null,
        }))
        await supabase.from('fechas_proceso').insert(nuevasFilas)
      }
      const { data: fechasCompletas } = await supabase
        .from('fechas_proceso')
        .select('*, etapas_proceso(nombre, orden)')
        .eq('lote_id', lote.id)
        .order('etapas_proceso(orden)')
      setFechasProceso(fechasCompletas || [])
    }

    const { data: hist } = await supabase
      .from('historial_ediciones')
      .select('*')
      .eq('lote_id', lote.id)
      .order('fecha_captura', { ascending: false })
    setHistorial(hist || [])
    setLoadingProceso(false)
  }

  async function handleActualizarFecha(fechaProcesoId, etapaId, nuevaPlan, nuevaFecha, nuevaCantidad) {
    const usuario = currentUser || localStorage.getItem('vsm_usuario') || ''
    if (!usuario.trim()) { setTempUser(''); setUserDialog(true); return }
    if (!currentUser) setCurrentUser(usuario)

    const registro = fechasProceso.find(fp => fp.id === fechaProcesoId)
    const fechaAnterior = registro?.fecha_actual || null

    const { error } = await supabase
      .from('fechas_proceso')
      .update({
        fecha_plan:      nuevaPlan      || null,
        fecha_actual:    nuevaFecha     || null,
        cantidad_actual: nuevaCantidad  || null,
      })
      .eq('id', fechaProcesoId)

    if (error) {
      setSnackbar({ open: true, message: 'Error al guardar: ' + error.message, severity: 'error' })
      return
    }

    const etapa = etapas.find(e => e.id === etapaId)
    const nuevoRegistro = {
      lote_id: selectedLote.id,
      etapa_id: etapaId,
      lote: selectedLote.lote,
      etapa_nombre: etapa?.nombre || '',
      cantidad: nuevaCantidad || null,
      nombre_usuario: usuario,
      fecha_captura: new Date().toISOString(),
      fecha_actual_anterior: fechaAnterior,
      fecha_actual_nueva: nuevaFecha || null,
    }
    await supabase.from('historial_ediciones').insert(nuevoRegistro)

    setFechasProceso(prev => prev.map(fp =>
      fp.id === fechaProcesoId
        ? { ...fp, fecha_plan: nuevaPlan || null, fecha_actual: nuevaFecha || null, cantidad_actual: nuevaCantidad || null }
        : fp
    ))
    setHistorial(prev => [nuevoRegistro, ...prev])
    setSnackbar({ open: true, message: '✓ Guardado correctamente', severity: 'success' })
  }

  function handleGuardarUsuario() {
    if (!tempUser.trim()) return
    localStorage.setItem('vsm_usuario', tempUser.trim())
    setCurrentUser(tempUser.trim())
    setUserDialog(false)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F5F3FF' }}>
      <Sidebar active={vista} onChange={setVista} currentUser={currentUser} />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <AppBar position="sticky" elevation={0} sx={{
          background: 'linear-gradient(135deg, #3B0764 0%, #7C3AED 100%)',
          borderBottom: '3px solid #D946EF'
        }}>
          <Toolbar sx={{ gap: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 0.5, fontSize: '0.95rem' }}>
              {vista === 'lotes' ? 'SEGUIMIENTO DE FECHAS DE PROCESOS DE FABRICACIÓN' : 'TIEMPOS TÉCNICOS DE PRODUCCIÓN'}
            </Typography>
            {currentUser && (
              <Chip
                icon={<User size={14} />}
                label={currentUser}
                size="small"
                sx={{ backgroundColor: 'rgba(217,70,239,0.2)', color: '#fff', border: '1px solid #D946EF', cursor: 'pointer' }}
                onClick={() => { setTempUser(currentUser); setUserDialog(true) }}
              />
            )}
            {vista === 'lotes' && (
              <Button
                size="small" startIcon={<RefreshCw size={16} />}
                onClick={() => { cargarLotes(); if (selectedLote) seleccionarLote(selectedLote) }}
                sx={{ color: '#fff', textTransform: 'none', fontSize: '0.8rem' }}
              >
                Actualizar
              </Button>
            )}
          </Toolbar>
        </AppBar>

        <Box sx={{ py: 3, px: { xs: 2, md: 4 } }}>
          {vista === 'lotes' && (
            <>
              <Dashboard stats={dashStats} loteActivo={selectedLote} />

              <LoteSelector
                lotes={lotes}
                selectedLote={selectedLote}
                onSelect={seleccionarLote}
                loading={loading}
                onRefresh={cargarLotes}
                currentUser={currentUser}
                onShowHistory={() => setShowHistory(true)}
                historialCount={historial.length}
              />

              {loadingProceso ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress size={48} sx={{ color: '#7C3AED' }} />
                </Box>
              ) : selectedLote && fechasProceso.length > 0 ? (
                <VSMFlow
                  lote={selectedLote}
                  fechasProceso={fechasProceso}
                  etapas={etapas}
                  currentUser={currentUser}
                  onActualizar={handleActualizarFecha}
                />
              ) : selectedLote ? (
                <Alert severity="info" sx={{ mt: 2 }}>Cargando procesos...</Alert>
              ) : null}

              {showHistory && selectedLote && (
                <HistoryPanel
                  historial={historial}
                  lote={selectedLote}
                  onClose={() => setShowHistory(false)}
                />
              )}
            </>
          )}
          {vista === 'tiempos' && <TiemposTecnicos />}
        </Box>
      </Box>

      <Dialog open={userDialog} onClose={() => currentUser && setUserDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, backgroundColor: '#3B0764', color: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <User size={20} color="#E9D5FF" />
            Identificación de Usuario
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            Ingresa tu nombre de usuario. Quedará registrado en cada cambio que realices.
          </Typography>
          <TextField
            autoFocus fullWidth label="Nombre de usuario"
            value={tempUser}
            onChange={e => setTempUser(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleGuardarUsuario()}
            placeholder="Ej: tu nombre"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {currentUser && <Button onClick={() => setUserDialog(false)}>Cancelar</Button>}
          <Button
            variant="contained" onClick={handleGuardarUsuario}
            disabled={!tempUser.trim()}
            sx={{ backgroundColor: '#7C3AED', borderRadius: 3, '&:hover': { backgroundColor: '#6D28D9' } }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open} autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
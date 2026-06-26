import { useState } from 'react'
import { Box } from '@mui/material'
import { Sidebar } from './components/Sidebar.jsx'
import ProduccionModule from './modules/produccion/ProduccionModule.jsx'
import InventarioModule from './modules/inventario/InventarioModule.jsx'
import PlanModule from './modules/plan/PlanModule.jsx'
import AjustesInventarioModule from './modules/inventario/AjustesInventarioModule.jsx'
import ConsultaHistorialModule from './modules/historial/ConsultaHistorialModule.jsx'
import TransferenciasModule from './modules/transferencias/TransferenciasModule.jsx'

export default function App() {
  const [moduloActivo, setModuloActivo] = useState('produccion')

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <Sidebar activo={moduloActivo} onChange={setModuloActivo} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {moduloActivo === 'produccion' && <ProduccionModule />}
        {moduloActivo === 'inventarios' && <InventarioModule />}
        {moduloActivo === 'planeacion' && <PlanModule />}
        {moduloActivo === 'ajustes-inventarios' && <AjustesInventarioModule />}
        {moduloActivo === 'consulta-historial' && <ConsultaHistorialModule />}
        {moduloActivo === 'transferencias' && <TransferenciasModule />}
      </Box>
    </Box>
  )
}
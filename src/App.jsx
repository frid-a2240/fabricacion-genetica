import { useState } from 'react'
import { Box } from '@mui/material'
import { Sidebar } from './components/Sidebar.jsx'
import ProduccionModule from './modules/produccion/ProduccionModule.jsx'
import InventarioModule from './modules/inventario/InventarioModule.jsx'
import PlanModule from './modules/plan/PlanModule.jsx'

export default function App() {
  const [moduloActivo, setModuloActivo] = useState('produccion')

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <Sidebar activo={moduloActivo} onChange={setModuloActivo} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {moduloActivo === 'produccion' && <ProduccionModule />}
        {moduloActivo === 'inventario' && <InventarioModule />}
        {moduloActivo === 'plan' && <PlanModule />}
      </Box>
    </Box>
  )
}
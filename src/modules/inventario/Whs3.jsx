// Whs3.jsx
import { ShieldAlert } from 'lucide-react'
import { AlmacenLayout } from './_AlmacenLayout.jsx'
import { TablaLotes } from './_TablaLotes.jsx'
const CFG = { code: 'WHS3', label: 'Cuarentena', color: '#ca8a04', grad: ['#713f12','#ca8a04'] }
export default function Whs3({ lotes = [] }) {
  return (
    <AlmacenLayout {...CFG} Icon={ShieldAlert}
      descripcion="Producto retenido en espera de dictamen de Liberación"
      mensajeVacio="Sin lotes pendientes de liberación">
      {lotes.length > 0 && <TablaLotes lotes={lotes} color={CFG.color} etapaOrden={5} almacenId="whs3" />}
    </AlmacenLayout>
  )
}
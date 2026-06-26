// Whs5.jsx
import { Ban } from 'lucide-react'
import { AlmacenLayout } from './_AlmacenLayout.jsx'
import { TablaLotes } from './_TablaLotes.jsx'
const CFG = { code: 'WHS5', label: 'Rechazado', color: '#dc2626', grad: ['#7f1d1d','#dc2626'] }
export default function Whs5({ lotes = [] }) {
  return (
    <AlmacenLayout {...CFG} Icon={Ban}
      descripcion="Producto no apto, fuera del flujo de producción"
      mensajeVacio="Sin lotes rechazados">
      {lotes.length > 0 && <TablaLotes lotes={lotes} color={CFG.color} etapaOrden={7} almacenId="whs5"/>}
    </AlmacenLayout>
  )
}
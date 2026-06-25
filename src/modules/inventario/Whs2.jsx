// Whs2.jsx
import { Package } from 'lucide-react'
import { AlmacenLayout } from './_AlmacenLayout.jsx'
import { TablaLotes } from './_TablaLotes.jsx'
const CFG = { code: 'WHS2', label: 'Acondicionamiento', color: '#d97706', grad: ['#78350f','#d97706'] }
export default function Whs2({ lotes = [] }) {
  return (
    <AlmacenLayout {...CFG} Icon={Package}
      descripcion="Producto en proceso de acondicionamiento primario y secundario"
      mensajeVacio="Sin lotes en etapa de acondicionamiento">
      {lotes.length > 0 && <TablaLotes lotes={lotes} color={CFG.color} etapaOrden={4} almacenId="whs2" />}
    </AlmacenLayout>
  )
}
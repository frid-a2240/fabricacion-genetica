import { BadgeCheck } from 'lucide-react'
import { AlmacenLayout } from './_AlmacenLayout.jsx'
import { TablaLotes } from './_TablaLotes.jsx'

const CFG = { code: 'WHS4', label: 'Liberado', color: '#16a34a', grad: ['#14532d','#16a34a'] }

export default function Whs4({ lotes = [] }) {
  return (
    <AlmacenLayout
      {...CFG}
      Icon={BadgeCheck}
      descripcion="Lotes aceptados por calidad, listos para envío al cliente"
      mensajeVacio='Sin lotes liberados. Al aprobar en la etapa "Aceptado" aparecerán aquí.'
    >
      {lotes.length > 0 && <TablaLotes lotes={lotes} color={CFG.color} etapaOrden={7} almacenId="whs4"/>}
    </AlmacenLayout>
  )
}
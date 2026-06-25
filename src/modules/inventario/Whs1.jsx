import { FlaskConical } from 'lucide-react'
import { AlmacenLayout } from './_AlmacenLayout.jsx'
import { TablaLotes } from './_TablaLotes.jsx'

const CFG = { code: 'WHS1', label: 'Granel', color: '#7C3AED', grad: ['#4c1d95','#7C3AED'] }

export default function Whs1({ lotes = [] }) {
  return (
    <AlmacenLayout
      {...CFG}
      Icon={FlaskConical}
      descripcion="Producto granel completo, listo para pasar a acondicionamiento"
      mensajeVacio='Sin lotes con "Producción de Granel" terminada'
    >
      {lotes.length > 0 && <TablaLotes lotes={lotes} color={CFG.color} etapaOrden={2} almacenId="whs1"/>}
    </AlmacenLayout>
  )
}
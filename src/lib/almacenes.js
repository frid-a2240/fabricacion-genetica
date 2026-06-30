import {
  FlaskConical, Package, ShieldAlert, Ban, BadgeCheck,
} from 'lucide-react'
import { ORDEN_ETAPA } from '../constants/etapas.js'

// ═══════════════════════════════════════════════════════════════
// Catálogo de almacenes — fuente única usada por Inventario,
// Transferencias y cualquier otro módulo que necesite ubicar lotes.
// ═══════════════════════════════════════════════════════════════
export const ALMACENES = [
  { id: 'whs1', code: 'WHS1', label: 'Granel',            Icon: FlaskConical, color: '#7C3AED', grad: ['#4c1d95', '#7C3AED'] },
  { id: 'whs2', code: 'WHS2', label: 'Acondicionamiento', Icon: Package,      color: '#d97706', grad: ['#78350f', '#d97706'] },
  { id: 'whs3', code: 'WHS3', label: 'Cuarentena',        Icon: ShieldAlert,  color: '#ca8a04', grad: ['#713f12', '#ca8a04'] },
  { id: 'whs4', code: 'WHS4', label: 'Liberado',          Icon: BadgeCheck,   color: '#16a34a', grad: ['#14532d', '#16a34a'] },
  { id: 'whs5', code: 'WHS5', label: 'Rechazado',         Icon: Ban,          color: '#dc2626', grad: ['#7f1d1d', '#dc2626'] },
]

// ═══════════════════════════════════════════════════════════════
// Lógica de ubicación de lotes — un lote vive en UN solo almacén,
// el que corresponde a la etapa más avanzada con fecha_actual capturada.
// ═══════════════════════════════════════════════════════════════
export function fueraDeInventarioActivo(estatus) {
  return estatus === 'enviado'
}

export function getAlmacenActual(lote, fechasLote) {
  if (fueraDeInventarioActivo(lote.estatus)) return null
  if (lote.estatus === 'liberado')  return 'whs4'
  if (lote.estatus === 'rechazado') return 'whs5'
  const etapa = (orden) => fechasLote.find(f => f.etapas_proceso?.orden === orden)
  const eCuarentena = etapa(ORDEN_ETAPA.CUARENTENA)
  const e4 = etapa(ORDEN_ETAPA.PROD_ACOND)
  const e2 = etapa(ORDEN_ETAPA.PROD_GRANEL)
  if (eCuarentena?.fecha_actual) return 'whs3'
  if (e4?.fecha_actual) return 'whs2'
  if (e2?.fecha_actual) return 'whs1'
  return null
}

export function getCantidadEnAlmacen(item, almacenId) {
  const ordenPorAlmacen = {
    whs1: ORDEN_ETAPA.PROD_GRANEL,
    whs2: ORDEN_ETAPA.PROD_ACOND,
    whs3: ORDEN_ETAPA.CUARENTENA,
    whs4: ORDEN_ETAPA.ACEPTADO,
    whs5: ORDEN_ETAPA.ACEPTADO,
  }
  const orden = ordenPorAlmacen[almacenId]
  const etapa = item.fechasLote.find(f => f.etapas_proceso?.orden === orden)
  return etapa?.cantidad_actual ?? item.lote.cantidad ?? null
}

// Cliente Supabase para los endpoints serverless.
// Usa service_role key (NO la anon) para poder leer/escribir sin RLS.
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en variables de entorno')
}

export const supabaseAdmin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Helpers ─────────────────────────────────────────────────────────────────
export async function getUsuarioPorCorreo(correo) {
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select('*')
    .eq('correo', correo.toLowerCase())
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getUsuarioPorId(id) {
  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}
import { Box, Typography, Tooltip } from '@mui/material'
import { Clock, Package } from 'lucide-react'

const items = [
  { id: 'lotes',   label: 'Lotes',           icon: Package, desc: 'Seguimiento de procesos' },
  { id: 'tiempos', label: 'Tiempos Técnicos', icon: Clock,   desc: 'Acondicionamiento y procesos' },
]

export function Sidebar({ active, onChange, currentUser }) {
  return (
    <Box sx={{
      width: 220,
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #2E1065 0%, #3B0764 60%, #4C1D95 100%)',
      borderRight: '3px solid #7C3AED',
      display: 'flex',
      flexDirection: 'column',
      position: 'sticky',
      top: 0,
      flexShrink: 0,
    }}>
      {/* Logo */}
<Box sx={{
  px: 2, py: 3,
  borderBottom: '1px solid rgba(217,70,239,0.25)',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
}}>
  <Box
    component="img"
    src="/genetica-icon.png"
    alt="Genética Laboratorios"
    sx={{
      width: '95%',
      maxHeight: 90,
      objectFit: 'contain',
      filter: 'brightness(0) invert(1)',
    }}
  />
</Box>

      {/* Navegación */}
      <Box sx={{ flex: 1, px: 1.5, py: 2, display: 'flex', flexDirection: 'column', gap: 0.6 }}>
        <Typography sx={{
          fontSize: '0.62rem', fontWeight: 700, color: 'rgba(233,213,255,0.5)',
          textTransform: 'uppercase', letterSpacing: 1.5, px: 1.5, mb: 0.5
        }}>
          Módulos
        </Typography>

        {items.map(item => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <Tooltip key={item.id} title={item.desc} placement="right" arrow>
              <Box
                onClick={() => onChange(item.id)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 1.5, py: 1.3, borderRadius: 2.5,
                  cursor: 'pointer',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(217,70,239,0.25), rgba(124,58,237,0.25))'
                    : 'transparent',
                  border: isActive ? '1px solid rgba(217,70,239,0.5)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(217,70,239,0.3), rgba(124,58,237,0.3))'
                      : 'rgba(255,255,255,0.06)',
                  }
                }}
              >
                <Box sx={{
                  width: 32, height: 32, borderRadius: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isActive ? 'rgba(217,70,239,0.3)' : 'rgba(255,255,255,0.05)',
                }}>
                  <Icon size={17} color={isActive ? '#fff' : '#E9D5FF'} />
                </Box>
                <Typography sx={{
                  color: isActive ? '#fff' : '#E9D5FF',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : 500,
                  flex: 1
                }}>
                  {item.label}
                </Typography>
                {isActive && (
                  <Box sx={{ width: 4, height: 22, borderRadius: 1, backgroundColor: '#D946EF' }} />
                )}
              </Box>
            </Tooltip>
          )
        })}
      </Box>

      {/* Footer */}
      <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid rgba(217,70,239,0.25)' }}>
        {currentUser && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #D946EF, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 800, color: '#fff'
            }}>
              {currentUser.charAt(0).toUpperCase()}
            </Box>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography sx={{ color: '#fff', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser}
              </Typography>
              <Typography sx={{ color: '#E9D5FF', fontSize: '0.6rem' }}>
                conectado
              </Typography>
            </Box>
          </Box>
        )}
        <Typography sx={{ color: 'rgba(233,213,255,0.4)', fontSize: '0.58rem', mt: 1.5, textAlign: 'center', letterSpacing: 0.5 }}>
          v1.0 · {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  )
}
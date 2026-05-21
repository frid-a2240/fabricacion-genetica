import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import App from './App.jsx'
import { AuthGate } from './components/auth/AuthGate.jsx'

const theme = createTheme({
  palette: {
    primary:    { main: '#7C3AED' },   
    secondary:  { main: '#D946EF' },           
    background: { default: '#F5F3FF' },        
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Roboto Condensed", sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthGate>
        {({ usuario, permisos, onLogout }) => (
          <App usuario={usuario} permisos={permisos} onLogout={onLogout} />
        )}
      </AuthGate>
    </ThemeProvider>
  </StrictMode>
)
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import App from './App.jsx'

const theme = createTheme({
  palette: {
    primary:    { main: '#7C3AED' },           // morado principal
    secondary:  { main: '#D946EF' },           // magenta/rosa acento
    background: { default: '#F5F3FF' },        // fondo lavanda muy suave
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
      <App />
    </ThemeProvider>
  </StrictMode>
)
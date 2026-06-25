import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import App from './App.jsx'

const theme = createTheme({
  palette: {
    primary:    { main: '#7C3AED' },
    secondary:  { main: '#D946EF' },
    background: { default: '#F8FAFC' },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Roboto", sans-serif',
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


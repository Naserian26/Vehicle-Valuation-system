import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom' // <--- 1. ADD THIS IMPORT

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 2. WRAP YOUR APP IN BROWSER ROUTER */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
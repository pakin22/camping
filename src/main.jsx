import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import './index.css'
import App from './App.jsx'
import SignIn from './components/SignIn.jsx'
import Home from './components/Home.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter> {/* ห่อหุ้ม App ที่นี่ */}
      <App />
    </BrowserRouter>
  </StrictMode>,
);

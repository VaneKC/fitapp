// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Anamnese from './pages/Anamnese'
import Home     from './pages/Home'
import Treino   from './pages/Treino'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"              element={<Anamnese />} />
        <Route path="/home/:id"      element={<Home />} />
        <Route path="/treino/:id"    element={<Treino />} />
        <Route path="*"              element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

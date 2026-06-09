// src/App.js
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login          from './pages/Login'
import Anamnese       from './pages/Anamnese'
import Home           from './pages/Home'
import CheckIn        from './pages/CheckIn'
import Treino         from './pages/Treino'
import AvaliacaoNivel from './pages/AvaliacaoNivel'
import Progresso      from './pages/Progresso'
import Plano          from './pages/Plano'
import Perfil         from './pages/Perfil'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                  element={<Login />} />
        <Route path="/anamnese"          element={<Anamnese />} />
        <Route path="/home/:id"          element={<Home />} />
        <Route path="/checkin/:id"       element={<CheckIn />} />
        <Route path="/treino/:id"        element={<Treino />} />
        <Route path="/avaliacao/:id"     element={<AvaliacaoNivel />} />
        <Route path="/progresso/:id"     element={<Progresso />} />
        <Route path="/plano/:id"         element={<Plano />} />
        <Route path="/perfil/:id"        element={<Perfil />} />
        <Route path="*"                  element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

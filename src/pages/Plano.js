// src/pages/Plano.js
import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getMesocycleStructure, getWeekParams, calcCurrentWeek, getPhaseName } from '../lib/weeklyProgression'

const S = {
  wrap:      { fontFamily: 'system-ui, sans-serif', maxWidth: 400, margin: '0 auto', background: '#f5f5f5', minHeight: '100vh', paddingBottom: 80 },
  header:    { background: 'white', padding: '20px 16px 16px', borderBottom: '0.5px solid #eee' },
  title:     { fontSize: 22, fontWeight: 600, color: '#111', marginBottom: 2 },
  subtitle:  { fontSize: 13, color: '#888' },
  body:      { padding: '16px 16px 0' },
  card:      { background: 'white', borderRadius: 16, border: '0.5px solid #eee', padding: 16, marginBottom: 12 },
  cardLbl:   { fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: 10 },
  weekBlock: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '0.5px solid #f5f5f5' },
  weekNum:   { width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 },
  wDone:     { background: '#E1F5EE', color: '#085041' },
  wActive:   { background: '#1D9E75', color: 'white' },
  wDeload:   { background: '#FAEEDA', color: '#633806' },
  wFuture:   { background: '#f0f0f0', color: '#aaa' },
  weekInfo:  { flex: 1 },
  weekTitle: { fontSize: 13, fontWeight: 500, color: '#111' },
  weekSub:   { fontSize: 11, color: '#aaa', marginTop: 2 },
  splitPill: { fontSize: 11, padding: '3px 10px', borderRadius: 12, background: '#f0f0f0', color: '#666', border: '0.5px solid #eee', marginRight: 6, marginBottom: 4, display: 'inline-block' },
  splitOn:   { background: '#E1F5EE', color: '#085041', borderColor: '#9FE1CB' },
  infoRow:   { display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '7px 0', borderBottom: '0.5px solid #f5f5f5' },
  infoLbl:   { color: '#888' },
  infoVal:   { color: '#111', fontWeight: 500 },
  navbar:    { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 400, background: 'white', borderTop: '0.5px solid #eee', display: 'flex', justifyContent: 'space-around', padding: '10px 0 14px' },
  navItem:   { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 10, color: '#aaa', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' },
  navOn:     { color: '#1D9E75' },
}

export default function Plano() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(location.state?.user || null)
  const [plan, setPlan] = useState(location.state?.plan || null)

  useEffect(() => {
    if (!user && id) {
      supabase.from('users').select('*').eq('id', id).single()
        .then(({ data }) => { if (data) { setUser(data); setPlan(data.plan) } })
    }
  }, [id])

  if (!user || !plan) return <div style={{ padding: 32, textAlign: 'center', color: '#888', fontFamily: 'system-ui' }}>Carregando...</div>

  const level       = plan.level || 'beginner'
  const structure   = getMesocycleStructure(level)
  const totalWeeks  = structure.length
  const currentWeek = calcCurrentWeek(user?.created_at)
  const sessions    = plan.sessions || []
  const wp          = getWeekParams(level, currentWeek)

  function getWeekStyle(weekNum, phase) {
    if (phase === 'deload') return S.wDeload
    if (weekNum < currentWeek)  return S.wDone
    if (weekNum === currentWeek) return S.wActive
    return S.wFuture
  }

  function getProtocolName(p) {
    return { hypertrophy: 'Hipertrofia', fat_loss: 'Emagrecimento', hybrid: 'Híbrido', health: 'Saúde' }[p] || 'Condicionamento'
  }

  function getSplitName(s) {
    return { full_body: 'Full Body', upper_lower: 'Upper/Lower', ppl: 'PPL' }[s] || 'Full Body'
  }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={S.title}>Meu plano</div>
        <div style={S.subtitle}>{wp.phaseName} · {getProtocolName(plan.protocol)} · {totalWeeks} semanas</div>
      </div>

      <div style={S.body}>
        <div style={S.card}>
          <div style={S.cardLbl}>Semanas do mesociclo</div>
          {structure.map((w, i) => {
            const wpW = getWeekParams(level, w.week)
            return (
              <div key={w.week} style={{ ...S.weekBlock, ...(w.week === totalWeeks ? { borderBottom: 'none' } : {}) }}>
                <div style={{ ...S.weekNum, ...getWeekStyle(w.week, w.phase) }}>
                  {w.week < currentWeek ? '✓' : w.week}
                </div>
                <div style={S.weekInfo}>
                  <div style={S.weekTitle}>
                    Semana {w.week} — {w.phaseName}
                    {w.week < currentWeek && <span style={{ fontSize: 11, color: '#1D9E75', marginLeft: 6 }}>· Concluída</span>}
                    {w.week === currentWeek && <span style={{ fontSize: 11, color: '#1D9E75', marginLeft: 6 }}>· Em andamento</span>}
                  </div>
                  <div style={S.weekSub}>{wpW.sets} séries · {wpW.reps} reps · {wpW.effort}</div>
                </div>
                {w.week === currentWeek && <span style={{ fontSize: 11, color: '#1D9E75', fontWeight: 500 }}>← hoje</span>}
                {w.isDeload && w.week !== currentWeek && <span style={{ fontSize: 11, color: '#BA7517' }}>deload</span>}
                {w.week > currentWeek && !w.isDeload && <span style={{ fontSize: 16, color: '#ddd' }}>🔒</span>}
              </div>
            )
          })}
        </div>

        <div style={S.card}>
          <div style={S.cardLbl}>Divisão desta semana — {getSplitName(plan.split)}</div>
          <div style={{ marginBottom: 10 }}>
            {sessions.map((s, i) => (
              <span key={i} style={{ ...S.splitPill, ...(i === (currentWeek - 1) % sessions.length ? S.splitOn : {}) }}>
                {s.label}
              </span>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <div style={S.cardLbl}>Parâmetros desta semana</div>
          <div style={S.infoRow}><span style={S.infoLbl}>Protocolo</span><span style={S.infoVal}>{getProtocolName(plan.protocol)}</span></div>
          <div style={S.infoRow}><span style={S.infoLbl}>Divisão</span><span style={S.infoVal}>{getSplitName(plan.split)}</span></div>
          <div style={S.infoRow}><span style={S.infoLbl}>Fase atual</span><span style={S.infoVal}>{wp.phaseName}</span></div>
          <div style={S.infoRow}><span style={S.infoLbl}>Séries por exercício</span><span style={S.infoVal}>{wp.sets}</span></div>
          <div style={S.infoRow}><span style={S.infoLbl}>Repetições</span><span style={S.infoVal}>{wp.reps}</span></div>
          <div style={S.infoRow}><span style={S.infoLbl}>Esforço alvo</span><span style={S.infoVal}>{wp.effort}</span></div>
          <div style={{ ...S.infoRow, borderBottom: 'none' }}><span style={S.infoLbl}>Avaliação de nível</span><span style={S.infoVal}>Semana {totalWeeks} (deload)</span></div>
        </div>
      </div>

      <div style={S.navbar}>
        <button style={S.navItem} onClick={() => navigate(`/home/${id}`, { state: { plan, user } })}>🏠<span>Início</span></button>
        <button style={S.navItem} onClick={() => navigate(`/progresso/${id}`, { state: { plan, user } })}>📊<span>Progresso</span></button>
        <button style={{ ...S.navItem, ...S.navOn }}>📅<span>Plano</span></button>
        <button style={S.navItem} onClick={() => navigate(`/perfil/${id}`, { state: { plan, user } })}>👤<span>Perfil</span></button>
      </div>
    </div>
  )
}

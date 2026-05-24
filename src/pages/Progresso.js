// src/pages/Progresso.js
import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const S = {
  wrap:     { fontFamily: 'system-ui, sans-serif', maxWidth: 400, margin: '0 auto', background: '#f5f5f5', minHeight: '100vh', paddingBottom: 80 },
  header:   { background: 'white', padding: '20px 16px 16px', borderBottom: '0.5px solid #eee' },
  title:    { fontSize: 22, fontWeight: 600, color: '#111' },
  body:     { padding: '16px 16px 0' },
  seg:      { display: 'flex', background: 'white', borderRadius: 10, border: '0.5px solid #eee', padding: 3, marginBottom: 16 },
  segBtn:   { flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 500, border: 'none', background: 'transparent', borderRadius: 7, cursor: 'pointer', color: '#aaa', fontFamily: 'inherit' },
  segOn:    { background: '#1D9E75', color: 'white' },
  card:     { background: 'white', borderRadius: 16, border: '0.5px solid #eee', padding: 16, marginBottom: 12 },
  cardLbl:  { fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: 10 },
  grid2:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 },
  metr:     { background: '#f7f7f7', borderRadius: 10, padding: '10px 12px' },
  mLbl:     { fontSize: 11, color: '#aaa', marginBottom: 3 },
  mVal:     { fontSize: 20, fontWeight: 600, color: '#111' },
  mDelta:   { fontSize: 11, color: '#1D9E75' },
  muscleRow:{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  muscleName:{ fontSize: 12, color: '#333', width: 90, flexShrink: 0 },
  barBg:    { flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 3, background: '#1D9E75' },
  barVal:   { fontSize: 11, color: '#aaa', width: 36, textAlign: 'right' },
  levelBadge:{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: '#E1F5EE', color: '#085041', marginBottom: 10 },
  critRow:  { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8 },
  critIcon: { width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11 },
  critOk:   { background: '#E1F5EE', color: '#1D9E75' },
  critNo:   { background: '#f0f0f0', color: '#aaa', border: '0.5px solid #eee' },
  critLbl:  { flex: 1, color: '#333' },
  critSts:  { fontSize: 11, color: '#aaa' },
  infoBox:  { background: '#E1F5EE', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#085041', lineHeight: 1.6, marginTop: 10 },
  navbar:   { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 400, background: 'white', borderTop: '0.5px solid #eee', display: 'flex', justifyContent: 'space-around', padding: '10px 0 14px' },
  navItem:  { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 10, color: '#aaa', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' },
  navOn:    { color: '#1D9E75' },
}

export default function Progresso() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser]       = useState(location.state?.user || null)
  const [plan, setPlan]       = useState(location.state?.plan || null)
  const [logs, setLogs]       = useState([])
  const [tab, setTab]         = useState('volume')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!user && id) {
        const { data } = await supabase.from('users').select('*').eq('id', id).single()
        if (data) { setUser(data); setPlan(data.plan) }
      }
      const { data: logData } = await supabase
        .from('session_logs')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
      setLogs(logData || [])
      setLoading(false)
    }
    load()
  }, [id])

  function getLevelName(level) {
    return { beginner: 'Iniciante', basic: 'Básico', intermediate: 'Intermediário', advanced: 'Avançado' }[level] || 'Iniciante'
  }

  function getNextLevel(level) {
    return { beginner: 'Básico', basic: 'Intermediário', intermediate: 'Avançado', advanced: 'Avançado (máximo)' }[level] || 'Básico'
  }

  function getWeeksTrained() {
    if (!user?.created_at) return 0
    const diff = new Date() - new Date(user.created_at)
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 7))
  }

  function getAttendance() {
    if (!logs.length) return 0
    const weeksTrained = Math.max(getWeeksTrained(), 1)
    const daysPerWeek  = parseInt(user?.days_per_week) || 3
    const expected     = weeksTrained * daysPerWeek
    return Math.min(Math.round((logs.length / expected) * 100), 100)
  }

  const weeksTrained  = getWeeksTrained()
  const attendance    = getAttendance()
  const level         = plan?.level || 'beginner'
  const totalWeeks    = plan?.totalWeeks || 6

  // critérios por nível
  const criteria = {
    beginner: [
      { label: 'Tempo mínimo de treino', target: '12 semanas', current: `${weeksTrained} sem`, met: weeksTrained >= 12 },
      { label: 'Presença mínima de 80%', target: '80%', current: `${attendance}%`, met: attendance >= 80 },
      { label: 'Completou ao menos 1 mesociclo', target: '1 ciclo', current: logs.length >= 8 ? '✓' : `${logs.length} treinos`, met: logs.length >= 8 },
    ],
    basic: [
      { label: 'Tempo mínimo de treino', target: '32 semanas', current: `${weeksTrained} sem`, met: weeksTrained >= 32 },
      { label: 'Presença mínima de 80%', target: '80%', current: `${attendance}%`, met: attendance >= 80 },
      { label: 'Progressão linear estagnada', target: 'Estagnação 2 sem', current: 'Monitorando', met: false },
      { label: 'Tolera 4 sessões/semana', target: '4 dias/sem', current: `${user?.days_per_week || 3} dias/sem`, met: parseInt(user?.days_per_week) >= 4 },
    ],
    intermediate: [
      { label: 'Tempo de treino consistente', target: '2–3 anos', current: `${weeksTrained} sem`, met: weeksTrained >= 104 },
      { label: 'Presença mínima de 80%', target: '80%', current: `${attendance}%`, met: attendance >= 80 },
      { label: 'Progressão mensal estagnada', target: 'DUP sem resposta', current: 'Monitorando', met: false },
      { label: 'Domina autoregulação', target: 'RIR consistente', current: logs.length >= 20 ? '✓' : 'Em desenvolvimento', met: logs.length >= 20 },
    ],
    advanced: [
      { label: 'Manutenção e otimização', target: 'Contínuo', current: 'Nível máximo', met: true },
    ],
  }

  const currentCriteria = criteria[level] || criteria.beginner
  const metCount        = currentCriteria.filter(c => c.met).length

  // volume por grupo muscular (estimado baseado no plano)
  const muscleVolume = [
    { name: 'Costas',      sets: 14, max: 20 },
    { name: 'Pernas',      sets: 16, max: 20 },
    { name: 'Peito',       sets: 12, max: 20 },
    { name: 'Ombros',      sets: 10, max: 20 },
    { name: 'Bíceps',      sets: 8,  max: 20 },
    { name: 'Tríceps',     sets: 8,  max: 20 },
  ]

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#888', fontFamily: 'system-ui' }}>Carregando...</div>

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={S.title}>Meu progresso</div>
      </div>

      <div style={S.body}>
        <div style={S.seg}>
          {['volume','nivel'].map((t, i) => (
            <button key={t} style={{ ...S.segBtn, ...(tab === t ? S.segOn : {}) }} onClick={() => setTab(t)}>
              {['Volume','Nível'][i]}
            </button>
          ))}
        </div>

        {tab === 'volume' && (
          <>
            <div style={S.grid2}>
              <div style={S.metr}>
                <div style={S.mLbl}>Treinos feitos</div>
                <div style={S.mVal}>{logs.length}</div>
                <div style={S.mDelta}>{weeksTrained} semanas ativas</div>
              </div>
              <div style={S.metr}>
                <div style={S.mLbl}>Presença</div>
                <div style={S.mVal}>{attendance}<span style={{ fontSize: 13, fontWeight: 400 }}>%</span></div>
                <div style={{ fontSize: 11, color: attendance >= 80 ? '#1D9E75' : '#BA7517' }}>
                  {attendance >= 80 ? 'Meta atingida ✓' : 'Meta: 80%'}
                </div>
              </div>
            </div>

            <div style={S.card}>
              <div style={S.cardLbl}>Volume semanal por grupo muscular</div>
              {muscleVolume.map((m, i) => (
                <div key={i} style={S.muscleRow}>
                  <span style={S.muscleName}>{m.name}</span>
                  <div style={S.barBg}><div style={{ ...S.barFill, width: `${Math.round((m.sets / m.max) * 100)}%` }} /></div>
                  <span style={S.barVal}>{m.sets}s</span>
                </div>
              ))}
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>s = séries por semana · Meta: 10–20 séries por grupo</div>
            </div>

            {logs.length === 0 && (
              <div style={{ ...S.card, textAlign: 'center', color: '#aaa', fontSize: 13, padding: 24 }}>
                Nenhum treino registrado ainda.{'\n'}Complete seu primeiro treino para ver os dados aqui!
              </div>
            )}
          </>
        )}

        {tab === 'nivel' && (
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={S.levelBadge}>{getLevelName(level)}</span>
              <span style={{ fontSize: 13, color: '#888' }}>Semana {weeksTrained} de treino</span>
            </div>
            <div style={S.cardLbl}>Critérios para {getNextLevel(level)}</div>
            {currentCriteria.map((c, i) => (
              <div key={i} style={S.critRow}>
                <div style={{ ...S.critIcon, ...(c.met ? S.critOk : S.critNo) }}>
                  {c.met ? '✓' : ''}
                </div>
                <span style={S.critLbl}>{c.label}</span>
                <span style={{ ...S.critSts, color: c.met ? '#1D9E75' : '#aaa' }}>{c.current}</span>
              </div>
            ))}
            <div style={S.infoBox}>
              {metCount} de {currentCriteria.length} critérios atingidos.
              {metCount < currentCriteria.length
                ? ' Continue treinando — a avaliação acontece ao fim de cada mesociclo.'
                : ' 🎉 Todos os critérios atingidos! Você será promovido ao fim deste mesociclo.'}
            </div>
          </div>
        )}
      </div>

      <div style={S.navbar}>
        <button style={S.navItem} onClick={() => navigate(`/home/${id}`, { state: { plan, user } })}>🏠<span>Início</span></button>
        <button style={{ ...S.navItem, ...S.navOn }}>📊<span>Progresso</span></button>
        <button style={S.navItem} onClick={() => navigate(`/plano/${id}`, { state: { plan, user } })}>📅<span>Plano</span></button>
        <button style={S.navItem} onClick={() => navigate(`/perfil/${id}`, { state: { plan, user } })}>👤<span>Perfil</span></button>
      </div>
    </div>
  )
}

// src/pages/Home.js
import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const S = {
  wrap:     { fontFamily: 'system-ui, sans-serif', maxWidth: 400, margin: '0 auto', background: '#f5f5f5', minHeight: '100vh', paddingBottom: 80 },
  header:   { background: 'white', padding: '20px 16px 16px', borderBottom: '0.5px solid #eee' },
  greeting: { fontSize: 22, fontWeight: 600, color: '#111', marginBottom: 2 },
  greetSub: { fontSize: 13, color: '#888' },
  body:     { padding: '16px 16px 0' },
  card:     { background: 'white', borderRadius: 16, border: '0.5px solid #eee', padding: 16, marginBottom: 12 },
  cardLbl:  { fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: 8 },
  wTitle:   { fontSize: 18, fontWeight: 600, color: '#111', marginBottom: 6 },
  metaRow:  { display: 'flex', gap: 16, marginBottom: 14 },
  meta:     { fontSize: 13, color: '#666', display: 'flex', alignItems: 'center', gap: 4 },
  exRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f7f7f7', borderRadius: 8, marginBottom: 6 },
  exName:   { fontSize: 13, color: '#222' },
  exParam:  { fontSize: 12, color: '#999' },
  btnStart: { width: '100%', padding: 12, borderRadius: 10, background: '#1D9E75', border: 'none', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8, fontFamily: 'inherit' },
  weekRow:  { display: 'flex', gap: 4, justifyContent: 'space-between', marginBottom: 10 },
  dayCol:   { flex: 1, textAlign: 'center' },
  dayLbl:   { fontSize: 10, color: '#aaa', marginBottom: 4 },
  dayCir:   { width: 30, height: 30, borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500 },
  phaseBg:  { height: 4, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  phaseFl:  { height: '100%', background: '#1D9E75', borderRadius: 4 },
  phaseMeta:{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa' },
  metrGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  metr:     { background: 'white', borderRadius: 12, border: '0.5px solid #eee', padding: '10px 12px' },
  mLbl:     { fontSize: 11, color: '#aaa', marginBottom: 3 },
  mVal:     { fontSize: 20, fontWeight: 600, color: '#111' },
  mDelta:   { fontSize: 11, color: '#1D9E75' },
  navbar:   { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 400, background: 'white', borderTop: '0.5px solid #eee', display: 'flex', justifyContent: 'space-around', padding: '10px 0 14px' },
  navItem:  { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 10, color: '#aaa', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' },
  navOn:    { color: '#1D9E75' },
}

const WEEK_DAYS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']

export default function Home() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(location.state?.user || null)
  const [plan, setPlan] = useState(location.state?.plan || null)
  const [currentWeek, setCurrentWeek] = useState(1)
  const [sessionIndex, setSessionIndex] = useState(0)

  useEffect(() => {
    if (!user && id) {
      supabase.from('users').select('*').eq('id', id).single()
        .then(({ data }) => {
          if (data) {
            setUser(data)
            setPlan(data.plan)
            calculateWeek(data.created_at)
            calculateSessionIndex(data)
          }
        })
    } else if (user) {
      calculateWeek(user.created_at)
      calculateSessionIndex(user)
    }
  }, [id, user])

  function calculateWeek(createdAt) {
    if (!createdAt) return
    const created = new Date(createdAt)
    const now = new Date()
    const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24))
    const week = Math.floor(diffDays / 7) + 1
    setCurrentWeek(week)
  }

  function calculateSessionIndex(userData) {
    const preferredDays = userData.preferred_days || []
    const sessions = userData.plan?.sessions || []
    if (!sessions.length) return

    const dayNames = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
    const todayName = dayNames[new Date().getDay()]

    if (preferredDays.length > 0) {
      // encontra qual índice de treino corresponde ao dia de hoje
      const idx = preferredDays.indexOf(todayName)
      if (idx !== -1) {
        setSessionIndex(idx % sessions.length)
      } else {
        // hoje não é dia de treino — mostra o próximo treino
        const todayNum = new Date().getDay()
        const dayNums  = preferredDays.map(d => dayNames.indexOf(d))
        const next     = dayNums.find(n => n > todayNum) ?? dayNums[0]
        const nextIdx  = dayNums.indexOf(next)
        setSessionIndex(nextIdx % sessions.length)
      }
    } else {
      // fallback: distribui automaticamente
      const days = parseInt(userData.days_per_week) || 3
      const dayOfWeek = new Date().getDay()
      setSessionIndex(dayOfWeek % Math.min(days, sessions.length))
    }
  }

  function getProtocolName(protocol) {
    const map = {
      hypertrophy: 'Hipertrofia',
      fat_loss: 'Emagrecimento',
      hybrid: 'Híbrido',
      health: 'Saúde e Condicionamento',
    }
    return map[protocol] || 'Condicionamento'
  }

  function getDayStatus(dayIndex) {
    const today = new Date().getDay()
    const todayIndex = today === 0 ? 6 : today - 1
    const dayNames = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']
    const preferredDays = user?.preferred_days || []
    const trainingIndices = preferredDays.length > 0
      ? preferredDays.map(d => dayNames.indexOf(d)).filter(n => n !== -1)
      : getTrainingDays(parseInt(user?.days_per_week) || 3)

    if (dayIndex === todayIndex) return 'today'
    if (dayIndex > todayIndex) return trainingIndices.includes(dayIndex) ? 'future' : 'rest'
    if (trainingIndices.includes(dayIndex)) return 'done'
    return 'rest'
  }

  function getTrainingDays(daysPerWeek) {
    const options = {
      1: [1], 2: [1, 4], 3: [1, 3, 5],
      4: [1, 2, 4, 5], 5: [1, 2, 3, 4, 5], 6: [1, 2, 3, 4, 5, 6],
    }
    return options[daysPerWeek] || options[3]
  }

  if (!user || !plan) return (
    <div style={{ padding: 32, textAlign: 'center', color: '#888', fontFamily: 'system-ui' }}>
      Carregando...
    </div>
  )

  const firstName = user.nome?.split(' ')[0] || 'você'
  const days = parseInt(user.days_per_week) || 3
  const sessions = plan.sessions || []
  const todaySession = sessions[sessionIndex % sessions.length]
  const totalWeeks = plan.totalWeeks || 6
  const weekPct = Math.round((currentWeek / totalWeeks) * 100)

  function DayCircle({ dayIndex }) {
    const status = getDayStatus(dayIndex)
    const dayNames = ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo']
    const preferredDays = user?.preferred_days || []
    const trainingIndices = preferredDays.length > 0
      ? preferredDays.map(d => dayNames.indexOf(d)).filter(n => n !== -1)
      : getTrainingDays(parseInt(user?.days_per_week) || 3)
    const isTraining = trainingIndices.includes(dayIndex)
    const styles = {
      done:   { background: '#1D9E75', color: 'white' },
      today:  { background: 'white', border: '2px solid #1D9E75', color: '#085041' },
      rest:   { background: '#f0f0f0', color: '#aaa', fontSize: 10 },
      future: { background: 'white', border: '0.5px solid #eee', color: '#ccc' },
    }
    return (
      <div style={{ ...S.dayCir, ...styles[status] }}>
        {status === 'done' ? '✓' : status === 'today' ? 'Hj' : !isTraining ? 'D' : ''}
      </div>
    )
  }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={S.greeting}>Olá, {firstName}! 👋</div>
        <div style={S.greetSub}>
          Semana {currentWeek} · {plan.mesocycleName || 'Acumulação 1'} · {getProtocolName(plan.protocol)}
        </div>
      </div>

      <div style={S.body}>
        {todaySession ? (
          <div style={S.card}>
            <div style={S.cardLbl}>Treino de hoje</div>
            <div style={S.wTitle}>{todaySession.label}</div>
            <div style={S.metaRow}>
              <span style={S.meta}>⏱ {user.session_duration || '45–60 min'}</span>
              <span style={S.meta}>🔄 {todaySession.exercises?.length || 0} exercícios</span>
              <span style={S.meta}>📋 {plan.params?.sets || '3'} séries</span>
            </div>
            {todaySession.exercises?.slice(0, 3).map((ex, i) => (
              <div key={i} style={S.exRow}>
                <span style={S.exName}>{ex.name}</span>
                <span style={S.exParam}>{ex.sets}×{ex.reps}</span>
              </div>
            ))}
            {todaySession.exercises?.length > 3 && (
              <div style={{ ...S.exRow, justifyContent: 'center', color: '#aaa', fontSize: 12 }}>
                + {todaySession.exercises.length - 3} exercício{todaySession.exercises.length - 3 > 1 ? 's' : ''}
              </div>
            )}
            <button
              style={S.btnStart}
              onClick={() => navigate(`/treino/${id}`, { state: { session: todaySession, plan, user } })}
            >
              ▶ Iniciar treino
            </button>
          </div>
        ) : (
          <div style={S.card}>
            <div style={S.cardLbl}>Hoje</div>
            <div style={S.wTitle}>Dia de descanso 🛌</div>
            <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>
              Aproveite para recuperar. O descanso é parte do treino!
            </div>
          </div>
        )}

        <div style={S.card}>
          <div style={S.cardLbl}>Semana atual</div>
          <div style={S.weekRow}>
            {WEEK_DAYS.map((d, i) => (
              <div key={i} style={S.dayCol}>
                <div style={S.dayLbl}>{d}</div>
                <DayCircle dayIndex={i} />
              </div>
            ))}
          </div>
          <div style={S.phaseBg}>
            <div style={{ ...S.phaseFl, width: Math.min(weekPct, 100) + '%' }} />
          </div>
          <div style={S.phaseMeta}>
            <span>Semana {currentWeek} de {totalWeeks}</span>
            <span>{Math.min(weekPct, 100)}% do mesociclo</span>
          </div>
        </div>

        <div style={S.metrGrid}>
          <div style={S.metr}>
            <div style={S.mLbl}>Nível atual</div>
            <div style={{ ...S.mVal, fontSize: 16 }}>
              {plan.level === 'beginner' ? 'Iniciante' :
               plan.level === 'basic' ? 'Básico' :
               plan.level === 'intermediate' ? 'Intermediário' : 'Avançado'}
            </div>
            <div style={{ fontSize: 11, color: '#aaa' }}>{plan.split?.toUpperCase()}</div>
          </div>
          <div style={S.metr}>
            <div style={S.mLbl}>Semana do plano</div>
            <div style={S.mVal}>{currentWeek}<span style={{ fontSize: 13, fontWeight: 400 }}> / {totalWeeks}</span></div>
            <div style={S.mDelta}>{plan.phase === 'deload' ? '⚡ Semana de deload' : '↑ Em progresso'}</div>
          </div>
        </div>
      </div>

      <div style={S.navbar}>
        <button style={{ ...S.navItem, ...S.navOn }}>🏠<span>Início</span></button>
        <button style={S.navItem} onClick={() => navigate(`/progresso/${id}`, { state: { plan, user } })}>
          📊<span>Progresso</span>
        </button>
        <button style={S.navItem} onClick={() => navigate(`/plano/${id}`, { state: { plan, user } })}>
          📅<span>Plano</span>
        </button>
        <button style={S.navItem} onClick={() => navigate(`/perfil/${id}`, { state: { plan, user } })}>
          👤<span>Perfil</span>
        </button>
      </div>
    </div>
  )
}

// src/pages/Home.js
import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getWeekParams, isDeloadWeek, calcCurrentWeek, getPhaseName, getMesocycleStructure } from '../lib/weeklyProgression'

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
  btnDeload:{ width: '100%', padding: 12, borderRadius: 10, background: '#BA7517', border: 'none', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8, fontFamily: 'inherit' },
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
  mVal:     { fontSize: 18, fontWeight: 600, color: '#111' },
  mDelta:   { fontSize: 11, color: '#1D9E75' },
  deloadBanner: { background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 12, padding: '12px 14px', marginBottom: 12, fontSize: 13, color: '#633806', lineHeight: 1.6 },
  navbar:   { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 400, background: 'white', borderTop: '0.5px solid #eee', display: 'flex', justifyContent: 'space-around', padding: '10px 0 14px' },
  navItem:  { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 10, color: '#aaa', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' },
  navOn:    { color: '#1D9E75' },
}

const WEEK_DAYS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']

export default function Home() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser]         = useState(location.state?.user || null)
  const [plan, setPlan]         = useState(location.state?.plan || null)
  const [currentWeek, setCurrentWeek] = useState(1)
  const [sessionIndex, setSessionIndex] = useState(location.state?.nextSessionIndex ?? null)

  useEffect(() => {
    if (!user && id) {
      supabase.from('users').select('*').eq('id', id).single()
        .then(({ data }) => {
          if (data) {
            setUser(data)
            setPlan(data.plan)
            setCurrentWeek(calcCurrentWeek(data.created_at))
            calculateSessionIndex(data)
          }
        })
    } else if (user) {
      setCurrentWeek(calcCurrentWeek(user.created_at))
      calculateSessionIndex(user)
    }
  }, [id, user])

  function calculateSessionIndex(userData) {
    if (location.state?.nextSessionIndex !== undefined && location.state?.nextSessionIndex !== null) {
      setSessionIndex(location.state.nextSessionIndex)
      return
    }
    const preferredDays = userData.preferred_days || []
    const sessions = userData.plan?.sessions || []
    if (!sessions.length) return
    const dayNames = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado']
    const todayName = dayNames[new Date().getDay()]
    if (preferredDays.length > 0) {
      const idx = preferredDays.indexOf(todayName)
      if (idx !== -1) { setSessionIndex(idx % sessions.length); return }
      const todayNum = new Date().getDay()
      const dayNums  = preferredDays.map(d => dayNames.indexOf(d))
      const next     = dayNums.find(n => n > todayNum) ?? dayNums[0]
      setSessionIndex(dayNums.indexOf(next) % sessions.length)
    } else {
      setSessionIndex(new Date().getDay() % Math.min(parseInt(userData.days_per_week) || 3, sessions.length))
    }
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
    const options = { 1:[1], 2:[1,4], 3:[1,3,5], 4:[1,2,4,5], 5:[1,2,3,4,5], 6:[1,2,3,4,5,6] }
    return options[daysPerWeek] || options[3]
  }

  function getProtocolName(protocol) {
    return { hypertrophy:'Hipertrofia', fat_loss:'Emagrecimento', hybrid:'Híbrido', health:'Saúde' }[protocol] || 'Condicionamento'
  }

  if (!user || !plan) return <div style={{ padding: 32, textAlign: 'center', color: '#888', fontFamily: 'system-ui' }}>Carregando...</div>

  const firstName   = user.nome?.split(' ')[0] || 'você'
  const sessions    = plan.sessions || []
  const todaySession = sessions[sessionIndex % sessions.length]
  const structure   = getMesocycleStructure(plan.level || 'beginner')
  const totalWeeks  = structure.length
  const weekPct     = Math.round((currentWeek / totalWeeks) * 100)
  const wp          = getWeekParams(plan.level || 'beginner', currentWeek)
  const deload      = isDeloadWeek(plan.level || 'beginner', currentWeek)

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
          Semana {currentWeek} · {wp.phaseName} · {getProtocolName(plan.protocol)}{deload ? ' 🔋' : ''}
        </div>
      </div>

      <div style={S.body}>
        {deload && (
          <div style={S.deloadBanner}>
            🔋 <strong>Semana de deload!</strong> Volume e intensidade reduzidos. Foque na técnica e na recuperação.
          </div>
        )}

        {todaySession ? (
          <div style={S.card}>
            <div style={S.cardLbl}>Treino de hoje</div>
            <div style={S.wTitle}>{todaySession.label}</div>
            <div style={S.metaRow}>
              <span style={S.meta}>⏱ {user.session_duration || '45–60 min'}</span>
              <span style={S.meta}>🔄 {todaySession.exercises?.length || 0} exercícios</span>
              <span style={S.meta}>📋 {wp.sets} séries</span>
            </div>
            {todaySession.exercises?.slice(0, 3).map((ex, i) => (
              <div key={i} style={S.exRow}>
                <span style={S.exName}>{ex.name}</span>
                <span style={S.exParam}>{wp.sets}×{wp.reps}</span>
              </div>
            ))}
            {todaySession.exercises?.length > 3 && (
              <div style={{ ...S.exRow, justifyContent: 'center', color: '#aaa', fontSize: 12 }}>
                + {todaySession.exercises.length - 3} exercício{todaySession.exercises.length - 3 > 1 ? 's' : ''}
              </div>
            )}
            <button
              style={deload ? S.btnDeload : S.btnStart}
              onClick={() => navigate(`/treino/${id}`, { state: { session: todaySession, plan, user } })}
            >
              {deload ? '🔋 Iniciar treino de deload' : '▶ Iniciar treino'}
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
            <div style={{ ...S.phaseFl, width: Math.min(weekPct, 100) + '%', background: deload ? '#BA7517' : '#1D9E75' }} />
          </div>
          <div style={S.phaseMeta}>
            <span>Semana {currentWeek} de {totalWeeks}</span>
            <span>{Math.min(weekPct, 100)}% do mesociclo</span>
          </div>
        </div>

        <div style={S.metrGrid}>
          <div style={S.metr}>
            <div style={S.mLbl}>Fase atual</div>
            <div style={{ ...S.mVal, fontSize: 15 }}>{wp.phaseName}</div>
            <div style={{ fontSize: 11, color: deload ? '#BA7517' : '#aaa' }}>
              {deload ? '🔋 Recuperação' : `${wp.sets} séries · ${wp.reps} reps`}
            </div>
          </div>
          <div style={S.metr}>
            <div style={S.mLbl}>Nível</div>
            <div style={{ ...S.mVal, fontSize: 15 }}>
              {plan.level === 'beginner' ? 'Iniciante' : plan.level === 'basic' ? 'Básico' : plan.level === 'intermediate' ? 'Intermediário' : 'Avançado'}
            </div>
            <div style={S.mDelta}>↑ Em progressão</div>
          </div>
        </div>
      </div>

      <div style={S.navbar}>
        <button style={{ ...S.navItem, ...S.navOn }}>🏠<span>Início</span></button>
        <button style={S.navItem} onClick={() => navigate(`/progresso/${id}`, { state: { plan, user } })}>📊<span>Progresso</span></button>
        <button style={S.navItem} onClick={() => navigate(`/plano/${id}`, { state: { plan, user } })}>📅<span>Plano</span></button>
        <button style={S.navItem} onClick={() => navigate(`/perfil/${id}`, { state: { plan, user } })}>👤<span>Perfil</span></button>
      </div>
    </div>
  )
}

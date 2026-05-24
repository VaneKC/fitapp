// src/pages/Home.js
import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const S = {
  wrap:    { fontFamily: 'system-ui, sans-serif', maxWidth: 400, margin: '0 auto', background: '#f5f5f5', minHeight: '100vh', paddingBottom: 80 },
  header:  { background: 'white', padding: '20px 16px 16px', borderBottom: '0.5px solid #eee' },
  greeting:{ fontSize: 22, fontWeight: 600, color: '#111', marginBottom: 2 },
  greetSub:{ fontSize: 13, color: '#888' },
  body:    { padding: '16px 16px 0' },
  card:    { background: 'white', borderRadius: 16, border: '0.5px solid #eee', padding: '16px', marginBottom: 12 },
  cardLbl: { fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: 8 },
  wTitle:  { fontSize: 18, fontWeight: 600, color: '#111', marginBottom: 6 },
  metaRow: { display: 'flex', gap: 16, marginBottom: 14 },
  meta:    { fontSize: 13, color: '#666', display: 'flex', alignItems: 'center', gap: 4 },
  exRow:   { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f7f7f7', borderRadius: 8, marginBottom: 6 },
  exName:  { fontSize: 13, color: '#222' },
  exParam: { fontSize: 12, color: '#999' },
  btnStart:{ width: '100%', padding: 12, borderRadius: 10, background: '#1D9E75', border: 'none', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8, fontFamily: 'inherit' },
  weekRow: { display: 'flex', gap: 4, justifyContent: 'space-between', marginBottom: 10 },
  dayCol:  { flex: 1, textAlign: 'center' },
  dayLbl:  { fontSize: 10, color: '#aaa', marginBottom: 4 },
  dayCir:  { width: 30, height: 30, borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 500 },
  phaseBg: { height: 4, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  phaseFl: { height: '100%', background: '#1D9E75', borderRadius: 4 },
  phaseMeta:{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#aaa' },
  metrGrid:{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  metr:    { background: '#f7f7f7', borderRadius: 10, padding: '10px 12px' },
  mLbl:    { fontSize: 11, color: '#aaa', marginBottom: 3 },
  mVal:    { fontSize: 20, fontWeight: 600, color: '#111' },
  mDelta:  { fontSize: 11, color: '#1D9E75' },
  navbar:  { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 400, background: 'white', borderTop: '0.5px solid #eee', display: 'flex', justifyContent: 'space-around', padding: '10px 0 14px' },
  navItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 10, color: '#aaa', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' },
  navOn:   { color: '#1D9E75' },
}

const WEEK_DAYS = ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']

export default function Home() {
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
  }, [id, user])

  if (!user || !plan) return <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>Carregando...</div>

  const firstName = user.nome?.split(' ')[0] || 'você'
  const todaySession = plan.sessions?.[0]
  const days = parseInt(user.days_per_week) || 3

  // gera array de dias da semana com status
  const weekStatus = WEEK_DAYS.map((d, i) => {
    if (i === 0) return { label: d, status: 'done' }
    if (i === 1 && days < 7) return { label: d, status: 'rest' }
    if (i === 2) return { label: d, status: 'done' }
    if (i === 3) return { label: d, status: 'today' }
    if (i === 6) return { label: d, status: 'rest' }
    return { label: d, status: 'future' }
  })

  function DayCircle({ status, label }) {
    const styles = {
      done:   { background: '#1D9E75', color: 'white' },
      today:  { background: 'white', border: '2px solid #1D9E75', color: '#085041' },
      rest:   { background: '#f0f0f0', color: '#aaa', fontSize: 10 },
      future: { background: 'white', border: '0.5px solid #eee', color: '#ccc' },
    }
    return (
      <div style={{...S.dayCir, ...styles[status]}}>
        {status === 'done' ? '✓' : status === 'today' ? 'Hj' : status === 'rest' ? 'D' : ''}
      </div>
    )
  }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={S.greeting}>Olá, {firstName}! 👋</div>
        <div style={S.greetSub}>Semana 3 · {plan.mesocycleName} · {plan.protocol === 'hypertrophy' ? 'Hipertrofia' : plan.protocol === 'fat_loss' ? 'Emagrecimento' : 'Condicionamento'}</div>
      </div>

      <div style={S.body}>
        {todaySession && (
          <div style={S.card}>
            <div style={S.cardLbl}>Treino de hoje</div>
            <div style={S.wTitle}>{todaySession.label}</div>
            <div style={S.metaRow}>
              <span style={S.meta}>⏱ {user.session_duration || '45–60 min'}</span>
              <span style={S.meta}>🔄 {todaySession.exercises?.length} exercícios</span>
              <span style={S.meta}>📋 {plan.params?.sets} séries</span>
            </div>
            {todaySession.exercises?.slice(0, 3).map((ex, i) => (
              <div key={i} style={S.exRow}>
                <span style={S.exName}>{ex.name}</span>
                <span style={S.exParam}>{ex.sets}×{ex.reps}</span>
              </div>
            ))}
            {todaySession.exercises?.length > 3 && (
              <div style={{...S.exRow, justifyContent:'center', color:'#aaa', fontSize:12}}>
                + {todaySession.exercises.length - 3} exercício{todaySession.exercises.length - 3 > 1 ? 's' : ''}
              </div>
            )}
            <button style={S.btnStart} onClick={() => navigate(`/treino/${id}`, { state: { session: todaySession, plan, user } })}>
              ▶ Iniciar treino
            </button>
          </div>
        )}

        <div style={S.card}>
          <div style={S.cardLbl}>Semana atual</div>
          <div style={S.weekRow}>
            {weekStatus.map((d, i) => (
              <div key={i} style={S.dayCol}>
                <div style={S.dayLbl}>{d.label}</div>
                <DayCircle status={d.status} label={d.label} />
              </div>
            ))}
          </div>
          <div style={S.phaseBg}><div style={{...S.phaseFl, width: '45%'}} /></div>
          <div style={S.phaseMeta}><span>Semana 3 de {plan.totalWeeks}</span><span>45% do mesociclo</span></div>
        </div>

        <div style={S.metrGrid}>
          <div style={S.metr}><div style={S.mLbl}>Volume semanal</div><div style={S.mVal}>4.820<span style={{fontSize:13,fontWeight:400}}> kg</span></div><div style={S.mDelta}>↑ +12% esta semana</div></div>
          <div style={S.metr}><div style={S.mLbl}>Sequência</div><div style={S.mVal}>8<span style={{fontSize:13,fontWeight:400}}> dias</span></div><div style={{fontSize:11,color:'#aaa'}}>Recorde: 14 dias</div></div>
        </div>
      </div>

      <div style={S.navbar}>
        <button style={{...S.navItem, ...S.navOn}}>🏠<span>Início</span></button>
        <button style={S.navItem} onClick={() => navigate(`/progresso/${id}`, { state: { plan, user } })}>📊<span>Progresso</span></button>
        <button style={S.navItem} onClick={() => navigate(`/plano/${id}`, { state: { plan, user } })}>📅<span>Plano</span></button>
        <button style={S.navItem}>👤<span>Perfil</span></button>
      </div>
    </div>
  )
}

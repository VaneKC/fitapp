// src/pages/Treino.js
import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const S = {
  wrap:     { fontFamily: 'system-ui, sans-serif', maxWidth: 400, margin: '0 auto', background: '#f5f5f5', minHeight: '100vh' },
  topbar:   { background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: '0.5px solid #eee' },
  tbTitle:  { fontSize: 14, fontWeight: 600, color: '#111' },
  timer:    { fontSize: 13, fontWeight: 600, color: '#1D9E75', background: '#E1F5EE', padding: '4px 12px', borderRadius: 20 },
  closeBtn: { width: 32, height: 32, borderRadius: '50%', border: '0.5px solid #eee', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 },
  progBar:  { height: 4, background: '#f0f0f0' },
  progFill: { height: '100%', background: '#1D9E75', transition: 'width .4s' },
  dots:     { display: 'flex', gap: 4, justifyContent: 'center', padding: '10px 0 4px' },
  dot:      { width: 6, height: 6, borderRadius: '50%', background: '#ddd' },
  dotDone:  { background: '#9FE1CB' },
  dotOn:    { background: '#1D9E75', width: 16, borderRadius: 3 },
  body:     { padding: '12px 16px' },
  card:     { background: 'white', borderRadius: 16, border: '0.5px solid #eee', padding: 16, marginBottom: 10 },
  exNum:    { fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 },
  exTitle:  { fontSize: 20, fontWeight: 600, color: '#111', marginBottom: 4 },
  exMuscle: { fontSize: 13, color: '#888', marginBottom: 14 },
  pillRow:  { display: 'flex', gap: 8, marginBottom: 14 },
  pill:     { flex: 1, background: '#f7f7f7', borderRadius: 10, padding: '8px 10px', textAlign: 'center' },
  pillLbl:  { fontSize: 10, color: '#aaa', marginBottom: 2 },
  pillVal:  { fontSize: 14, fontWeight: 600, color: '#111' },
  effLblR:  { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginBottom: 4 },
  eBarBg:   { height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden', marginBottom: 14 },
  eBarFl:   { height: '100%', borderRadius: 3, transition: 'width .3s, background .3s' },
  tip:      { background: '#f7f7f7', borderLeft: '3px solid #1D9E75', padding: '9px 12px', fontSize: 12, color: '#666', lineHeight: 1.6, marginBottom: 14 },
  setsHdr:  { display: 'grid', gridTemplateColumns: '28px 1fr 70px 100px', gap: 6, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#aaa', paddingBottom: 8, borderBottom: '0.5px solid #eee', marginBottom: 6 },
  setRow:   { display: 'grid', gridTemplateColumns: '28px 1fr 70px 100px', gap: 6, alignItems: 'center', padding: '7px 0', borderBottom: '0.5px solid #f5f5f5' },
  setN:     { width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 },
  sNDone:   { background: '#E1F5EE', color: '#085041' },
  sNOn:     { background: '#1D9E75', color: 'white' },
  sNFut:    { background: '#f0f0f0', color: '#aaa' },
  setInfo:  { fontSize: 12, color: '#888' },
  rBtns:    { display: 'flex', gap: 3 },
  rBtn:     { flex: 1, height: 28, borderRadius: 4, border: '0.5px solid #eee', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: '#f7f7f7', color: '#888', transition: 'all .12s' },
  btnConf:  { width: '100%', padding: 12, borderRadius: 10, background: '#1D9E75', border: 'none', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 },
  btnTech:  { width: '100%', padding: 9, borderRadius: 10, background: 'transparent', border: '0.5px solid #eee', color: '#888', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', marginTop: 6 },
  restWrap: { textAlign: 'center', padding: '20px 16px' },
  restTit:  { fontSize: 13, color: '#888', marginBottom: 4 },
  restNum:  { fontSize: 56, fontWeight: 600, color: '#111', marginBottom: 6, fontVariantNumeric: 'tabular-nums' },
  restMsg:  { fontSize: 13, color: '#666', marginBottom: 20, lineHeight: 1.6, padding: '0 12px' },
  nextCard: { background: 'white', borderRadius: 12, border: '0.5px solid #eee', padding: '12px 14px', textAlign: 'left', marginBottom: 10 },
  nextLbl:  { fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#aaa', marginBottom: 4 },
  nextName: { fontSize: 13, fontWeight: 600, color: '#111' },
  techWrap: { padding: '0 16px' },
  techCard: { background: 'white', borderRadius: 16, border: '0.5px solid #eee', padding: 16, marginBottom: 10 },
  techTit:  { fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 12 },
  techItem: { fontSize: 13, color: '#555', marginBottom: 8, lineHeight: 1.6, display: 'flex', gap: 8 },
  doneWrap: { textAlign: 'center', padding: '32px 16px' },
  doneIcon: { width: 64, height: 64, background: '#E1F5EE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 },
  statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '16px 0' },
  stat:     { background: '#f7f7f7', borderRadius: 10, padding: '10px 12px' },
  statLbl:  { fontSize: 11, color: '#aaa', marginBottom: 3 },
  statVal:  { fontSize: 18, fontWeight: 600, color: '#111' },
  statDlt:  { fontSize: 11, color: '#1D9E75' },
  insightBox: { background: '#E1F5EE', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#0F6E56', textAlign: 'left', marginBottom: 14, lineHeight: 1.6 },
}

const EFFORT = {
  easy:  { label: 'Fácil',   color: '#9FE1CB', pct: 30, msg: 'Peso um pouco baixo — considere aumentar 2,5 kg na próxima série.' },
  good:  { label: 'Bom',     color: '#1D9E75', pct: 60, msg: 'Perfeito! Esse é o esforço ideal para esta fase.' },
  hard:  { label: 'Difícil', color: '#BA7517', pct: 82, msg: 'Ótimo esforço! Está bem perto do limite certo.' },
  limit: { label: 'Limite',  color: '#E24B4A', pct: 95, msg: 'Muito pesado — reduza um pouco para manter a técnica.' },
}

export default function Treino() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { session, plan, user } = location.state || {}

  const exercises = session?.exercises || []
  const [exIdx, setExIdx]       = useState(0)
  const [screen, setScreen]     = useState('exec')
  const [ratings, setRatings]   = useState({})
  const [setsDone, setSetsDone] = useState({})
  const [restSec, setRestSec]   = useState(90)
  const [totalSec, setTotalSec] = useState(0)
  const restRef   = useRef(null)
  const chronoRef = useRef(null)

  useEffect(() => {
    chronoRef.current = setInterval(() => setTotalSec(s => s + 1), 1000)
    return () => clearInterval(chronoRef.current)
  }, [])

  useEffect(() => {
    if (screen === 'rest') {
      const dur = exercises[exIdx - 1]?.rest || 90
      setRestSec(dur)
      restRef.current = setInterval(() => {
        setRestSec(s => {
          if (s <= 1) { clearInterval(restRef.current); setScreen('exec'); return 0 }
          return s - 1
        })
      }, 1000)
    }
    return () => clearInterval(restRef.current)
  }, [screen])

  if (!session) return (
    <div style={{ padding: 32, textAlign: 'center', fontFamily: 'system-ui', color: '#888' }}>
      Treino não encontrado.
    </div>
  )

  const ex = exercises[exIdx]
  // lê o número de séries do exercício — converte "3–4" para 4, "3" para 3
  const totalSets = (() => {
    const s = String(ex?.sets || '3')
    if (s.includes('–')) return parseInt(s.split('–')[1])
    return parseInt(s) || 3
  })()
  const doneSets = setsDone[exIdx] || 0
  const progPct  = Math.round((exIdx / exercises.length) * 100)
  const fmtTime  = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const fmtRest  = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  function rateSet(effortKey) {
    const key = `${exIdx}-${doneSets}`
    setRatings(r => ({ ...r, [key]: effortKey }))
  }

  function confirmSet() {
    const next = doneSets + 1
    setSetsDone(s => ({ ...s, [exIdx]: next }))
    if (next >= totalSets) {
      if (exIdx < exercises.length - 1) {
        setExIdx(i => i + 1)
        setScreen('rest')
      } else {
        clearInterval(chronoRef.current)
        saveLog()
        setScreen('done')
      }
    }
  }

  async function saveLog() {
    try {
      await supabase.from('session_logs').insert([{
        user_id:       id,
        session_label: session.label,
        ratings:       ratings,
        duration_sec:  totalSec,
        completed:     true,
        created_at:    new Date().toISOString(),
      }])
    } catch (e) { console.log('Erro ao salvar log:', e) }
  }

  const allRatings    = Object.values(ratings)
  const hasEasy       = allRatings.includes('easy')
  const hasLimit      = allRatings.includes('limit')
  const insightMsg    = hasLimit
    ? '⚠️ Você marcou "Limite" em algumas séries. Na próxima semana vamos ajustar o peso.'
    : hasEasy
    ? '💡 Você marcou "Fácil" em algumas séries. O app vai sugerir +2,5 kg nos próximos treinos.'
    : '✅ Esforço perfeito! O volume vai aumentar gradualmente na próxima semana.'

  const currentRating = ratings[`${exIdx}-${doneSets}`]

  function renderExec() {
    return (
      <div style={S.body}>
        <div style={S.card}>
          <div style={S.exNum}>Exercício {exIdx + 1} de {exercises.length}</div>
          <div style={S.exTitle}>{ex?.name}</div>
          <div style={S.exMuscle}>🎯 {ex?.muscle} · {ex?.isCompound ? 'Composto' : 'Isolamento'}</div>
          <div style={S.pillRow}>
            <div style={S.pill}><div style={S.pillLbl}>Séries</div><div style={S.pillVal}>{ex?.sets}</div></div>
            <div style={S.pill}><div style={S.pillLbl}>Repetições</div><div style={S.pillVal}>{ex?.reps}</div></div>
            <div style={S.pill}><div style={S.pillLbl}>Descanso</div><div style={S.pillVal}>{ex?.rest}s</div></div>
          </div>
          <div style={S.effLblR}>
            <span>Esforço esperado</span>
            <span style={{ color: ex?.effortColor, fontWeight: 600 }}>{ex?.effort}</span>
          </div>
          <div style={S.eBarBg}>
            <div style={{ ...S.eBarFl, width: (currentRating ? EFFORT[currentRating].pct : 60) + '%', background: currentRating ? EFFORT[currentRating].color : (ex?.effortColor || '#1D9E75') }} />
          </div>
          <div style={S.tip}>💡 {ex?.tip}</div>

          <div style={S.setsHdr}><span></span><span>Série</span><span>Reps</span><span>Como foi?</span></div>
          {Array.from({ length: totalSets }, (_, i) => {
            const isDone = i < doneSets
            const isOn   = i === doneSets
            const r      = ratings[`${exIdx}-${i}`]
            return (
              <div key={i} style={S.setRow}>
                <div style={{ ...S.setN, ...(isDone ? S.sNDone : isOn ? S.sNOn : S.sNFut) }}>
                  {isDone ? '✓' : i + 1}
                </div>
                <div style={S.setInfo}>{ex?.reps} reps</div>
                <div style={{ fontSize: 12, color: isDone ? '#1D9E75' : '#ccc' }}>
                  {isDone ? '✓ feito' : isOn ? '← atual' : ''}
                </div>
                <div style={S.rBtns}>
                  {Object.entries(EFFORT).map(([k, v]) => (
                    <button key={k}
                      style={{
                        ...S.rBtn,
                        ...(r === k ? { background: v.color, color: 'white', borderColor: 'transparent' } : {}),
                        ...(!isOn ? { opacity: 0.35, cursor: 'default' } : {}),
                      }}
                      onClick={() => isOn && rateSet(k)}
                      title={v.label}
                    >
                      {v.label[0]}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          {currentRating && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#555', padding: '8px 10px', background: '#f7f7f7', borderRadius: 8 }}>
              {EFFORT[currentRating].msg}
            </div>
          )}
        </div>
        <button style={S.btnConf} onClick={confirmSet}>
          ✓ Confirmar série {Math.min(doneSets + 1, totalSets)} de {totalSets}
        </button>
        <button style={S.btnTech} onClick={() => setScreen('tech')}>
          👁 Ver técnica detalhada
        </button>
      </div>
    )
  }

  function renderRest() {
    const next = exercises[exIdx]
    return (
      <div style={S.body}>
        <div style={S.restWrap}>
          <div style={S.restTit}>Descanse agora</div>
          <div style={S.restNum}>{fmtRest(restSec)}</div>
          <div style={S.restMsg}>
            {next ? `Próximo: ${next.name}` : 'Último exercício concluído!'}
          </div>
          {next && (
            <div style={S.nextCard}>
              <div style={S.nextLbl}>A seguir</div>
              <div style={S.nextName}>{next.name} · {next.sets} séries · {next.reps} reps</div>
            </div>
          )}
          <button style={S.btnConf} onClick={() => { clearInterval(restRef.current); setScreen('exec') }}>
            ▶ Pular descanso
          </button>
        </div>
      </div>
    )
  }

  function renderTech() {
    const tips = ex?.tip?.split('. ').filter(Boolean) || []
    return (
      <div style={S.techWrap}>
        <div style={S.techCard}>
          <div style={S.techTit}>{ex?.name} — técnica</div>
          {tips.map((t, i) => (
            <div key={i} style={S.techItem}>
              <span style={{ color: '#1D9E75', flexShrink: 0 }}>→</span>
              <span>{t}.</span>
            </div>
          ))}
        </div>
        <button style={S.btnConf} onClick={() => setScreen('exec')}>Voltar ao treino</button>
      </div>
    )
  }

  function renderDone() {
    return (
      <div style={S.body}>
        <div style={S.doneWrap}>
          <div style={S.doneIcon}>🏆</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 4 }}>Treino concluído!</div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Duração: {fmtTime(totalSec)}</div>
          <div style={{ fontSize: 12, color: '#1D9E75', marginBottom: 16 }}>{session.label}</div>
          <div style={S.statGrid}>
            <div style={S.stat}><div style={S.statLbl}>Séries feitas</div><div style={S.statVal}>{exercises.reduce((a, ex) => a + (parseInt(String(ex.sets).split('–')[1] || ex.sets) || 3), 0)}</div><div style={S.statDlt}>Meta ✓</div></div>
            <div style={S.stat}><div style={S.statLbl}>Exercícios</div><div style={S.statVal}>{exercises.length}</div><div style={S.statDlt}>Completo ✓</div></div>
            <div style={S.stat}><div style={S.statLbl}>Esforço</div><div style={S.statVal}>{hasLimit ? 'Intenso' : hasEasy ? 'Leve' : 'Ideal'}</div><div style={S.statDlt}>Registrado ✓</div></div>
            <div style={S.stat}><div style={S.statLbl}>Duração</div><div style={S.statVal}>{Math.floor(totalSec / 60)}<span style={{ fontSize: 13, fontWeight: 400 }}>min</span></div><div style={S.statDlt}>Ótimo ritmo</div></div>
          </div>
          <div style={S.insightBox}>{insightMsg}</div>
          <button style={S.btnConf} onClick={() => navigate(`/home/${id}`, { state: { plan, user } })}>
            Voltar para início
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={S.wrap}>
      <div style={S.topbar}>
        <button style={{ ...S.closeBtn, border: 'none', cursor: 'pointer', background: '#f5f5f5' }}
          onClick={() => navigate(`/home/${id}`, { state: { plan, user } })}>✕</button>
        <div style={S.tbTitle}>{session.label}</div>
        <div style={S.timer}>{fmtTime(totalSec)}</div>
      </div>
      <div style={S.progBar}><div style={{ ...S.progFill, width: progPct + '%' }} /></div>
      <div style={S.dots}>
        {exercises.map((_, i) => (
          <div key={i} style={{ ...S.dot, ...(i < exIdx ? S.dotDone : i === exIdx ? S.dotOn : {}) }} />
        ))}
      </div>
      {screen === 'exec' && renderExec()}
      {screen === 'rest' && renderRest()}
      {screen === 'tech' && renderTech()}
      {screen === 'done' && renderDone()}
    </div>
  )
}

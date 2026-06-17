// src/pages/Treino.js
import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getWeekParams, calcCurrentWeek, isDeloadWeek } from '../lib/weeklyProgression'
import { detectPlateauAndSuggest } from '../lib/levelEvaluation'

const S = {
  wrap:     { fontFamily: 'system-ui, sans-serif', maxWidth: 400, margin: '0 auto', background: '#f5f5f5', minHeight: '100vh' },
  topbar:   { background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 16px 12px', borderBottom: '0.5px solid #eee' },
  tbTitle:  { fontSize: 14, fontWeight: 600, color: '#111' },
  timer:    { fontSize: 13, fontWeight: 600, color: '#1D9E75', background: '#E1F5EE', padding: '4px 12px', borderRadius: 20 },
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
  effRow:   { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginBottom: 4 },
  eBarBg:   { height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden', marginBottom: 14 },
  eBarFl:   { height: '100%', borderRadius: 3, transition: 'width .3s' },
  tip:      { background: '#f7f7f7', borderLeft: '3px solid #1D9E75', padding: '9px 12px', fontSize: 12, color: '#666', lineHeight: 1.6, marginBottom: 14 },
  setsHdr:  { display: 'grid', gridTemplateColumns: '28px 52px 52px 1fr', gap: 6, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: '#aaa', paddingBottom: 8, borderBottom: '0.5px solid #eee', marginBottom: 6, textAlign: 'center' },
  setRow:   { display: 'grid', gridTemplateColumns: '28px 52px 52px 1fr', gap: 6, alignItems: 'center', padding: '7px 0', borderBottom: '0.5px solid #f5f5f5' },
  setN:     { width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 },
  sNDone:   { background: '#E1F5EE', color: '#085041' },
  sNOn:     { background: '#1D9E75', color: 'white' },
  sNFut:    { background: '#f0f0f0', color: '#aaa' },
  inputSm:  { width: '100%', fontSize: 13, padding: '4px 6px', borderRadius: 6, border: '0.5px solid #ddd', fontFamily: 'inherit', textAlign: 'center' },
  rBtns:    { display: 'flex', gap: 3 },
  rBtn:     { flex: 1, height: 28, borderRadius: 4, border: '0.5px solid #eee', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: '#f7f7f7', color: '#888' },
  btnConf:  { width: '100%', padding: 12, borderRadius: 10, background: '#1D9E75', border: 'none', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4 },
  btnTech:  { width: '100%', padding: 9, borderRadius: 10, background: 'transparent', border: '0.5px solid #eee', color: '#888', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', marginTop: 6 },
  restWrap: { textAlign: 'center', padding: '20px 16px' },
  restNum:  { fontSize: 56, fontWeight: 600, color: '#111', marginBottom: 6 },
  restMsg:  { fontSize: 13, color: '#666', marginBottom: 20, lineHeight: 1.6, padding: '0 12px' },
  nextCard: { background: 'white', borderRadius: 12, border: '0.5px solid #eee', padding: '12px 14px', textAlign: 'left', marginBottom: 10 },
  nextLbl:  { fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#aaa', marginBottom: 4 },
  nextName: { fontSize: 13, fontWeight: 600, color: '#111' },
  techWrap: { padding: '0 16px' },
  techCard: { background: 'white', borderRadius: 16, border: '0.5px solid #eee', padding: 16, marginBottom: 10 },
  doneWrap: { textAlign: 'center', padding: '32px 16px' },
  doneIcon: { width: 64, height: 64, background: '#E1F5EE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 },
  statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '16px 0' },
  stat:     { background: '#f7f7f7', borderRadius: 10, padding: '10px 12px' },
  statLbl:  { fontSize: 11, color: '#aaa', marginBottom: 3 },
  statVal:  { fontSize: 18, fontWeight: 600, color: '#111' },
  statDlt:  { fontSize: 11, color: '#1D9E75' },
  insight:  { background: '#E1F5EE', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#0F6E56', textAlign: 'left', marginBottom: 14, lineHeight: 1.6 },
}

const EFFORT = {
  easy:  { label: 'Fácil',   color: '#9FE1CB', pct: 30, msg: 'Peso um pouco baixo — considere +2,5 kg na próxima.' },
  good:  { label: 'Bom',     color: '#1D9E75', pct: 60, msg: 'Perfeito! Esse é o esforço ideal para esta fase.' },
  hard:  { label: 'Difícil', color: '#BA7517', pct: 82, msg: 'Ótimo esforço! Está bem perto do limite certo.' },
  limit: { label: 'Limite',  color: '#E24B4A', pct: 95, msg: 'Muito pesado — reduza um pouco para manter a técnica.' },
}

export default function Treino() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { session, plan, user, checkin } = location.state || {}

  // parâmetros da semana atual
  const currentWeek  = calcCurrentWeek(user?.created_at)
  const weekParams   = getWeekParams(plan?.level || 'beginner', currentWeek)
  const deload       = isDeloadWeek(plan?.level || 'beginner', currentWeek)

  // ajuste baseado no check-in
  function applyCheckinAdjustment(params) {
    if (!checkin) return params
    const adj = checkin.adjustment
    if (adj === 'reduced') {
      // reduz 1 série — pega o número menor do range
      const setsNum = parseInt(String(params.sets).split('–')[0]) || 3
      return { ...params, sets: String(Math.max(setsNum - 1, 2)), effort: 'Bom esforço', effortColor: '#1D9E75' }
    }
    if (adj === 'light') {
      return { ...params, sets: '2', reps: '12–15', effort: 'Bom esforço', effortColor: '#1D9E75', rest: 60 }
    }
    return params
  }

  const adjustedParams = applyCheckinAdjustment(weekParams)

  // aplica parâmetros semanais + ajuste do check-in nos exercícios
  const exercises = (session?.exercises || []).map(ex => ({
    ...ex,
    sets:        deload ? '2' : (adjustedParams.sets || ex.sets),
    reps:        deload ? '12–15' : (adjustedParams.reps || ex.reps),
    rest:        adjustedParams.rest || ex.rest,
    effort:      adjustedParams.effort || ex.effort,
    effortColor: adjustedParams.effortColor || ex.effortColor,
  }))

  const [exIdx, setExIdx]       = useState(0)
  const [screen, setScreen]     = useState('exec')
  const [ratings, setRatings]       = useState({})
  const [setsDone, setSetsDone]     = useState({})
  const [weights, setWeights]       = useState({})
  const [repsLog, setRepsLog]       = useState({})
  const [isoTimes, setIsoTimes]     = useState({}) // { "exIdx-setIdx": segundos }
  const [isoRunning, setIsoRunning] = useState(false)
  const [isoSec, setIsoSec]         = useState(0)
  const isoRef                      = useRef(null)
  const [lastLog, setLastLog]       = useState(null)
  const [plateau, setPlateau]       = useState(null)
  const [restSec, setRestSec]       = useState(90)
  const [totalSec, setTotalSec] = useState(0)
  const restRef   = useRef(null)
  const chronoRef = useRef(null)

  useEffect(() => {
    chronoRef.current = setInterval(() => setTotalSec(s => s + 1), 1000)
    return () => clearInterval(chronoRef.current)
  }, [])

  useEffect(() => {
    async function loadLastLog() {
      if (!id || !session?.label) return
      const { data } = await supabase
        .from('session_logs')
        .select('sets_log, ratings')
        .eq('user_id', id)
        .eq('session_label', session.label)
        .eq('completed', true)
        .order('created_at', { ascending: false })
        .limit(1)
      if (data && data.length > 0) setLastLog(data[0])

      // carrega todos os logs para detectar plateau
      const { data: allLogs } = await supabase
        .from('session_logs')
        .select('sets_log, created_at')
        .eq('user_id', id)
        .eq('completed', true)
        .order('created_at', { ascending: true })
      if (allLogs && allLogs.length >= 3) {
        const p = detectPlateauAndSuggest(allLogs, exercises, plan?.level || 'beginner')
        if (p) setPlateau(p)
      }
    }
    loadLastLog()
  }, [id, session?.label])

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

  if (!session) return <div style={{ padding: 32, textAlign: 'center', fontFamily: 'system-ui', color: '#888' }}>Treino não encontrado.</div>

  // check-in obrigatório — redireciona se não veio da tela de check-in
  if (!checkin) {
    navigate(`/checkin/${id}`, { state: { session, plan, user }, replace: true })
    return null
  }

  const ex = exercises[exIdx]
  const totalSets = (() => {
    const s = String(ex?.sets || '3')
    if (s.includes('–')) return parseInt(s.split('–')[1])
    return parseInt(s) || 3
  })()
  const doneSets  = setsDone[exIdx] || 0
  const progPct   = Math.round((exIdx / exercises.length) * 100)
  const fmtTime   = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  const fmtRest  = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  function rateSet(k) {
    setRatings(r => ({ ...r, [`${exIdx}-${doneSets}`]: k }))
  }

  // ── cronômetro isométrico ──────────────────────────────────
  function startIso() {
    setIsoSec(0)
    setIsoRunning(true)
    isoRef.current = setInterval(() => setIsoSec(s => s + 1), 1000)
  }

  function stopIso() {
    clearInterval(isoRef.current)
    setIsoRunning(false)
    // desconta 5 segundos de delay de reação (mínimo 1 segundo)
    const finalTime = Math.max(isoSec - 5, 1)
    const key = `${exIdx}-${doneSets}`
    setIsoTimes(t => ({ ...t, [key]: finalTime }))
    setRepsLog(r => ({ ...r, [key]: finalTime })) // salva como reps p/ compatibilidade
  }

  function getLastIsoTime(eIdx, sIdx) {
    // busca último tempo registrado para este exercício no histórico
    if (!lastLog?.sets_log) return null
    const exName = exercises[eIdx]?.name
    const lastSet = lastLog.sets_log.find(s => s.exercise_name === exName && s.set_number === sIdx + 1)
    return lastSet?.reps_done || null // reps_done guarda o tempo em segundos
  }

  function fmtIso(sec) {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  function getSuggestedWeight(eIdx, sIdx) {
    if (weights[`${eIdx}-${sIdx}`]) return weights[`${eIdx}-${sIdx}`]
    for (let s = sIdx - 1; s >= 0; s--) {
      if (weights[`${eIdx}-${s}`]) return weights[`${eIdx}-${s}`]
    }
    if (!lastLog?.sets_log) return ''
    const exName  = exercises[eIdx]?.name
    const lastSet = lastLog.sets_log.find(s => s.exercise_name === exName && s.set_number === sIdx + 1)
                 || lastLog.sets_log.find(s => s.exercise_name === exName)
    if (!lastSet?.weight_kg) return ''
    const effort = lastSet.effort
    if (effort === 'easy')  return String(parseFloat(lastSet.weight_kg) + 2.5)
    if (effort === 'limit') return String(Math.max(parseFloat(lastSet.weight_kg) - 2.5, 0))
    return String(lastSet.weight_kg)
  }

  function getSuggestedReps(eIdx, sIdx) {
    if (repsLog[`${eIdx}-${sIdx}`]) return repsLog[`${eIdx}-${sIdx}`]
    for (let s = sIdx - 1; s >= 0; s--) {
      if (repsLog[`${eIdx}-${s}`]) return repsLog[`${eIdx}-${s}`]
    }
    if (!lastLog?.sets_log) return exercises[eIdx]?.reps?.split('–')?.[0] || ''
    const exName  = exercises[eIdx]?.name
    const lastSet = lastLog.sets_log.find(s => s.exercise_name === exName && s.set_number === sIdx + 1)
    return lastSet?.reps_done ? String(lastSet.reps_done) : (exercises[eIdx]?.reps?.split('–')?.[0] || '')
  }

  function confirmSet() {
    const next = doneSets + 1
    const curKey  = `${exIdx}-${doneSets}`
    const nextKey = `${exIdx}-${next}`

    // para o cronômetro se ainda estiver rodando
    if (isoRunning) { clearInterval(isoRef.current); setIsoRunning(false) }
    setIsoSec(0)

    const curW = weights[curKey]
    const curR = repsLog[curKey]
    if (curW && !weights[nextKey]) setWeights(w => ({ ...w, [nextKey]: curW }))
    if (curR && !repsLog[nextKey]) setRepsLog(r => ({ ...r, [nextKey]: curR }))
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
      const setsLog = exercises.flatMap((ex, eIdx) => {
        const total = (() => { const s = String(ex?.sets || '3'); return s.includes('–') ? parseInt(s.split('–')[1]) : parseInt(s) || 3 })()
        return Array.from({ length: total }, (_, sIdx) => ({
          exercise_id: ex.id, exercise_name: ex.name, muscle: ex.muscle,
          set_number: sIdx + 1,
          weight_kg:  parseFloat(weights[`${eIdx}-${sIdx}`]) || null,
          reps_done:  parseInt(repsLog[`${eIdx}-${sIdx}`]) || null,
          effort:     ratings[`${eIdx}-${sIdx}`] || null,
        }))
      })
      const strengthScores = exercises.map((ex, eIdx) => {
        const w = parseFloat(weights[`${eIdx}-0`]) || 0
        const r = parseInt(repsLog[`${eIdx}-0`]) || 0
        const orm = w > 0 && r > 0 ? Math.round(w * (1 + r / 30)) : null
        return { exercise_id: ex.id, exercise_name: ex.name, estimated_1rm: orm }
      }).filter(s => s.estimated_1rm)
      await supabase.from('session_logs').insert([{
        user_id: id, session_label: session.label, ratings,
        sets_log: setsLog, strength_scores: strengthScores,
        checkin_score:    checkin?.score || null,
        checkin_data:     checkin || null,
        duration_sec: totalSec, completed: true, created_at: new Date().toISOString(),
      }])
    } catch (e) { console.log('Erro ao salvar log:', e) }
  }

  const allRatings = Object.values(ratings)
  const hasEasy    = allRatings.includes('easy')
  const hasLimit   = allRatings.includes('limit')
  const insightMsg = hasLimit
    ? '⚠️ Você marcou "Limite" em algumas séries. Na próxima semana vamos reduzir levemente o peso.'
    : hasEasy
    ? '💡 Você marcou "Fácil" em algumas séries. O app vai sugerir +2,5 kg nos próximos treinos.'
    : deload
    ? '🔋 Semana de deload concluída! Na próxima semana voltamos com volume e intensidade maiores.'
    : '✅ Esforço perfeito! O volume vai aumentar gradualmente na próxima semana.'

  const currentRating = ratings[`${exIdx}-${doneSets}`]

  function renderExec() {
    return (
      <div style={S.body}>
        {deload && (
          <div style={{ background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 10, padding: '10px 14px', marginBottom: 10, fontSize: 13, color: '#633806', display: 'flex', gap: 8 }}>
            🔋 <span><strong>Semana de deload</strong> — volume reduzido para recuperação. Foque na técnica!</span>
          </div>
        )}
        {checkin && checkin.adjustment === 'reduced' && !deload && (
          <div style={{ background: '#FAEEDA', border: '0.5px solid #FAC775', borderRadius: 10, padding: '10px 14px', marginBottom: 10, fontSize: 13, color: '#633806', display: 'flex', gap: 8 }}>
            ⚡ <span><strong>Ajuste automático</strong> — 1 série reduzida por exercício por conta do seu check-in.</span>
          </div>
        )}
        {checkin && checkin.adjustment === 'light' && !deload && (
          <div style={{ background: '#FCEBEB', border: '0.5px solid #F7C1C1', borderRadius: 10, padding: '10px 14px', marginBottom: 10, fontSize: 13, color: '#791F1F', display: 'flex', gap: 8 }}>
            🛌 <span><strong>Treino leve de hoje</strong> — 2 séries, esforço moderado. Seu corpo agradece!</span>
          </div>
        )}
        {plateau && exIdx === 0 && (
          <div style={{ background: '#EEEDFE', border: '0.5px solid #CECBF6', borderRadius: 10, padding: '10px 14px', marginBottom: 10, fontSize: 13, color: '#3C3489', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ flexShrink: 0 }}>📊</span>
            <span><strong>Plateau detectado em {plateau.exerciseName.split(' ').slice(0,2).join(' ')}</strong> — {plateau.reason} Considere substituir por <strong>{plateau.suggestion}</strong>.</span>
          </div>
        )}
        <div style={S.card}>
          <div style={S.exNum}>Exercício {exIdx + 1} de {exercises.length}</div>
          <div style={S.exTitle}>{ex?.name}</div>
          <div style={S.exMuscle}>🎯 {ex?.muscle} · {ex?.isCompound ? 'Composto' : 'Isolamento'}</div>
          <div style={S.pillRow}>
            <div style={S.pill}><div style={S.pillLbl}>Séries</div><div style={S.pillVal}>{ex?.sets}</div></div>
            <div style={S.pill}><div style={S.pillLbl}>Repetições</div><div style={S.pillVal}>{ex?.reps}</div></div>
            <div style={S.pill}><div style={S.pillLbl}>Descanso</div><div style={S.pillVal}>{ex?.rest}s</div></div>
          </div>
          <div style={S.effRow}>
            <span>Esforço esperado</span>
            <span style={{ color: ex?.effortColor, fontWeight: 600 }}>{ex?.effort}</span>
          </div>
          <div style={S.eBarBg}>
            <div style={{ ...S.eBarFl, width: (currentRating ? EFFORT[currentRating].pct : 60) + '%', background: currentRating ? EFFORT[currentRating].color : (ex?.effortColor || '#1D9E75') }} />
          </div>
          <div style={S.tip}>💡 {ex?.tip}</div>

          {ex?.isometric ? (
            // ── modo isométrico ──────────────────────────────
            <>
              <div style={{ ...S.setsHdr }}>
                <span></span><span style={{ gridColumn: '2 / 4', textAlign: 'center' }}>Tempo</span><span>Esforço</span>
              </div>
              {Array.from({ length: totalSets }, (_, i) => {
                const isDone    = i < doneSets
                const isOn      = i === doneSets
                const r         = ratings[`${exIdx}-${i}`]
                const savedTime = isoTimes[`${exIdx}-${i}`]
                const lastTime  = getLastIsoTime(exIdx, i)
                return (
                  <div key={i} style={S.setRow}>
                    <div style={{ ...S.setN, ...(isDone ? S.sNDone : isOn ? S.sNOn : S.sNFut) }}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <div style={{ gridColumn: '2 / 4', textAlign: 'center' }}>
                      {isDone ? (
                        <span style={{ fontSize: 13, color: '#1D9E75', fontWeight: 600 }}>
                          {fmtIso(isoTimes[`${exIdx}-${i}`] || 0)} ✓
                        </span>
                      ) : isOn ? (
                        <div>
                          {lastTime && !isoRunning && !savedTime && (
                            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>
                              Última vez: {fmtIso(lastTime)}
                            </div>
                          )}
                          <div style={{ fontSize: 28, fontWeight: 700, color: isoRunning ? '#1D9E75' : '#111', fontVariantNumeric: 'tabular-nums', marginBottom: 8 }}>
                            {savedTime ? fmtIso(savedTime) : fmtIso(isoSec)}
                          </div>
                          {!savedTime && (
                            <button
                              onClick={isoRunning ? stopIso : startIso}
                              style={{
                                padding: '8px 20px', borderRadius: 8, border: 'none', fontFamily: 'inherit',
                                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                                background: isoRunning ? '#E24B4A' : '#1D9E75', color: 'white',
                              }}
                            >
                              {isoRunning ? '⏹ Parar' : '▶ Iniciar'}
                            </button>
                          )}
                          {savedTime && (
                            <div style={{ fontSize: 13, color: '#1D9E75', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                              {fmtIso(savedTime)} ✓
                              <span
                                title="Descontamos 5s do tempo de reação para pausar"
                                style={{
                                  width: 16, height: 16, borderRadius: '50%',
                                  background: '#9FE1CB', color: '#085041',
                                  fontSize: 10, fontWeight: 700,
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: 'help', flexShrink: 0,
                                }}
                              >i</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: '#ccc' }}>—</span>
                      )}
                    </div>
                    <div style={S.rBtns}>
                      {Object.entries(EFFORT).map(([k, v]) => (
                        <button key={k} title={v.label}
                          style={{ ...S.rBtn, ...(r === k ? { background: v.color, color: 'white', borderColor: 'transparent' } : {}), ...(!isOn ? { opacity: 0.35, cursor: 'default' } : {}) }}
                          onClick={() => isOn && rateSet(k)}>
                          {v.label[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            // ── modo normal (kg + reps) ──────────────────────
            <>
              <div style={{ ...S.setsHdr }}>
                <span></span><span>Kg</span><span>Reps</span><span>Esforço</span>
              </div>
              {Array.from({ length: totalSets }, (_, i) => {
                const isDone = i < doneSets
                const isOn   = i === doneSets
                const r      = ratings[`${exIdx}-${i}`]
                const w      = isOn ? getSuggestedWeight(exIdx, i) : (weights[`${exIdx}-${i}`] || '')
                const rp     = isOn ? getSuggestedReps(exIdx, i) : (repsLog[`${exIdx}-${i}`] || '')
                return (
                  <div key={i} style={S.setRow}>
                    <div style={{ ...S.setN, ...(isDone ? S.sNDone : isOn ? S.sNOn : S.sNFut) }}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      {isOn
                        ? <input type="number" placeholder="kg" value={w} style={S.inputSm}
                            onChange={e => setWeights(prev => ({ ...prev, [`${exIdx}-${doneSets}`]: e.target.value }))} />
                        : <span style={{ fontSize: 12, color: isDone ? '#1D9E75' : '#ccc' }}>{isDone ? (w || '—') : ''}</span>
                      }
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      {isOn
                        ? <input type="number" placeholder="reps" value={rp} style={S.inputSm}
                            onChange={e => setRepsLog(prev => ({ ...prev, [`${exIdx}-${doneSets}`]: e.target.value }))} />
                        : <span style={{ fontSize: 12, color: isDone ? '#1D9E75' : '#ccc' }}>{isDone ? (rp || '—') : ''}</span>
                      }
                    </div>
                    <div style={S.rBtns}>
                      {Object.entries(EFFORT).map(([k, v]) => (
                        <button key={k} title={v.label}
                          style={{ ...S.rBtn, ...(r === k ? { background: v.color, color: 'white', borderColor: 'transparent' } : {}), ...(!isOn ? { opacity: 0.35, cursor: 'default' } : {}) }}
                          onClick={() => isOn && rateSet(k)}>
                          {v.label[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {currentRating && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#555', padding: '8px 10px', background: '#f7f7f7', borderRadius: 8 }}>
              {EFFORT[currentRating].msg}
            </div>
          )}
        </div>
        <button style={S.btnConf} onClick={confirmSet}
          disabled={ex?.isometric && isOn && !isoTimes[`${exIdx}-${doneSets}`] && !ratings[`${exIdx}-${doneSets}`]}>
          ✓ Confirmar série {Math.min(doneSets + 1, totalSets)} de {totalSets}
        </button>
        <button style={S.btnTech} onClick={() => setScreen('tech')}>👁 Ver técnica detalhada</button>
      </div>
    )
  }

  function renderRest() {
    const next = exercises[exIdx]
    return (
      <div style={S.body}>
        <div style={S.restWrap}>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Descanse agora</div>
          <div style={S.restNum}>{fmtRest(restSec)}</div>
          <div style={S.restMsg}>{next ? `Próximo: ${next.name}` : 'Último exercício concluído!'}</div>
          {next && <div style={S.nextCard}><div style={S.nextLbl}>A seguir</div><div style={S.nextName}>{next.name} · {next.sets} séries · {next.reps} reps</div></div>}
          <button style={S.btnConf} onClick={() => { clearInterval(restRef.current); setScreen('exec') }}>▶ Pular descanso</button>
        </div>
      </div>
    )
  }

  function renderTech() {
    const tips = ex?.tip?.split('. ').filter(Boolean) || []
    return (
      <div style={S.techWrap}>
        <div style={S.techCard}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 12 }}>{ex?.name} — técnica</div>
          {tips.map((t, i) => (
            <div key={i} style={{ fontSize: 13, color: '#555', marginBottom: 8, lineHeight: 1.6, display: 'flex', gap: 8 }}>
              <span style={{ color: '#1D9E75', flexShrink: 0 }}>→</span><span>{t}.</span>
            </div>
          ))}
        </div>
        <button style={S.btnConf} onClick={() => setScreen('exec')}>Voltar ao treino</button>
      </div>
    )
  }

  function renderDone() {
    let volumeTotal = 0
    exercises.forEach((ex, eIdx) => {
      const total = (() => { const s = String(ex?.sets || '3'); return s.includes('–') ? parseInt(s.split('–')[1]) : parseInt(s) || 3 })()
      Array.from({ length: total }, (_, sIdx) => {
        volumeTotal += (parseFloat(weights[`${eIdx}-${sIdx}`]) || 0) * (parseInt(repsLog[`${eIdx}-${sIdx}`]) || 0)
      })
    })
    const mainEx    = exercises.find(e => e.isCompound)
    const mainEIdx  = exercises.indexOf(mainEx)
    const mainW     = parseFloat(weights[`${mainEIdx}-0`]) || 0
    const mainR     = parseInt(repsLog[`${mainEIdx}-0`]) || 0
    const orm       = mainW > 0 && mainR > 0 ? Math.round(mainW * (1 + mainR / 30)) : null
    const sessions  = plan?.sessions || []
    const curIdx    = sessions.findIndex(s => s.label === session.label)
    const nextIdx   = (curIdx + 1) % sessions.length
    return (
      <div style={S.body}>
        <div style={S.doneWrap}>
          <div style={S.doneIcon}>{deload ? '🔋' : '🏆'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 4 }}>Treino concluído!</div>
          <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>Duração: {fmtTime(totalSec)}</div>
          <div style={{ fontSize: 12, color: '#1D9E75', marginBottom: 16 }}>{session.label} · Semana {currentWeek} · {weekParams.phaseName}</div>
          <div style={S.statGrid}>
            <div style={S.stat}><div style={S.statLbl}>Volume total</div><div style={S.statVal}>{volumeTotal > 0 ? `${(volumeTotal/1000).toFixed(1)}t` : '—'}</div><div style={S.statDlt}>{volumeTotal > 0 ? 'Registrado ✓' : 'Sem peso'}</div></div>
            <div style={S.stat}><div style={S.statLbl}>Séries</div><div style={S.statVal}>{exercises.reduce((a, ex) => a + (parseInt(String(ex.sets).split('–')[1] || ex.sets) || 3), 0)}</div><div style={S.statDlt}>Concluídas ✓</div></div>
            <div style={S.stat}><div style={S.statLbl}>1RM estimado</div><div style={S.statVal}>{orm ? `${orm} kg` : '—'}</div><div style={{ fontSize: 11, color: '#aaa' }}>{mainEx?.name?.split(' ').slice(0, 2).join(' ') || '—'}</div></div>
            <div style={S.stat}><div style={S.statLbl}>Duração</div><div style={S.statVal}>{Math.floor(totalSec / 60)}<span style={{ fontSize: 13, fontWeight: 400 }}>min</span></div><div style={S.statDlt}>Ótimo ritmo</div></div>
          </div>
          <div style={S.insight}>{insightMsg}</div>
          <button style={S.btnConf} onClick={() => {
            if (deload) {
              navigate(`/avaliacao/${id}`, { state: { plan, user } })
            } else {
              navigate(`/home/${id}`, { state: { plan, user, nextSessionIndex: nextIdx } })
            }
          }}>
            {deload ? '📊 Ver avaliação de nível →' : 'Voltar para início'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={S.wrap}>
      <div style={S.topbar}>
        <button style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f5f5f5', cursor: 'pointer', fontSize: 16 }}
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

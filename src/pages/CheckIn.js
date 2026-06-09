// src/pages/CheckIn.js
import { useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { getWeekParams, calcCurrentWeek, isDeloadWeek } from '../lib/weeklyProgression'

const S = {
  wrap:    { fontFamily: 'system-ui, sans-serif', maxWidth: 400, margin: '0 auto', minHeight: '100vh', background: '#f5f5f5', padding: '24px 16px' },
  header:  { marginBottom: 24 },
  title:   { fontSize: 22, fontWeight: 600, color: '#111', marginBottom: 4 },
  sub:     { fontSize: 13, color: '#888' },
  card:    { background: 'white', borderRadius: 16, border: '0.5px solid #eee', padding: 16, marginBottom: 12 },
  qLabel:  { fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 12 },
  options: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  opt:     { flex: 1, minWidth: 70, padding: '10px 8px', borderRadius: 10, border: '0.5px solid #eee', background: 'white', textAlign: 'center', cursor: 'pointer', fontSize: 13, transition: 'all .15s', userSelect: 'none' },
  optOn:   { background: '#E1F5EE', borderColor: '#1D9E75', color: '#085041', fontWeight: 500 },
  optEmoji:{ fontSize: 20, display: 'block', marginBottom: 4 },
  optLbl:  { fontSize: 11, color: 'inherit' },
  adjCard: { borderRadius: 12, padding: '12px 14px', marginBottom: 12, fontSize: 13, lineHeight: 1.6 },
  adjGood: { background: '#E1F5EE', border: '0.5px solid #9FE1CB', color: '#085041' },
  adjWarn: { background: '#FAEEDA', border: '0.5px solid #FAC775', color: '#633806' },
  adjBad:  { background: '#FCEBEB', border: '0.5px solid #F7C1C1', color: '#791F1F' },
  btn:     { width: '100%', padding: 13, borderRadius: 10, background: '#1D9E75', border: 'none', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  btnDis:  { opacity: 0.5, cursor: 'default' },
  painBox: { background: '#f7f7f7', borderRadius: 10, padding: '10px 12px', marginTop: 8 },
  painLbl: { fontSize: 12, color: '#888', marginBottom: 8 },
  painChips:{ display: 'flex', flexWrap: 'wrap', gap: 6 },
  chip:    { padding: '5px 12px', borderRadius: 20, border: '0.5px solid #eee', fontSize: 12, cursor: 'pointer', background: 'white', color: '#555' },
  chipOn:  { background: '#FCEBEB', borderColor: '#E24B4A', color: '#791F1F', fontWeight: 500 },
}

const WELLBEING_OPTS = [
  { value: 5, emoji: '😄', label: 'Ótimo' },
  { value: 4, emoji: '😊', label: 'Bem' },
  { value: 3, emoji: '😐', label: 'Normal' },
  { value: 2, emoji: '😴', label: 'Cansado' },
  { value: 1, emoji: '😩', label: 'Mal' },
]

const SLEEP_OPTS = [
  { value: 4, emoji: '😴', label: '8h+' },
  { value: 3, emoji: '🙂', label: '6–8h' },
  { value: 2, emoji: '😐', label: '4–6h' },
  { value: 1, emoji: '😪', label: 'Menos de 4h' },
]

const PAIN_AREAS = ['Ombro', 'Costas', 'Joelho', 'Quadril', 'Cotovelo', 'Pescoço', 'Nenhuma']

export default function CheckIn() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { session, plan, user } = location.state || {}

  const [wellbeing, setWellbeing] = useState(null)
  const [sleep, setSleep]         = useState(null)
  const [painAreas, setPainAreas] = useState([])

  const currentWeek = calcCurrentWeek(user?.created_at)
  const deload      = isDeloadWeek(plan?.level || 'beginner', currentWeek)

  function togglePain(area) {
    if (area === 'Nenhuma') { setPainAreas(['Nenhuma']); return }
    setPainAreas(prev => {
      const without = prev.filter(p => p !== 'Nenhuma')
      return without.includes(area) ? without.filter(p => p !== area) : [...without, area]
    })
  }

  // calcula o score total (1–10) e decide o ajuste
  function getScore() {
    if (!wellbeing || !sleep) return null
    const painPenalty = painAreas.filter(p => p !== 'Nenhuma').length
    return Math.max(wellbeing + sleep - painPenalty, 1)
  }

  function getAdjustment() {
    const score = getScore()
    if (!score) return null
    if (deload) return { type: 'deload', msg: '🔋 Semana de deload — volume já reduzido. Foque na técnica e recuperação.', style: S.adjWarn }
    if (score >= 7) return { type: 'normal', msg: '✅ Você está ótimo! Treino completo conforme o plano.', style: S.adjGood }
    if (score >= 5) return { type: 'normal', msg: '👍 Você está bem. Treino completo — mas preste atenção nos sinais do corpo.', style: S.adjGood }
    if (score >= 3) return { type: 'reduced', msg: '⚡ Dia difícil detectado. Vamos reduzir 1 série por exercício e o esforço em um nível.', style: S.adjWarn }
    return { type: 'light', msg: '🛌 Você está com baixa energia. Treino leve hoje — 2 séries, esforço "Bom", sem forçar.', style: S.adjBad }
  }

  function handleStart() {
    const score      = getScore()
    const adjustment = getAdjustment()

    navigate(`/treino/${id}`, {
      state: {
        session,
        plan,
        user,
        checkin: { wellbeing, sleep, painAreas, score, adjustment: adjustment?.type },
      }
    })
  }

  const adjustment = getAdjustment()
  const ready      = wellbeing && sleep && painAreas.length > 0

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={S.title}>Como você está hoje?</div>
        <div style={S.sub}>{session?.label} · 3 perguntas rápidas</div>
      </div>

      <div style={S.card}>
        <div style={S.qLabel}>1. Como você está se sentindo agora?</div>
        <div style={S.options}>
          {WELLBEING_OPTS.map(o => (
            <div key={o.value}
              style={{ ...S.opt, ...(wellbeing === o.value ? S.optOn : {}) }}
              onClick={() => setWellbeing(o.value)}>
              <span style={S.optEmoji}>{o.emoji}</span>
              <span style={S.optLbl}>{o.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <div style={S.qLabel}>2. Como foi seu sono esta noite?</div>
        <div style={S.options}>
          {SLEEP_OPTS.map(o => (
            <div key={o.value}
              style={{ ...S.opt, ...(sleep === o.value ? S.optOn : {}) }}
              onClick={() => setSleep(o.value)}>
              <span style={S.optEmoji}>{o.emoji}</span>
              <span style={S.optLbl}>{o.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <div style={S.qLabel}>3. Alguma dor ou desconforto hoje?</div>
        <div style={S.painChips}>
          {PAIN_AREAS.map(area => (
            <div key={area}
              style={{ ...S.chip, ...(painAreas.includes(area) ? S.chipOn : {}) }}
              onClick={() => togglePain(area)}>
              {area}
            </div>
          ))}
        </div>
      </div>

      {adjustment && (
        <div style={{ ...S.adjCard, ...adjustment.style }}>
          {adjustment.msg}
        </div>
      )}

      <button
        style={{ ...S.btn, ...(!ready ? S.btnDis : {}) }}
        onClick={ready ? handleStart : undefined}
        disabled={!ready}
      >
        {ready ? 'Iniciar treino →' : 'Responda as 3 perguntas para continuar'}
      </button>
    </div>
  )
}

// src/pages/Progresso.js
import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { calcCurrentWeek, analyzeProgression, getMesocycleStructure, getPhaseName } from '../lib/weeklyProgression'

const S = {
  wrap:      { fontFamily: 'system-ui, sans-serif', maxWidth: 400, margin: '0 auto', background: '#f5f5f5', minHeight: '100vh', paddingBottom: 80 },
  header:    { background: 'white', padding: '20px 16px 16px', borderBottom: '0.5px solid #eee' },
  title:     { fontSize: 22, fontWeight: 600, color: '#111' },
  body:      { padding: '16px 16px 0' },
  seg:       { display: 'flex', background: 'white', borderRadius: 10, border: '0.5px solid #eee', padding: 3, marginBottom: 16 },
  segBtn:    { flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 500, border: 'none', background: 'transparent', borderRadius: 7, cursor: 'pointer', color: '#aaa', fontFamily: 'inherit' },
  segOn:     { background: '#1D9E75', color: 'white' },
  card:      { background: 'white', borderRadius: 16, border: '0.5px solid #eee', padding: 16, marginBottom: 12 },
  cardLbl:   { fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: 10 },
  grid2:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 },
  metr:      { background: '#f7f7f7', borderRadius: 10, padding: '10px 12px' },
  mLbl:      { fontSize: 11, color: '#aaa', marginBottom: 3 },
  mVal:      { fontSize: 20, fontWeight: 600, color: '#111' },
  mDelta:    { fontSize: 11, color: '#1D9E75' },
  muscleRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  muscleName:{ fontSize: 12, color: '#333', width: 90, flexShrink: 0 },
  barBg:     { flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' },
  barFill:   { height: '100%', borderRadius: 3, background: '#1D9E75' },
  barVal:    { fontSize: 11, color: '#aaa', width: 36, textAlign: 'right' },
  levelBadge:{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: '#E1F5EE', color: '#085041', marginBottom: 10 },
  critRow:   { display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8 },
  critIcon:  { width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11 },
  critOk:    { background: '#E1F5EE', color: '#1D9E75' },
  critNo:    { background: '#f0f0f0', color: '#aaa', border: '0.5px solid #eee' },
  critLbl:   { flex: 1, color: '#333' },
  critSts:   { fontSize: 11, color: '#aaa' },
  infoBox:   { background: '#E1F5EE', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#085041', lineHeight: 1.6, marginTop: 10 },
  navbar:    { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 400, background: 'white', borderTop: '0.5px solid #eee', display: 'flex', justifyContent: 'space-around', padding: '10px 0 14px' },
  navItem:   { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, fontSize: 10, color: '#aaa', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' },
  navOn:     { color: '#1D9E75' },
}

function LineChart({ data, color = '#1D9E75', label = '' }) {
  if (!data || data.length < 2) return (
    <div style={{ textAlign: 'center', color: '#aaa', fontSize: 12, padding: '20px 0' }}>
      Treine mais vezes para ver o gráfico evoluir 📈
    </div>
  )
  const w = 330, h = 80, pad = 10
  const values = data.map(d => d.value)
  const min = Math.min(...values), max = Math.max(...values)
  const range = max - min || 1
  const pts = data.map((d, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((d.value - min) / range) * (h - pad * 2)
    return `${x},${y}`
  })
  const firstVal = values[0], lastVal = values[values.length - 1]
  const delta = lastVal - firstVal
  const deltaStr = delta >= 0 ? `+${delta.toFixed(1)} kg` : `${delta.toFixed(1)} kg`
  const deltaColor = delta >= 0 ? '#1D9E75' : '#E24B4A'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: '#888' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: deltaColor }}>{deltaStr}</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`}>
        <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const [x, y] = pts[i].split(',')
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="3" fill={color} />
              {i === data.length - 1 && (
                <text x={parseFloat(x) - 4} y={parseFloat(y) - 8} fontSize="11" fill={color} fontWeight="600" textAnchor="end">{d.value} kg</text>
              )}
            </g>
          )
        })}
        <text x={pad} y={h} fontSize="10" fill="#aaa">{data[0]?.label}</text>
        <text x={w - pad} y={h} fontSize="10" fill="#aaa" textAnchor="end">{data[data.length - 1]?.label}</text>
      </svg>
    </div>
  )
}

export default function Progresso() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [user, setUser]     = useState(location.state?.user || null)
  const [plan, setPlan]     = useState(location.state?.plan || null)
  const [logs, setLogs]     = useState([])
  const [tab, setTab]       = useState('forca')
  const [loading, setLoading] = useState(true)
  const [selectedEx, setSelectedEx] = useState(null)

  useEffect(() => {
    async function load() {
      if (!user && id) {
        const { data } = await supabase.from('users').select('*').eq('id', id).single()
        if (data) { setUser(data); setPlan(data.plan) }
      }
      const { data: logData } = await supabase
        .from('session_logs').select('*').eq('user_id', id)
        .order('created_at', { ascending: true })
      setLogs(logData || [])
      setLoading(false)
    }
    load()
  }, [id])

  const weeksTrained = Math.max(calcCurrentWeek(user?.created_at) - 1, 0)
  const level        = plan?.level || 'beginner'

  function getAttendance() {
    if (!logs.length) return 0
    const expected = Math.max(weeksTrained, 1) * (parseInt(user?.days_per_week) || 3)
    return Math.min(Math.round((logs.length / expected) * 100), 100)
  }

  function getExercisesWithHistory() {
    const exMap = {}
    logs.forEach(log => {
      if (!log.sets_log) return
      log.sets_log.forEach(s => {
        if (!s.exercise_name || !s.weight_kg) return
        if (!exMap[s.exercise_name]) exMap[s.exercise_name] = []
        const date  = new Date(log.created_at)
        const label = `${date.getDate()}/${date.getMonth() + 1}`
        const existing = exMap[s.exercise_name].find(e => e.label === label)
        if (!existing || s.weight_kg > existing.value) {
          if (existing) existing.value = parseFloat(s.weight_kg)
          else exMap[s.exercise_name].push({ label, value: parseFloat(s.weight_kg), date: log.created_at })
        }
      })
    })
    return Object.entries(exMap)
      .filter(([, data]) => data.length > 0)
      .map(([name, data]) => ({
        name, data: data.sort((a, b) => new Date(a.date) - new Date(b.date)),
        lastWeight: data[data.length - 1]?.value || 0,
        progression: analyzeProgression(logs, name),
      }))
      .sort((a, b) => b.data.length - a.data.length)
  }

  function getTotalVolume() {
    return logs.reduce((total, log) => {
      if (!log.sets_log) return total
      return total + log.sets_log.reduce((sum, s) => sum + ((parseFloat(s.weight_kg) || 0) * (parseInt(s.reps_done) || 0)), 0)
    }, 0)
  }

  const attendance = getAttendance()
  const exercisesWithHistory = getExercisesWithHistory()
  const activeEx = selectedEx || exercisesWithHistory[0]?.name
  const totalVolume = getTotalVolume()

  const progressionLabel = {
    progressing:       { text: 'Progredindo ↑', color: '#1D9E75' },
    stagnant:          { text: 'Estável →',     color: '#BA7517' },
    regressing:        { text: 'Atenção ↓',     color: '#E24B4A' },
    insufficient_data: { text: 'Poucos dados',  color: '#aaa' },
  }

  const criteria = {
    beginner: [
      { label: 'Tempo mínimo de treino (12 sem)', current: `${weeksTrained} sem`, met: weeksTrained >= 12 },
      { label: 'Presença mínima de 80%',          current: `${attendance}%`,      met: attendance >= 80 },
      { label: 'Completou ao menos 1 mesociclo',  current: logs.length >= 8 ? '✓' : `${logs.length} treinos`, met: logs.length >= 8 },
    ],
    basic: [
      { label: 'Tempo mínimo (32 semanas)',        current: `${weeksTrained} sem`, met: weeksTrained >= 32 },
      { label: 'Presença mínima de 80%',           current: `${attendance}%`,      met: attendance >= 80 },
      { label: 'Tolera 4 sessões/semana',          current: `${user?.days_per_week || 3} dias`, met: parseInt(user?.days_per_week) >= 4 },
    ],
    intermediate: [
      { label: 'Treino consistente (2+ anos)',     current: `${weeksTrained} sem`, met: weeksTrained >= 104 },
      { label: 'Presença mínima de 80%',           current: `${attendance}%`,      met: attendance >= 80 },
      { label: 'Domina autoregulação por esforço', current: logs.length >= 20 ? '✓' : 'Em desenvolvimento', met: logs.length >= 20 },
    ],
    advanced: [
      { label: 'Manutenção e otimização contínua', current: 'Nível máximo', met: true },
    ],
  }

  const currentCriteria = criteria[level] || criteria.beginner
  const metCount        = currentCriteria.filter(c => c.met).length
  const levelNames      = { beginner: 'Iniciante', basic: 'Básico', intermediate: 'Intermediário', advanced: 'Avançado' }
  const nextLevelNames  = { beginner: 'Básico', basic: 'Intermediário', intermediate: 'Avançado', advanced: 'Avançado (máximo)' }

  if (loading) return <div style={{ padding: 32, textAlign: 'center', color: '#888', fontFamily: 'system-ui' }}>Carregando...</div>

  return (
    <div style={S.wrap}>
      <div style={S.header}><div style={S.title}>Meu progresso</div></div>
      <div style={S.body}>
        <div style={S.seg}>
          {[['forca','Força'],['volume','Volume'],['nivel','Nível']].map(([t, l]) => (
            <button key={t} style={{ ...S.segBtn, ...(tab === t ? S.segOn : {}) }} onClick={() => setTab(t)}>{l}</button>
          ))}
        </div>

        {tab === 'forca' && (
          <>
            <div style={S.grid2}>
              <div style={S.metr}>
                <div style={S.mLbl}>Treinos feitos</div>
                <div style={S.mVal}>{logs.length}</div>
                <div style={S.mDelta}>{weeksTrained} semanas</div>
              </div>
              <div style={S.metr}>
                <div style={S.mLbl}>Volume total</div>
                <div style={S.mVal}>{totalVolume > 0 ? `${(totalVolume/1000).toFixed(0)}t` : '—'}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>peso × reps</div>
              </div>
            </div>
            {exercisesWithHistory.length > 0 ? (
              <>
                <div style={S.card}>
                  <div style={S.cardLbl}>Evolução de carga</div>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
                    {exercisesWithHistory.slice(0, 5).map(ex => (
                      <div key={ex.name} onClick={() => setSelectedEx(ex.name)} style={{
                        fontSize: 11, padding: '4px 10px', borderRadius: 12, cursor: 'pointer',
                        background: activeEx === ex.name ? '#E1F5EE' : '#f7f7f7',
                        border: `0.5px solid ${activeEx === ex.name ? '#1D9E75' : '#eee'}`,
                        color: activeEx === ex.name ? '#085041' : '#888',
                        fontWeight: activeEx === ex.name ? 600 : 400,
                      }}>
                        {ex.name.split(' ').slice(0, 2).join(' ')}
                      </div>
                    ))}
                  </div>
                  <LineChart
                    data={exercisesWithHistory.find(e => e.name === activeEx)?.data || []}
                    label={activeEx || ''}
                  />
                  {exercisesWithHistory.find(e => e.name === activeEx) && (
                    <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: '#aaa' }}>Último: <strong style={{ color: '#111' }}>{exercisesWithHistory.find(e => e.name === activeEx)?.lastWeight} kg</strong></span>
                      <span style={{ color: progressionLabel[exercisesWithHistory.find(e => e.name === activeEx)?.progression]?.color }}>
                        {progressionLabel[exercisesWithHistory.find(e => e.name === activeEx)?.progression]?.text}
                      </span>
                    </div>
                  )}
                </div>
                <div style={S.card}>
                  <div style={S.cardLbl}>Resumo por exercício</div>
                  {exercisesWithHistory.slice(0, 6).map((ex, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < Math.min(exercisesWithHistory.length, 6) - 1 ? '0.5px solid #f5f5f5' : 'none' }}>
                      <div>
                        <div style={{ fontSize: 13, color: '#111', fontWeight: 500 }}>{ex.name}</div>
                        <div style={{ fontSize: 11, color: '#aaa' }}>{ex.data.length} sessões</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{ex.lastWeight} kg</div>
                        <div style={{ fontSize: 11, color: progressionLabel[ex.progression]?.color }}>{progressionLabel[ex.progression]?.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ ...S.card, textAlign: 'center', color: '#aaa', fontSize: 13, padding: 24 }}>
                Complete treinos registrando o peso para ver sua evolução aqui! 💪
              </div>
            )}
          </>
        )}

        {tab === 'volume' && (
          <>
            <div style={S.grid2}>
              <div style={S.metr}>
                <div style={S.mLbl}>Presença</div>
                <div style={S.mVal}>{attendance}<span style={{ fontSize: 13, fontWeight: 400 }}>%</span></div>
                <div style={{ fontSize: 11, color: attendance >= 80 ? '#1D9E75' : '#BA7517' }}>{attendance >= 80 ? 'Meta atingida ✓' : 'Meta: 80%'}</div>
              </div>
              <div style={S.metr}>
                <div style={S.mLbl}>Treinos</div>
                <div style={S.mVal}>{logs.length}</div>
                <div style={S.mDelta}>concluídos</div>
              </div>
            </div>
            <div style={S.card}>
              <div style={S.cardLbl}>Mesociclo atual — semana a semana</div>
              {getMesocycleStructure(level).map((w, i) => {
                const currentWk = calcCurrentWeek(user?.created_at)
                const isPast    = w.week < currentWk
                const isCurrent = w.week === currentWk
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: i < getMesocycleStructure(level).length - 1 ? '0.5px solid #f5f5f5' : 'none' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 600, flexShrink: 0,
                      background: w.isDeload ? '#FAEEDA' : isPast ? '#E1F5EE' : isCurrent ? '#1D9E75' : '#f0f0f0',
                      color: w.isDeload ? '#633806' : isPast ? '#085041' : isCurrent ? 'white' : '#aaa',
                    }}>
                      {isPast ? '✓' : w.week}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: isCurrent ? 600 : 400, color: isCurrent ? '#111' : '#555' }}>
                        Semana {w.week} — {w.phaseName}
                        {isCurrent && <span style={{ fontSize: 11, color: '#1D9E75', marginLeft: 6 }}>← atual</span>}
                      </div>
                    </div>
                    {w.isDeload && <span style={{ fontSize: 10, color: '#BA7517', background: '#FAEEDA', padding: '2px 8px', borderRadius: 10 }}>deload</span>}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {tab === 'nivel' && (
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={S.levelBadge}>{levelNames[level] || 'Iniciante'}</span>
              <span style={{ fontSize: 13, color: '#888' }}>Semana {weeksTrained} de treino</span>
            </div>
            <div style={S.cardLbl}>Critérios para {nextLevelNames[level] || 'Básico'}</div>
            {currentCriteria.map((c, i) => (
              <div key={i} style={S.critRow}>
                <div style={{ ...S.critIcon, ...(c.met ? S.critOk : S.critNo) }}>{c.met ? '✓' : ''}</div>
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

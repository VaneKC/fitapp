// src/pages/AvaliacaoNivel.js
import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { evaluateLevel, generateNextMesocycle } from '../lib/levelEvaluation'

const S = {
  wrap:    { fontFamily: 'system-ui, sans-serif', maxWidth: 400, margin: '0 auto', minHeight: '100vh', background: '#f5f5f5', padding: '24px 16px 48px' },
  title:   { fontSize: 22, fontWeight: 600, color: '#111', marginBottom: 4 },
  sub:     { fontSize: 13, color: '#888', marginBottom: 24 },
  card:    { background: 'white', borderRadius: 16, border: '0.5px solid #eee', padding: 16, marginBottom: 12 },
  cardLbl: { fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#888', marginBottom: 10 },
  badge:   { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, marginBottom: 12 },
  row:     { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 10 },
  icon:    { width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 },
  iconOk:  { background: '#E1F5EE', color: '#1D9E75' },
  iconNo:  { background: '#f0f0f0', color: '#aaa', border: '0.5px solid #eee' },
  lbl:     { flex: 1, color: '#333' },
  val:     { fontSize: 12, color: '#aaa' },
  promoBox:{ background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: 12, padding: '14px 16px', marginBottom: 12, textAlign: 'center' },
  maintBox:{ background: '#f7f7f7', border: '0.5px solid #eee', borderRadius: 12, padding: '14px 16px', marginBottom: 12, textAlign: 'center' },
  strengthRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '0.5px solid #f5f5f5', fontSize: 12 },
  btn:     { width: '100%', padding: 13, borderRadius: 10, background: '#1D9E75', border: 'none', color: 'white', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  loading: { textAlign: 'center', padding: 48, color: '#888', fontSize: 14 },
}

const LEVEL_NAMES = { beginner: 'Iniciante', basic: 'Básico', intermediate: 'Intermediário', advanced: 'Avançado' }
const LEVEL_EMOJI = { beginner: '🌱', basic: '💪', intermediate: '🔥', advanced: '⚡' }

export default function AvaliacaoNivel() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { plan, user } = location.state || {}

  const [logs, setLogs]         = useState([])
  const [evaluation, setEval]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('session_logs').select('*')
        .eq('user_id', id).order('created_at', { ascending: true })
      const logData = data || []
      setLogs(logData)
      const ev = evaluateLevel(user, logData, plan)
      setEval(ev)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleContinue() {
    setSaving(true)
    try {
      const newPlan    = generateNextMesocycle(user, evaluation)
      const newLevel   = evaluation.canPromote ? evaluation.nextLevel : evaluation.currentLevel

      // salva avaliação no banco
      await supabase.from('level_evaluations').insert([{
        user_id:          id,
        level_before:     evaluation.currentLevel,
        level_after:      newLevel,
        promoted:         evaluation.canPromote,
        criteria_met:     evaluation.criteria,
        weeks_trained:    evaluation.weeksTrained,
        attendance_rate:  evaluation.attendance,
        created_at:       new Date().toISOString(),
      }])

      // atualiza o plano e nível do usuário
      await supabase.from('users').update({
        plan:        newPlan,
        experience_level: newLevel,
        macrocycle:  (user.macrocycle || 1) + 1,
      }).eq('id', id)

      navigate(`/home/${id}`, { state: { plan: newPlan, user: { ...user, plan: newPlan, experience_level: newLevel } } })
    } catch (e) {
      console.log('Erro:', e)
      setSaving(false)
    }
  }

  if (loading) return <div style={S.loading}>Analisando seu progresso...</div>
  if (!evaluation) return null

  const { currentLevel, nextLevel, canPromote, criteria } = evaluation

  return (
    <div style={S.wrap}>
      <div style={S.title}>Avaliação de nível</div>
      <div style={S.sub}>Fim do mesociclo — veja como você evoluiu</div>

      {canPromote ? (
        <div style={S.promoBox}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#085041', marginBottom: 4 }}>
            Você avançou para {LEVEL_NAMES[nextLevel]}!
          </div>
          <div style={{ fontSize: 13, color: '#0F6E56', lineHeight: 1.6 }}>
            Todos os critérios foram atingidos. O próximo mesociclo será gerado com parâmetros mais avançados.
          </div>
        </div>
      ) : (
        <div style={S.maintBox}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>💪</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#333', marginBottom: 4 }}>
            Mantendo nível {LEVEL_NAMES[currentLevel]}
          </div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
            Continue progredindo — alguns critérios ainda não foram atingidos. O próximo ciclo vai te aproximar ainda mais.
          </div>
        </div>
      )}

      <div style={S.card}>
        <div style={S.cardLbl}>Critérios avaliados</div>

        <div style={S.row}>
          <div style={{ ...S.icon, ...(criteria.time.met ? S.iconOk : S.iconNo) }}>{criteria.time.met ? '✓' : ''}</div>
          <span style={S.lbl}>Tempo de treino</span>
          <span style={{ ...S.val, color: criteria.time.met ? '#1D9E75' : '#aaa' }}>{criteria.time.value} / {criteria.time.required}</span>
        </div>

        <div style={S.row}>
          <div style={{ ...S.icon, ...(criteria.attendance.met ? S.iconOk : S.iconNo) }}>{criteria.attendance.met ? '✓' : ''}</div>
          <span style={S.lbl}>Presença</span>
          <span style={{ ...S.val, color: criteria.attendance.met ? '#1D9E75' : '#aaa' }}>{criteria.attendance.value} / {criteria.attendance.required}</span>
        </div>

        <div style={S.row}>
          <div style={{ ...S.icon, ...(criteria.stagnation.met ? S.iconOk : S.iconNo) }}>{criteria.stagnation.met ? '✓' : ''}</div>
          <span style={S.lbl}>Progressão linear</span>
          <span style={{ ...S.val, color: criteria.stagnation.met ? '#1D9E75' : '#aaa' }}>{criteria.stagnation.value}</span>
        </div>

        {criteria.strength?.details && Object.keys(criteria.strength.details).length > 0 && (
          <>
            <div style={{ ...S.row, marginTop: 8 }}>
              <div style={{ ...S.icon, ...(criteria.strength.met ? S.iconOk : S.iconNo) }}>{criteria.strength.met ? '✓' : ''}</div>
              <span style={{ ...S.lbl, fontWeight: 500 }}>Força relativa</span>
            </div>
            {Object.values(criteria.strength.details).map((d, i) => (
              <div key={i} style={S.strengthRow}>
                <span style={{ color: '#555' }}>{d.label}</span>
                <span style={{ color: d.met ? '#1D9E75' : '#aaa' }}>
                  {d.orm ? `${d.orm} kg` : 'Sem dados'} {d.orm ? `(${d.relative}×PC)` : ''} {d.met ? '✓' : `/ meta: ${d.threshold}×`}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      <div style={S.card}>
        <div style={S.cardLbl}>Próximo mesociclo</div>
        <div style={{ fontSize: 13, color: '#555', lineHeight: 1.8 }}>
          <div>Nível: <strong>{LEVEL_NAMES[canPromote ? nextLevel : currentLevel]}</strong> {canPromote ? `(promovido de ${LEVEL_NAMES[currentLevel]})` : '(mantido)'}</div>
          <div>Macrociclo: <strong>#{(user?.macrocycle || 1) + 1}</strong></div>
          <div>Os parâmetros de séries, reps e esforço foram atualizados automaticamente.</div>
        </div>
      </div>

      <button style={S.btn} onClick={handleContinue} disabled={saving}>
        {saving ? 'Gerando próximo ciclo...' : 'Iniciar próximo mesociclo →'}
      </button>
    </div>
  )
}

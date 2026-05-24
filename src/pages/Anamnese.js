// src/pages/Anamnese.js
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generatePlan } from '../lib/planEngine'

// ── estilos inline para não precisar de arquivos CSS extras ──
const S = {
  wrap:    { fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '0 auto', padding: '24px 16px 48px', color: '#1a1a1a' },
  header:  { background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: 12, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 },
  hIcon:   { width: 40, height: 40, borderRadius: '50%', background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'white', fontSize: 20 },
  hTitle:  { fontSize: 16, fontWeight: 600, color: '#085041', marginBottom: 2 },
  hSub:    { fontSize: 13, color: '#0F6E56' },
  progBar: { height: 4, background: '#e5e5e5', borderRadius: 4, marginBottom: 20, overflow: 'hidden' },
  progFill:{ height: '100%', background: '#1D9E75', borderRadius: 4, transition: 'width .4s' },
  progRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#888', marginBottom: 20, marginTop: -14 },
  card:    { background: 'white', border: '0.5px solid #e5e5e5', borderRadius: 12, padding: '20px 20px', marginBottom: 12 },
  label:   { fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: 6 },
  title:   { fontSize: 20, fontWeight: 600, color: '#111', marginBottom: 18 },
  field:   { marginBottom: 16 },
  fLabel:  { display: 'block', fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 6 },
  fHint:   { fontWeight: 400, color: '#888', fontSize: 12, marginLeft: 4 },
  input:   { width: '100%', fontSize: 14, padding: '9px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' },
  select:  { width: '100%', fontSize: 14, padding: '9px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontFamily: 'inherit', background: 'white', boxSizing: 'border-box' },
  textarea:{ width: '100%', fontSize: 14, padding: '9px 12px', borderRadius: 8, border: '0.5px solid #ddd', fontFamily: 'inherit', minHeight: 72, resize: 'vertical', boxSizing: 'border-box' },
  row2:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  row3:    { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 },
  chips:   { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip:    { padding: '6px 14px', borderRadius: 20, border: '0.5px solid #ddd', fontSize: 13, cursor: 'pointer', background: 'white', color: '#333', userSelect: 'none', transition: 'all .15s' },
  chipOn:  { background: '#E1F5EE', borderColor: '#1D9E75', color: '#085041', fontWeight: 500 },
  chipDng: { background: '#FCEBEB', borderColor: '#E24B4A', color: '#791F1F', fontWeight: 500 },
  chipAmb: { background: '#FAEEDA', borderColor: '#BA7517', color: '#633806', fontWeight: 500 },
  infoBox: { background: '#f7f7f7', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#666', marginBottom: 16, borderLeft: '3px solid #9FE1CB' },
  nav:     { display: 'flex', gap: 10, marginTop: 20, alignItems: 'center', justifyContent: 'space-between' },
  btnNext: { padding: '10px 24px', borderRadius: 8, background: '#1D9E75', border: 'none', color: 'white', fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' },
  btnBack: { padding: '10px 20px', borderRadius: 8, background: 'transparent', border: '0.5px solid #ddd', color: '#555', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  dots:    { display: 'flex', gap: 6 },
  dot:     { width: 8, height: 8, borderRadius: '50%', background: '#ddd', transition: 'background .2s' },
  dotOn:   { background: '#1D9E75' },
}

// ── dados das etapas ──────────────────────────────────────────
const TOTAL = 8

const OBJ_PRINCIPAL = ['Ganho de massa muscular','Perda de gordura','Recomposição corporal','Condicionamento físico','Manutenção','Performance esportiva','Saúde e qualidade de vida']
const OBJ_SEC       = ['Mais energia no dia a dia','Reduzir estresse e ansiedade','Melhorar postura','Aumentar flexibilidade','Preparação para evento','Reabilitação']
const NIVEIS        = ['Iniciante — nunca treinei ou parei há mais de 1 ano','Básico — treino há menos de 1 ano','Intermediário — treino consistente há 1–3 anos','Avançado — mais de 3 anos com consistência']
const MODALIDADES   = ['Musculação (academia)','Treino em casa (calistenia)','Corrida / caminhada','Ciclismo','Natação','Crossfit / Funcional','Artes marciais','Yoga / Pilates','Esportes coletivos','Nunca pratiquei']
const PAUSAS        = ['Não parei','Menos de 3 meses','3–6 meses','6–12 meses','Mais de 1 ano']
const LOCAIS        = ['Academia completa','Em casa (sem equipamentos)','Em casa (com equipamentos)','Ao ar livre / parque','Hotel / viagens']
const EQUIPAMENTOS  = ['Halteres / anilhas','Barra e suporte','Kettlebell','Barra fixa (pull-up bar)','Elásticos / bandas','Esteira / bicicleta ergométrica','TRX / argolas','Nenhum']
const DIAS          = ['1 dia','2 dias','3 dias','4 dias','5 dias','6 dias']
const DURACOES      = ['Até 30 min','30–45 min','45–60 min','60–90 min','Mais de 90 min']
const PERIODOS      = ['Manhã cedo (antes das 8h)','Manhã (8h–12h)','Tarde (12h–18h)','Noite (após 18h)','Varia']
const SAUDE         = ['Hipertensão arterial','Diabetes tipo 1 ou 2','Doença cardiovascular','Problemas respiratórios','Hipotireoidismo / Hipertireoidismo','Síndrome do ovário policístico (SOP)','Ansiedade / Depressão','Nenhuma das acima']
const LESOES        = ['Ombro / Manguito rotador','Coluna lombar / hérnia de disco','Joelho (menisco, ligamento)','Quadril / glúteo','Tornozelo / plantar','Cotovelo / punho','Cervical','Nenhuma']
const GESTACAO      = ['Não','Gestante (informe trimestre)','Pós-parto (menos de 6 meses)','Pós-parto (mais de 6 meses)','Não se aplica']
const OCUPACAO      = ['Trabalho sentado (home office / escritório)','Trabalho em pé / movimento leve','Trabalho físico / pesado','Estudante','Aposentado(a)']
const ATIVIDADE     = ['Sedentário (fico muito parado)','Pouco ativo (caminhadas leves)','Moderado (ativo no dia a dia)','Muito ativo (trabalho físico / esportes)']
const ALIMENTACAO   = ['Muito desregulada','Irregular, mas consciente','Razoável, sem dieta específica','Sigo uma dieta com orientação']
const RESTRICOES    = ['Vegetariano(a)','Vegano(a)','Intolerante à lactose','Celíaco(a) / sem glúten','Alergia a ovos','Nenhuma']
const MUSCULOS_FAV  = ['Peito','Costas','Ombros','Bíceps','Tríceps','Glúteos','Quadríceps','Posterior de coxa','Core / Abdômen','Panturrilha','Cardio']
const APP_ANT       = ['Nunca','Sim, mas larguei por falta de motivação','Sim, mas era genérico demais','Sim, funcionou bem']

// ── componente Chip ───────────────────────────────────────────
function Chip({ label, selected, onToggle, variant = 'default' }) {
  let style = { ...S.chip }
  if (selected) {
    if (variant === 'danger') style = { ...S.chip, ...S.chipDng }
    else if (variant === 'amber') style = { ...S.chip, ...S.chipAmb }
    else style = { ...S.chip, ...S.chipOn }
  }
  return <div style={style} onClick={onToggle}>{label}</div>
}

// ── componente principal ──────────────────────────────────────
export default function Anamnese() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [answers, setAnswers] = useState({
    // etapa 1
    nome: '', email: '', nascimento: '', sexo: '', cidade: '',
    // etapa 2
    peso: '', altura: '', gordura: '', pesoMeta: '', prazo: '',
    // etapa 3
    primaryGoal: '', secondaryGoals: [], goalDescription: '',
    // etapa 4
    experienceLevel: '', modalities: [], trainingBreak: '',
    // etapa 5
    location: [], equipment: [], daysPerWeek: '', sessionDuration: '', preferredPeriod: [],
    // etapa 6
    healthConditions: [], injuries: [], injuryNotes: '', medications: '', pregnancyStatus: '',
    // etapa 7
    occupation: '', activityLevel: '', dietQuality: '', dietaryRestrictions: [],
    // etapa 8
    preferredMuscles: [], previousApp: '', additionalNotes: '',
  })

  // helpers
  const set = (key, val) => setAnswers(prev => ({ ...prev, [key]: val }))
  const toggleMulti = (key, val) => setAnswers(prev => {
    const arr = prev[key]
    return { ...prev, [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] }
  })
  const setSingle = (key, val) => set(key, val === answers[key] ? '' : val)

  const pct  = Math.round((step / (TOTAL + 1)) * 100)
  const label = step <= TOTAL ? `Passo ${step} de ${TOTAL}` : 'Revisão'

  // ── mapeamento nível ──────────────────────────────────────
  function getLevelKey(levelStr) {
    if (!levelStr) return 'beginner'
    if (levelStr.startsWith('Iniciante')) return 'beginner'
    if (levelStr.startsWith('Básico'))    return 'basic'
    if (levelStr.startsWith('Intermediário')) return 'intermediate'
    if (levelStr.startsWith('Avançado')) return 'advanced'
    return 'beginner'
  }

  // ── envio ─────────────────────────────────────────────────
  async function handleSubmit() {
    setSaving(true)
    try {
      const plan = generatePlan({
        primaryGoal:     answers.primaryGoal,
        experienceLevel: getLevelKey(answers.experienceLevel),
        daysPerWeek:     answers.daysPerWeek.replace(' dia','').replace('s','').trim(),
        injuries:        answers.injuries.length ? answers.injuries : ['Nenhuma'],
        equipment:       answers.equipment,
        location:        answers.location,
      })

      const { data, error } = await supabase.from('users').insert([{
        nome:           answers.nome,
        email:          answers.email,
        nascimento:     answers.nascimento,
        sexo:           answers.sexo,
        cidade:         answers.cidade,
        peso:           parseFloat(answers.peso) || null,
        altura:         parseFloat(answers.altura) || null,
        gordura:        parseFloat(answers.gordura) || null,
        peso_meta:      parseFloat(answers.pesoMeta) || null,
        prazo_meses:    parseInt(answers.prazo) || null,
        primary_goal:   answers.primaryGoal,
        secondary_goals: answers.secondaryGoals,
        experience_level: getLevelKey(answers.experienceLevel),
        injuries:       answers.injuries,
        health_conditions: answers.healthConditions,
        equipment:      answers.equipment,
        location:       answers.location,
        days_per_week:  parseInt(answers.daysPerWeek) || 3,
        plan:           plan,
        created_at:     new Date().toISOString(),
      }]).select()

      if (error) throw error
      const userId = data[0].id
      navigate(`/home/${userId}`, { state: { plan, user: data[0] } })
    } catch (err) {
      alert('Erro ao salvar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── renderiza etapa ───────────────────────────────────────
  function renderStep() {
    switch (step) {
      case 1: return (
        <div style={S.card}>
          <div style={S.label}>Identificação</div>
          <div style={S.title}>Vamos começar com o básico</div>
          <div style={S.row2}>
            <div style={S.field}><label style={S.fLabel}>Nome completo <span style={{color:'#E24B4A'}}>*</span></label><input style={S.input} value={answers.nome} onChange={e => set('nome', e.target.value)} placeholder="Como quer ser chamado(a)?" /></div>
            <div style={S.field}><label style={S.fLabel}>E-mail <span style={{color:'#E24B4A'}}>*</span></label><input style={S.input} type="email" value={answers.email} onChange={e => set('email', e.target.value)} placeholder="seu@email.com" /></div>
          </div>
          <div style={S.row3}>
            <div style={S.field}><label style={S.fLabel}>Data de nascimento</label><input style={S.input} value={answers.nascimento} onChange={e => set('nascimento', e.target.value)} placeholder="DD/MM/AAAA" /></div>
            <div style={S.field}><label style={S.fLabel}>Sexo biológico</label><select style={S.select} value={answers.sexo} onChange={e => set('sexo', e.target.value)}><option value="">Selecione</option><option>Masculino</option><option>Feminino</option><option>Prefiro não informar</option></select></div>
            <div style={S.field}><label style={S.fLabel}>Cidade / Estado</label><input style={S.input} value={answers.cidade} onChange={e => set('cidade', e.target.value)} placeholder="Ex: Curitiba / PR" /></div>
          </div>
        </div>
      )
      case 2: return (
        <div style={S.card}>
          <div style={S.label}>Biometria</div>
          <div style={S.title}>Medidas corporais atuais</div>
          <div style={S.infoBox}>Estas informações ajudam a calcular seu IMC e a carga ideal para cada exercício.</div>
          <div style={S.row3}>
            <div style={S.field}><label style={S.fLabel}>Peso atual (kg) <span style={{color:'#E24B4A'}}>*</span></label><input style={S.input} type="number" value={answers.peso} onChange={e => set('peso', e.target.value)} placeholder="70" /></div>
            <div style={S.field}><label style={S.fLabel}>Altura (cm) <span style={{color:'#E24B4A'}}>*</span></label><input style={S.input} type="number" value={answers.altura} onChange={e => set('altura', e.target.value)} placeholder="170" /></div>
            <div style={S.field}><label style={S.fLabel}>% Gordura <span style={S.fHint}>(se souber)</span></label><input style={S.input} type="number" value={answers.gordura} onChange={e => set('gordura', e.target.value)} placeholder="22" /></div>
          </div>
          <div style={S.row2}>
            <div style={S.field}><label style={S.fLabel}>Peso desejado (kg)</label><input style={S.input} type="number" value={answers.pesoMeta} onChange={e => set('pesoMeta', e.target.value)} placeholder="75" /></div>
            <div style={S.field}><label style={S.fLabel}>Prazo para meta <span style={S.fHint}>(meses)</span></label><input style={S.input} type="number" value={answers.prazo} onChange={e => set('prazo', e.target.value)} placeholder="6" /></div>
          </div>
        </div>
      )
      case 3: return (
        <div style={S.card}>
          <div style={S.label}>Objetivos</div>
          <div style={S.title}>O que você quer alcançar?</div>
          <div style={S.field}>
            <label style={S.fLabel}>Objetivo principal <span style={{color:'#E24B4A'}}>*</span> <span style={S.fHint}>(escolha um)</span></label>
            <div style={S.chips}>{OBJ_PRINCIPAL.map(o => <Chip key={o} label={o} selected={answers.primaryGoal === o} onToggle={() => setSingle('primaryGoal', o)} />)}</div>
          </div>
          <div style={{...S.field, marginTop: 16}}>
            <label style={S.fLabel}>Objetivos secundários <span style={S.fHint}>(pode marcar vários)</span></label>
            <div style={S.chips}>{OBJ_SEC.map(o => <Chip key={o} label={o} selected={answers.secondaryGoals.includes(o)} onToggle={() => toggleMulti('secondaryGoals', o)} />)}</div>
          </div>
          <div style={{...S.field, marginTop: 16}}>
            <label style={S.fLabel}>Descreva seu objetivo <span style={S.fHint}>(opcional)</span></label>
            <textarea style={S.textarea} value={answers.goalDescription} onChange={e => set('goalDescription', e.target.value)} placeholder="Ex: Quero me preparar para uma corrida de 5km e perder uns 5kg..." />
          </div>
        </div>
      )
      case 4: return (
        <div style={S.card}>
          <div style={S.label}>Experiência</div>
          <div style={S.title}>Qual é o seu histórico com exercícios?</div>
          <div style={S.field}>
            <label style={S.fLabel}>Nível de experiência <span style={{color:'#E24B4A'}}>*</span></label>
            <div style={S.chips}>{NIVEIS.map(n => <Chip key={n} label={n} selected={answers.experienceLevel === n} onToggle={() => setSingle('experienceLevel', n)} />)}</div>
          </div>
          <div style={{...S.field, marginTop: 16}}>
            <label style={S.fLabel}>Modalidades que já praticou</label>
            <div style={S.chips}>{MODALIDADES.map(m => <Chip key={m} label={m} selected={answers.modalities.includes(m)} onToggle={() => toggleMulti('modalities', m)} />)}</div>
          </div>
          <div style={{...S.field, marginTop: 16}}>
            <label style={S.fLabel}>Tempo sem treinar regularmente</label>
            <div style={S.chips}>{PAUSAS.map(p => <Chip key={p} label={p} selected={answers.trainingBreak === p} onToggle={() => setSingle('trainingBreak', p)} />)}</div>
          </div>
        </div>
      )
      case 5: return (
        <div style={S.card}>
          <div style={S.label}>Disponibilidade e Estrutura</div>
          <div style={S.title}>Como e onde você vai treinar?</div>
          <div style={S.field}>
            <label style={S.fLabel}>Local de treino <span style={{color:'#E24B4A'}}>*</span> <span style={S.fHint}>(pode marcar vários)</span></label>
            <div style={S.chips}>{LOCAIS.map(l => <Chip key={l} label={l} selected={answers.location.includes(l)} onToggle={() => toggleMulti('location', l)} />)}</div>
          </div>
          <div style={{...S.field, marginTop: 16}}>
            <label style={S.fLabel}>Equipamentos disponíveis</label>
            <div style={S.chips}>{EQUIPAMENTOS.map(e => <Chip key={e} label={e} selected={answers.equipment.includes(e)} onToggle={() => toggleMulti('equipment', e)} />)}</div>
          </div>
          <div style={{...S.field, marginTop: 16}}>
            <label style={S.fLabel}>Dias disponíveis por semana <span style={{color:'#E24B4A'}}>*</span></label>
            <div style={S.chips}>{DIAS.map(d => <Chip key={d} label={d} selected={answers.daysPerWeek === d} onToggle={() => setSingle('daysPerWeek', d)} />)}</div>
          </div>
          <div style={{...S.field, marginTop: 16}}>
            <label style={S.fLabel}>Duração ideal por sessão <span style={{color:'#E24B4A'}}>*</span></label>
            <div style={S.chips}>{DURACOES.map(d => <Chip key={d} label={d} selected={answers.sessionDuration === d} onToggle={() => setSingle('sessionDuration', d)} />)}</div>
          </div>
          <div style={{...S.field, marginTop: 16}}>
            <label style={S.fLabel}>Período preferido para treinar</label>
            <div style={S.chips}>{PERIODOS.map(p => <Chip key={p} label={p} selected={answers.preferredPeriod.includes(p)} onToggle={() => toggleMulti('preferredPeriod', p)} />)}</div>
          </div>
        </div>
      )
      case 6: return (
        <div style={S.card}>
          <div style={S.label}>Saúde</div>
          <div style={S.title}>Informações de saúde importantes</div>
          <div style={S.infoBox}>Suas respostas são confidenciais e garantem que seu plano seja seguro.</div>
          <div style={S.field}>
            <label style={S.fLabel}>Possui alguma condição de saúde?</label>
            <div style={S.chips}>{SAUDE.map(s => <Chip key={s} label={s} variant="danger" selected={answers.healthConditions.includes(s)} onToggle={() => toggleMulti('healthConditions', s)} />)}</div>
          </div>
          <div style={{...S.field, marginTop: 16}}>
            <label style={S.fLabel}>Lesões ou restrições físicas</label>
            <div style={S.chips}>{LESOES.map(l => <Chip key={l} label={l} variant="amber" selected={answers.injuries.includes(l)} onToggle={() => toggleMulti('injuries', l)} />)}</div>
          </div>
          <div style={{...S.field, marginTop: 16}}>
            <label style={S.fLabel}>Detalhes sobre lesões <span style={S.fHint}>(opcional)</span></label>
            <textarea style={S.textarea} value={answers.injuryNotes} onChange={e => set('injuryNotes', e.target.value)} placeholder="Ex: Hérnia L4-L5, não posso fazer agachamento com carga alta..." />
          </div>
          <div style={{...S.field, marginTop: 8}}>
            <label style={S.fLabel}>Usa algum medicamento regularmente?</label>
            <textarea style={{...S.textarea, minHeight: 56}} value={answers.medications} onChange={e => set('medications', e.target.value)} placeholder="Ex: Losartana 50mg..." />
          </div>
          <div style={{...S.field, marginTop: 16}}>
            <label style={S.fLabel}>Está grávida ou em pós-parto?</label>
            <div style={S.chips}>{GESTACAO.map(g => <Chip key={g} label={g} selected={answers.pregnancyStatus === g} onToggle={() => setSingle('pregnancyStatus', g)} />)}</div>
          </div>
        </div>
      )
      case 7: return (
        <div style={S.card}>
          <div style={S.label}>Estilo de Vida</div>
          <div style={S.title}>Sua rotina fora do treino</div>
          <div style={S.field}>
            <label style={S.fLabel}>Ocupação principal</label>
            <div style={S.chips}>{OCUPACAO.map(o => <Chip key={o} label={o} selected={answers.occupation === o} onToggle={() => setSingle('occupation', o)} />)}</div>
          </div>
          <div style={{...S.field, marginTop: 16}}>
            <label style={S.fLabel}>Nível de atividade fora do treino</label>
            <div style={S.chips}>{ATIVIDADE.map(a => <Chip key={a} label={a} selected={answers.activityLevel === a} onToggle={() => setSingle('activityLevel', a)} />)}</div>
          </div>
          <div style={{...S.field, marginTop: 16}}>
            <label style={S.fLabel}>Alimentação atual</label>
            <div style={S.chips}>{ALIMENTACAO.map(a => <Chip key={a} label={a} selected={answers.dietQuality === a} onToggle={() => setSingle('dietQuality', a)} />)}</div>
          </div>
          <div style={{...S.field, marginTop: 16}}>
            <label style={S.fLabel}>Restrições alimentares</label>
            <div style={S.chips}>{RESTRICOES.map(r => <Chip key={r} label={r} selected={answers.dietaryRestrictions.includes(r)} onToggle={() => toggleMulti('dietaryRestrictions', r)} />)}</div>
          </div>
        </div>
      )
      case 8: return (
        <div style={S.card}>
          <div style={S.label}>Preferências de Treino</div>
          <div style={S.title}>Personalize sua experiência</div>
          <div style={S.field}>
            <label style={S.fLabel}>Grupos musculares favoritos <span style={S.fHint}>(opcional)</span></label>
            <div style={S.chips}>{MUSCULOS_FAV.map(m => <Chip key={m} label={m} selected={answers.preferredMuscles.includes(m)} onToggle={() => toggleMulti('preferredMuscles', m)} />)}</div>
          </div>
          <div style={{...S.field, marginTop: 16}}>
            <label style={S.fLabel}>Já usou app ou plano de treino antes?</label>
            <div style={S.chips}>{APP_ANT.map(a => <Chip key={a} label={a} selected={answers.previousApp === a} onToggle={() => setSingle('previousApp', a)} />)}</div>
          </div>
          <div style={{...S.field, marginTop: 16}}>
            <label style={S.fLabel}>Algum comentário adicional? <span style={S.fHint}>(opcional)</span></label>
            <textarea style={S.textarea} value={answers.additionalNotes} onChange={e => set('additionalNotes', e.target.value)} placeholder="Qualquer coisa que queira que seu treinador saiba..." />
          </div>
        </div>
      )
      default: return null
    }
  }

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div style={S.hIcon}>💪</div>
        <div>
          <div style={S.hTitle}>Anamnese Inicial</div>
          <div style={S.hSub}>Suas respostas moldam um plano 100% personalizado</div>
        </div>
      </div>

      <div style={S.progBar}><div style={{...S.progFill, width: pct + '%'}} /></div>
      <div style={S.progRow}><span>{label}</span><span>{pct}%</span></div>

      {renderStep()}

      <div style={S.nav}>
        {step > 1
          ? <button style={S.btnBack} onClick={() => setStep(s => s - 1)}>← Voltar</button>
          : <div />}
        <div style={S.dots}>
          {Array.from({length: TOTAL}, (_, i) => (
            <div key={i} style={{...S.dot, ...(i + 1 === step ? S.dotOn : i + 1 < step ? {background:'#9FE1CB'} : {})}} />
          ))}
        </div>
        {step < TOTAL
          ? <button style={S.btnNext} onClick={() => setStep(s => s + 1)}>Próximo →</button>
          : <button style={S.btnNext} onClick={handleSubmit} disabled={saving}>
              {saving ? 'Gerando plano...' : 'Gerar meu plano ✓'}
            </button>}
      </div>
    </div>
  )
}

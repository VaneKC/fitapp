// src/lib/planEngine.js
// ─────────────────────────────────────────────────────────────
// Motor de decisão: recebe as respostas da anamnese e retorna
// o plano de treino personalizado completo.
// ─────────────────────────────────────────────────────────────

// ── 1. PROTOCOLO ─────────────────────────────────────────────
export function selectProtocol(primaryGoal) {
  const map = {
    'Ganho de massa muscular': 'hypertrophy',
    'Recomposição corporal':   'hypertrophy',
    'Perda de gordura':        'fat_loss',
    'Condicionamento físico':  'hybrid',
    'Performance esportiva':   'hybrid',
    'Manutenção':              'health',
    'Saúde e qualidade de vida': 'health',
  }
  return map[primaryGoal] || 'health'
}

// ── 2. DIVISÃO DE TREINO ─────────────────────────────────────
export function selectSplit(level, daysPerWeek) {
  if (daysPerWeek <= 2) return 'full_body'
  if (daysPerWeek === 3) return level === 'beginner' ? 'full_body' : 'full_body'
  if (daysPerWeek === 4) return level === 'beginner' ? 'full_body' : 'upper_lower'
  if (daysPerWeek >= 5) return level === 'advanced' ? 'ppl' : 'upper_lower'
  return 'full_body'
}

// ── 3. PARÂMETROS POR NÍVEL E FASE ───────────────────────────
export function getPhaseParams(level, phase) {
  const params = {
    beginner: {
      accumulation: { sets: '2–3', reps: '12–15', effort: 'Bom esforço',   effortColor: '#1D9E75', rest: 90,  rir: 3 },
      deload:       { sets: '2',   reps: '12',     effort: 'Leve',          effortColor: '#9FE1CB', rest: 90,  rir: 4 },
    },
    basic: {
      accumulation:    { sets: '3',   reps: '10–12', effort: 'Bom esforço',   effortColor: '#1D9E75', rest: 90,  rir: 2 },
      intensification: { sets: '3–4', reps: '8–10',  effort: 'Desafiador',    effortColor: '#BA7517', rest: 120, rir: 2 },
      deload:          { sets: '2',   reps: '12',     effort: 'Leve',          effortColor: '#9FE1CB', rest: 60,  rir: 4 },
    },
    intermediate: {
      accumulation:    { sets: '3–4', reps: '8–12',  effort: 'Desafiador',    effortColor: '#BA7517', rest: 120, rir: 2 },
      intensification: { sets: '4',   reps: '6–8',   effort: 'Muito difícil', effortColor: '#D85A30', rest: 180, rir: 1 },
      peak:            { sets: '4–5', reps: '4–6',   effort: 'No limite',     effortColor: '#E24B4A', rest: 240, rir: 1 },
      deload:          { sets: '2',   reps: '12',     effort: 'Leve',          effortColor: '#9FE1CB', rest: 60,  rir: 4 },
    },
    advanced: {
      accumulation:    { sets: '4',   reps: '8–12',  effort: 'Desafiador',    effortColor: '#BA7517', rest: 120, rir: 2 },
      intensification: { sets: '4–5', reps: '5–8',   effort: 'Muito difícil', effortColor: '#D85A30', rest: 180, rir: 1 },
      peak:            { sets: '5',   reps: '3–5',   effort: 'No limite',     effortColor: '#E24B4A', rest: 300, rir: 0 },
      deload:          { sets: '2',   reps: '10',     effort: 'Leve',          effortColor: '#9FE1CB', rest: 60,  rir: 4 },
    },
  }
  return params[level]?.[phase] || params['beginner']['accumulation']
}

// ── 4. BANCO DE EXERCÍCIOS (simplificado para MVP) ───────────
// Formato: { id, name, muscle, pattern, equipment, location,
//            tip, contraindicated, axialLoad, isCompound }
export const EXERCISE_LIBRARY = [
  // ── PEITO ──
  { id: 'bench_barbell',   name: 'Supino reto com barra',       muscle: 'Peito',   pattern: 'push', equipment: ['barra'],    location: ['academia'],        tip: 'Desça a barra até o peito em 3 segundos. Cotovelos a 45° do tronco.',                     contraindicated: ['ombro'], axialLoad: false, isCompound: true  },
  { id: 'bench_dumbbell',  name: 'Supino inclinado com halter', muscle: 'Peito',   pattern: 'push', equipment: ['halteres'], location: ['academia','casa'],  tip: 'Inclinação de 30–45°. Halteres se tocam no topo, não ultrapassam os ombros na descida.', contraindicated: [],        axialLoad: false, isCompound: true  },
  { id: 'pushup',          name: 'Flexão de braços',            muscle: 'Peito',   pattern: 'push', equipment: [],           location: ['academia','casa','ar livre'], tip: 'Corpo reto da cabeça ao calcanhar. Desça até o peito quase tocar o chão.',          contraindicated: [],        axialLoad: false, isCompound: true  },
  { id: 'crossover',       name: 'Crossover no cabo',           muscle: 'Peito',   pattern: 'push', equipment: ['cabo'],     location: ['academia'],        tip: 'Cotovelos levemente flexionados. Foco na contração no centro do peito.',               contraindicated: ['ombro'], axialLoad: false, isCompound: false },

  // ── COSTAS ──
  { id: 'row_barbell',     name: 'Remada curvada com barra',    muscle: 'Costas',  pattern: 'pull', equipment: ['barra'],    location: ['academia'],        tip: 'Tronco a ~45°. Retraia as escápulas antes de puxar. Desça em 3 segundos.',            contraindicated: ['lombar'], axialLoad: true,  isCompound: true  },
  { id: 'row_dumbbell',    name: 'Remada unilateral com halter',muscle: 'Costas',  pattern: 'pull', equipment: ['halteres'], location: ['academia','casa'],  tip: 'Apoie o joelho no banco. Puxe o cotovelo para cima, não para trás.',                  contraindicated: [],         axialLoad: false, isCompound: true  },
  { id: 'pulldown',        name: 'Puxada alta na máquina',      muscle: 'Costas',  pattern: 'pull', equipment: ['máquina'],  location: ['academia'],        tip: 'Puxe até o queixo ficar na altura da barra. Cotovelos apontam para baixo.',           contraindicated: ['ombro'],  axialLoad: false, isCompound: true  },
  { id: 'pullup',          name: 'Barra fixa',                  muscle: 'Costas',  pattern: 'pull', equipment: ['barra fixa'],location: ['academia','casa'], tip: 'Partida com braços estendidos. Suba até o queixo passar a barra.',                    contraindicated: ['ombro'],  axialLoad: false, isCompound: true  },
  { id: 'row_machine',     name: 'Remada na máquina',           muscle: 'Costas',  pattern: 'pull', equipment: ['máquina'],  location: ['academia'],        tip: 'Ajuste o assento para os cotovelos ficarem na altura dos ombros. Retraia no fim.',    contraindicated: [],         axialLoad: false, isCompound: true  },
  { id: 'row_cable',       name: 'Remada no cabo sentado',      muscle: 'Costas',  pattern: 'pull', equipment: ['cabo'],     location: ['academia'],        tip: 'Tronco ereto. Puxe até os cotovelos passarem o tronco. Controle a volta.',           contraindicated: [],         axialLoad: false, isCompound: true  },

  // ── OMBROS ──
  { id: 'ohp_barbell',     name: 'Desenvolvimento com barra',   muscle: 'Ombros',  pattern: 'push', equipment: ['barra'],    location: ['academia'],        tip: 'Core contraído. Não arqueie a lombar. Barra sobre a cabeça no topo.',                contraindicated: ['ombro','lombar'], axialLoad: true,  isCompound: true  },
  { id: 'ohp_dumbbell',    name: 'Desenvolvimento com halter',  muscle: 'Ombros',  pattern: 'push', equipment: ['halteres'], location: ['academia','casa'],  tip: 'Halteres na altura das orelhas. Suba em linha reta, sem inclinar o tronco.',         contraindicated: ['ombro'],  axialLoad: false, isCompound: true  },
  { id: 'lateral_raise',   name: 'Elevação lateral',            muscle: 'Ombros',  pattern: 'push', equipment: ['halteres'], location: ['academia','casa'],  tip: 'Braços levemente flexionados. Suba até a altura dos ombros, não além.',             contraindicated: [],         axialLoad: false, isCompound: false },

  // ── BÍCEPS ──
  { id: 'curl_barbell',    name: 'Rosca direta com barra',      muscle: 'Bíceps',  pattern: 'pull', equipment: ['barra'],    location: ['academia'],        tip: 'Cotovelos fixos ao lado do corpo. Suba em 1 seg, desça em 3 seg.',                  contraindicated: ['cotovelo'], axialLoad: false, isCompound: false },
  { id: 'curl_dumbbell',   name: 'Rosca alternada com halter',  muscle: 'Bíceps',  pattern: 'pull', equipment: ['halteres'], location: ['academia','casa'],  tip: 'Gire o pulso ao subir (supinação). Não balance o tronco.',                          contraindicated: ['cotovelo'], axialLoad: false, isCompound: false },
  { id: 'curl_cable',      name: 'Rosca no cabo',               muscle: 'Bíceps',  pattern: 'pull', equipment: ['cabo'],     location: ['academia'],        tip: 'Tensão constante durante todo o movimento. Ótimo para contração no fim.',           contraindicated: [],           axialLoad: false, isCompound: false },

  // ── TRÍCEPS ──
  { id: 'tricep_pushdown', name: 'Tríceps no cabo (puxada)',    muscle: 'Tríceps', pattern: 'push', equipment: ['cabo'],     location: ['academia'],        tip: 'Cotovelos fixos. Desça até os braços ficarem completamente estendidos.',             contraindicated: ['cotovelo'], axialLoad: false, isCompound: false },
  { id: 'tricep_dumbbell', name: 'Rosca francesa com halter',   muscle: 'Tríceps', pattern: 'push', equipment: ['halteres'], location: ['academia','casa'],  tip: 'Cotovelos próximos à cabeça. Abaixe o halter atrás da cabeça devagar.',            contraindicated: ['cotovelo','ombro'], axialLoad: false, isCompound: false },
  { id: 'dips',            name: 'Mergulho (paralelas)',         muscle: 'Tríceps', pattern: 'push', equipment: [],           location: ['academia','casa'],  tip: 'Tronco ereto para focar no tríceps. Desça até cotovelos a 90°.',                    contraindicated: ['ombro'],   axialLoad: false, isCompound: true  },

  // ── PERNAS (quad) ──
  { id: 'squat',           name: 'Agachamento livre',           muscle: 'Quadríceps', pattern: 'squat', equipment: ['barra'],    location: ['academia'],        tip: 'Pés na largura dos ombros. Desça até as coxas ficarem paralelas ao chão.',         contraindicated: ['joelho','lombar'], axialLoad: true,  isCompound: true  },
  { id: 'leg_press',       name: 'Leg press',                   muscle: 'Quadríceps', pattern: 'squat', equipment: ['máquina'],  location: ['academia'],        tip: 'Não trave os joelhos no topo. Desça até 90° de flexão.',                           contraindicated: ['joelho'], axialLoad: false, isCompound: true  },
  { id: 'lunge',           name: 'Avanço com halteres',         muscle: 'Quadríceps', pattern: 'squat', equipment: ['halteres'], location: ['academia','casa'],  tip: 'Passo largo. Joelho de trás quase toca o chão. Tronco ereto.',                     contraindicated: ['joelho'], axialLoad: false, isCompound: true  },
  { id: 'goblet_squat',    name: 'Agachamento goblet',          muscle: 'Quadríceps', pattern: 'squat', equipment: ['halteres'], location: ['academia','casa'],  tip: 'Halter no peito. Cotovelos por dentro dos joelhos. Ótimo para iniciantes.',        contraindicated: [],         axialLoad: false, isCompound: true  },
  { id: 'wall_sit',        name: 'Cadeira na parede',           muscle: 'Quadríceps', pattern: 'squat', equipment: [],           location: ['academia','casa','ar livre'], tip: 'Costas retas na parede. Joelhos a 90°. Segure o tempo.',               contraindicated: [],         axialLoad: false, isCompound: false },

  // ── PERNAS (posterior / hinge) ──
  { id: 'deadlift',        name: 'Levantamento terra',          muscle: 'Posterior', pattern: 'hinge', equipment: ['barra'],    location: ['academia'],        tip: 'Barra próxima às canelas. Quadril para baixo, peito para cima. Empurre o chão.',   contraindicated: ['lombar'], axialLoad: true,  isCompound: true  },
  { id: 'rdl',             name: 'Terra romeno com halteres',   muscle: 'Posterior', pattern: 'hinge', equipment: ['halteres'], location: ['academia','casa'],  tip: 'Joelhos levemente flexionados. Desça os halteres pela frente das pernas.',         contraindicated: ['lombar'], axialLoad: false, isCompound: true  },
  { id: 'leg_curl',        name: 'Mesa flexora',                muscle: 'Posterior', pattern: 'hinge', equipment: ['máquina'],  location: ['academia'],        tip: 'Quadril não levanta da mesa. Desça devagar, 3 segundos.',                           contraindicated: [],         axialLoad: false, isCompound: false },
  { id: 'hip_thrust',      name: 'Elevação de quadril',         muscle: 'Glúteos',   pattern: 'hinge', equipment: ['halteres'], location: ['academia','casa'],  tip: 'Ombros apoiados no banco. Suba o quadril até alinhar com os joelhos.',             contraindicated: [],         axialLoad: false, isCompound: true  },
  { id: 'glute_bridge',    name: 'Ponte de glúteo',             muscle: 'Glúteos',   pattern: 'hinge', equipment: [],           location: ['academia','casa','ar livre'], tip: 'Pés no chão, joelhos a 90°. Contraia os glúteos no topo por 2 segundos.',    contraindicated: [],         axialLoad: false, isCompound: false },

  // ── CORE ──
  { id: 'plank',           name: 'Prancha isométrica',          muscle: 'Core',    pattern: 'core', equipment: [],           location: ['academia','casa','ar livre'], tip: 'Corpo reto. Não deixe o quadril cair. Respire normalmente.',              contraindicated: [],         axialLoad: false, isCompound: false },
  { id: 'deadbug',         name: 'Dead bug',                    muscle: 'Core',    pattern: 'core', equipment: [],           location: ['academia','casa'],  tip: 'Lombar encostada no chão o tempo todo. Mova braço e perna opostos.',              contraindicated: [],         axialLoad: false, isCompound: false },
  { id: 'pallof_press',    name: 'Pallof press no cabo',        muscle: 'Core',    pattern: 'core', equipment: ['cabo'],     location: ['academia'],        tip: 'Resist a rotação. Segure 2 segundos com os braços estendidos.',                   contraindicated: [],         axialLoad: false, isCompound: false },
]

// ── 5. FILTRO DE EXERCÍCIOS ───────────────────────────────────
export function filterExercises(library, { injuries, equipment, location, level }) {
  // mapeia lesões para padrões contraindicados
  const injuryMap = {
    'Ombro / Manguito rotador':      ['ombro'],
    'Coluna lombar / hérnia de disco': ['lombar'],
    'Joelho (menisco, ligamento)':   ['joelho'],
    'Quadril / glúteo':              [],
    'Tornozelo / plantar':           [],
    'Cotovelo / punho':              ['cotovelo'],
    'Cervical':                      ['ombro'],
    'Nenhuma':                       [],
  }
  const blocked = injuries.flatMap(i => injuryMap[i] || [])
  const equipLower = equipment.map(e => e.toLowerCase())
  const locLower = location.map(l => l.toLowerCase())

  return library.filter(ex => {
    // bloqueia contraindicados
    if (ex.contraindicated.some(c => blocked.includes(c))) return false
    // filtra por local
    const hasLocation = ex.location.some(l =>
      locLower.some(ul => ul.includes('academia') ? l === 'academia' : ul.includes('casa') ? l === 'casa' : ul.includes('ar livre') ? l === 'ar livre' : false)
    )
    if (!hasLocation && ex.equipment.length > 0) return false
    // filtra por equipamento (sem equipamento = corpo livre, sempre disponível)
    if (ex.equipment.length > 0) {
      const hasEquip = ex.equipment.some(e =>
        equipLower.some(ue => ue.includes(e.toLowerCase()) || e === 'máquina' && ue.includes('máquina'))
      )
      if (!hasEquip && !locLower.some(l => l.includes('academia'))) return false
    }
    // filtra por nível
    if (level === 'beginner' && ex.id === 'pullup') return false
    if (level === 'beginner' && ex.id === 'deadlift') return false
    return true
  })
}

// ── 6. GERADOR DE SESSÕES ─────────────────────────────────────
export function buildSessions(split, filteredExercises, params, daysPerWeek) {
  const sessionTemplates = {
    full_body: buildFullBodySessions(filteredExercises, params, daysPerWeek),
    upper_lower: buildUpperLowerSessions(filteredExercises, params),
    ppl: buildPPLSessions(filteredExercises, params),
  }
  return sessionTemplates[split] || sessionTemplates['full_body']
}

function pickExercises(pool, pattern, n, preferred = []) {
  const preferredFirst = [...preferred, ...pool.filter(e => !preferred.includes(e))]
  return preferredFirst.filter(e => e.pattern === pattern).slice(0, n)
}

function buildFullBodySessions(exercises, params, daysPerWeek) {
  const compounds = exercises.filter(e => e.isCompound)
  const sessions = []
  const labels = ['A', 'B', 'C']

  for (let i = 0; i < Math.min(daysPerWeek, 3); i++) {
    const squat   = compounds.filter(e => e.pattern === 'squat')[i % 2 === 0 ? 0 : 1] || compounds.find(e => e.pattern === 'squat')
    const hinge   = compounds.filter(e => e.pattern === 'hinge')[i % 2 === 0 ? 0 : 1] || compounds.find(e => e.pattern === 'hinge')
    const push    = compounds.filter(e => e.pattern === 'push')[i % 2 === 0 ? 0 : 1]  || compounds.find(e => e.pattern === 'push')
    const pull    = compounds.filter(e => e.pattern === 'pull')[i % 2 === 0 ? 0 : 1]  || compounds.find(e => e.pattern === 'pull')
    const core    = exercises.find(e => e.pattern === 'core')

    const exList = [squat, hinge, push, pull, core].filter(Boolean)

    sessions.push({
      label: `Treino ${labels[i]} — Full Body`,
      muscleGroups: ['Pernas', 'Costas', 'Peito', 'Core'],
      exercises: exList.map(ex => ({
        ...ex,
        sets: params.sets,
        reps: ex.pattern === 'core' ? '30–45 seg' : params.reps,
        rest: params.rest,
        effort: params.effort,
        effortColor: params.effortColor,
      }))
    })
  }
  return sessions
}

function buildUpperLowerSessions(exercises, params) {
  const upper = exercises.filter(e => ['push','pull'].includes(e.pattern))
  const lower = exercises.filter(e => ['squat','hinge'].includes(e.pattern))
  const core  = exercises.filter(e => e.pattern === 'core')

  return [
    {
      label: 'Treino A — Superior (Peito e Costas)',
      muscleGroups: ['Peito', 'Costas', 'Ombros'],
      exercises: [
        ...upper.filter(e => e.isCompound).slice(0,2),
        ...upper.filter(e => !e.isCompound).slice(0,2),
      ].filter(Boolean).map(ex => ({ ...ex, sets: params.sets, reps: params.reps, rest: params.rest, effort: params.effort, effortColor: params.effortColor }))
    },
    {
      label: 'Treino B — Inferior (Pernas e Glúteos)',
      muscleGroups: ['Quadríceps', 'Posterior', 'Glúteos'],
      exercises: [
        ...lower.filter(e => e.isCompound).slice(0,2),
        ...lower.filter(e => !e.isCompound).slice(0,2),
        ...core.slice(0,1),
      ].filter(Boolean).map(ex => ({ ...ex, sets: params.sets, reps: ex.pattern === 'core' ? '30–45 seg' : params.reps, rest: params.rest, effort: params.effort, effortColor: params.effortColor }))
    },
    {
      label: 'Treino C — Superior (Ombros e Braços)',
      muscleGroups: ['Ombros', 'Bíceps', 'Tríceps'],
      exercises: [
        ...upper.filter(e => ['Ombros','Bíceps','Tríceps'].includes(e.muscle)).slice(0,4),
      ].filter(Boolean).map(ex => ({ ...ex, sets: params.sets, reps: params.reps, rest: params.rest, effort: params.effort, effortColor: params.effortColor }))
    },
    {
      label: 'Treino D — Inferior (Volume)',
      muscleGroups: ['Quadríceps', 'Posterior', 'Core'],
      exercises: [
        ...lower.slice(0,3),
        ...core.slice(0,1),
      ].filter(Boolean).map(ex => ({ ...ex, sets: params.sets, reps: ex.pattern === 'core' ? '30–45 seg' : params.reps, rest: params.rest, effort: params.effort, effortColor: params.effortColor }))
    },
  ]
}

function buildPPLSessions(exercises, params) {
  const push  = exercises.filter(e => e.pattern === 'push')
  const pull  = exercises.filter(e => e.pattern === 'pull')
  const lower = exercises.filter(e => ['squat','hinge'].includes(e.pattern))
  const core  = exercises.filter(e => e.pattern === 'core')

  return [
    { label: 'Push — Peito, Ombros e Tríceps', muscleGroups: ['Peito', 'Ombros', 'Tríceps'],
      exercises: push.slice(0,4).map(ex => ({ ...ex, sets: params.sets, reps: params.reps, rest: params.rest, effort: params.effort, effortColor: params.effortColor })) },
    { label: 'Pull — Costas e Bíceps', muscleGroups: ['Costas', 'Bíceps'],
      exercises: pull.slice(0,4).map(ex => ({ ...ex, sets: params.sets, reps: params.reps, rest: params.rest, effort: params.effort, effortColor: params.effortColor })) },
    { label: 'Legs — Pernas e Glúteos', muscleGroups: ['Quadríceps', 'Posterior', 'Glúteos', 'Core'],
      exercises: [...lower.slice(0,3), ...core.slice(0,1)].map(ex => ({ ...ex, sets: params.sets, reps: ex.pattern === 'core' ? '30–45 seg' : params.reps, rest: params.rest, effort: params.effort, effortColor: params.effortColor })) },
  ]
}

// ── 7. GERADOR PRINCIPAL ──────────────────────────────────────
export function generatePlan(answers) {
  const protocol = selectProtocol(answers.primaryGoal)
  const level    = answers.experienceLevel || 'beginner'
  const days     = parseInt(answers.daysPerWeek) || 3
  const split    = selectSplit(level, days)
  const phase    = 'accumulation'
  const params   = getPhaseParams(level, phase)

  const filtered = filterExercises(EXERCISE_LIBRARY, {
    injuries:  answers.injuries || ['Nenhuma'],
    equipment: answers.equipment || [],
    location:  answers.location  || ['academia'],
    level,
  })

  const sessions = buildSessions(split, filtered, params, days)

  return {
    protocol,
    level,
    split,
    phase,
    params,
    sessions,
    mesocycleName: 'Acumulação 1',
    totalWeeks: level === 'beginner' ? 4 : 6,
    deloadWeek: level === 'beginner' ? 4 : 6,
  }
}

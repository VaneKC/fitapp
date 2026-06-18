// src/lib/planEngine.js
import { EXERCISE_LIBRARY } from './exerciseLibrary'

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
  if (daysPerWeek === 3) return 'full_body'
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
      peak:            { sets: '4–5', reps: '4–6',   effort: 'No limite',     effortColor: '#E24B4A', rest: 240, rir: 0 },
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

// ── 4. FILTRO DE EXERCÍCIOS ───────────────────────────────────
export function filterExercises(library, { injuries, equipment, location, level }) {
  const injuryMap = {
    'Ombro / Manguito rotador':        ['ombro'],
    'Coluna lombar / hérnia de disco': ['lombar'],
    'Joelho (menisco, ligamento)':     ['joelho'],
    'Quadril / glúteo':                [],
    'Tornozelo / plantar':             [],
    'Cotovelo / punho':                ['cotovelo'],
    'Cervical':                        ['ombro'],
    'Nenhuma':                         [],
  }
  const blocked   = injuries.flatMap(i => injuryMap[i] || [])
  const equipLower = equipment.map(e => e.toLowerCase())
  const locLower   = location.map(l => l.toLowerCase())

  return library.filter(ex => {
    // bloqueia contraindicados
    if (ex.contraindicated.some(c => blocked.includes(c))) return false

    // filtra por local
    const hasLocation = ex.location.some(l =>
      locLower.some(ul =>
        ul.includes('academia') ? l === 'academia' :
        ul.includes('casa')     ? l === 'casa' :
        ul.includes('ar livre') ? l === 'ar livre' : false
      )
    )
    if (!hasLocation && ex.equipment.length > 0) return false

    // filtra por equipamento
    if (ex.equipment.length > 0) {
      const hasEquip = ex.equipment.some(e =>
        equipLower.some(ue =>
          ue.includes(e.toLowerCase()) ||
          (e === 'máquina' && ue.includes('máquina'))
        )
      )
      if (!hasEquip && !locLower.some(l => l.includes('academia'))) return false
    }

    // filtra por nível
    if (level === 'beginner' && ex.id === 'pullup')   return false
    if (level === 'beginner' && ex.id === 'deadlift') return false

    return true
  })
}

// ── 5. GERADOR DE SESSÕES ─────────────────────────────────────
export function buildSessions(split, filteredExercises, params, daysPerWeek) {
  const sessionTemplates = {
    full_body:   buildFullBodySessions(filteredExercises, params, daysPerWeek),
    upper_lower: buildUpperLowerSessions(filteredExercises, params),
    ppl:         buildPPLSessions(filteredExercises, params),
  }
  return sessionTemplates[split] || sessionTemplates['full_body']
}

function buildFullBodySessions(exercises, params, daysPerWeek) {
  const compounds = exercises.filter(e => e.isCompound)
  const sessions  = []
  const labels    = ['A', 'B', 'C']

  for (let i = 0; i < Math.min(daysPerWeek, 3); i++) {
    const squat = compounds.filter(e => e.pattern === 'squat')[i % 2 === 0 ? 0 : 1] || compounds.find(e => e.pattern === 'squat')
    const hinge = compounds.filter(e => e.pattern === 'hinge')[i % 2 === 0 ? 0 : 1] || compounds.find(e => e.pattern === 'hinge')
    const push  = compounds.filter(e => e.pattern === 'push')[i % 2 === 0 ? 0 : 1]  || compounds.find(e => e.pattern === 'push')
    const pull  = compounds.filter(e => e.pattern === 'pull')[i % 2 === 0 ? 0 : 1]  || compounds.find(e => e.pattern === 'pull')
    const core  = exercises.find(e => e.pattern === 'core')

    const exList = [squat, hinge, push, pull, core].filter(Boolean)

    sessions.push({
      label: `Treino ${labels[i]} — Full Body`,
      muscleGroups: ['Pernas', 'Costas', 'Peito', 'Core'],
      exercises: exList.map(ex => ({
        ...ex,
        sets:        params.sets,
        reps:        ex.isometric ? '30–60 seg' : (ex.pattern === 'core' ? '30–45 seg' : params.reps),
        rest:        params.rest,
        effort:      params.effort,
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

  function mapEx(ex) {
    return {
      ...ex,
      sets:        params.sets,
      reps:        ex.isometric ? '30–60 seg' : (ex.pattern === 'core' ? '30–45 seg' : params.reps),
      rest:        params.rest,
      effort:      params.effort,
      effortColor: params.effortColor,
    }
  }

  return [
    {
      label: 'Treino A — Superior (Peito e Costas)',
      muscleGroups: ['Peito', 'Costas', 'Ombros'],
      exercises: [
        ...upper.filter(e => e.isCompound).slice(0, 2),
        ...upper.filter(e => !e.isCompound).slice(0, 2),
      ].filter(Boolean).map(mapEx)
    },
    {
      label: 'Treino B — Inferior (Pernas e Glúteos)',
      muscleGroups: ['Quadríceps', 'Posterior', 'Glúteos'],
      exercises: [
        ...lower.filter(e => e.isCompound).slice(0, 2),
        ...lower.filter(e => !e.isCompound).slice(0, 2),
        ...core.slice(0, 1),
      ].filter(Boolean).map(mapEx)
    },
    {
      label: 'Treino C — Superior (Ombros e Braços)',
      muscleGroups: ['Ombros', 'Bíceps', 'Tríceps'],
      exercises: [
        ...upper.filter(e => ['Ombros','Bíceps','Tríceps'].includes(e.muscle)).slice(0, 4),
      ].filter(Boolean).map(mapEx)
    },
    {
      label: 'Treino D — Inferior (Volume)',
      muscleGroups: ['Quadríceps', 'Posterior', 'Core'],
      exercises: [
        ...lower.slice(0, 3),
        ...core.slice(0, 1),
      ].filter(Boolean).map(mapEx)
    },
  ]
}

function buildPPLSessions(exercises, params) {
  const push  = exercises.filter(e => e.pattern === 'push')
  const pull  = exercises.filter(e => e.pattern === 'pull')
  const lower = exercises.filter(e => ['squat','hinge'].includes(e.pattern))
  const core  = exercises.filter(e => e.pattern === 'core')

  function mapEx(ex) {
    return {
      ...ex,
      sets:        params.sets,
      reps:        ex.isometric ? '30–60 seg' : (ex.pattern === 'core' ? '30–45 seg' : params.reps),
      rest:        params.rest,
      effort:      params.effort,
      effortColor: params.effortColor,
    }
  }

  return [
    {
      label: 'Push — Peito, Ombros e Tríceps',
      muscleGroups: ['Peito', 'Ombros', 'Tríceps'],
      exercises: push.slice(0, 4).map(mapEx)
    },
    {
      label: 'Pull — Costas e Bíceps',
      muscleGroups: ['Costas', 'Bíceps'],
      exercises: pull.slice(0, 4).map(mapEx)
    },
    {
      label: 'Legs — Pernas e Glúteos',
      muscleGroups: ['Quadríceps', 'Posterior', 'Glúteos', 'Core'],
      exercises: [...lower.slice(0, 3), ...core.slice(0, 1)].map(mapEx)
    },
  ]
}

// ── 6. GERADOR PRINCIPAL ──────────────────────────────────────
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

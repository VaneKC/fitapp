// src/lib/weeklyProgression.js
const PHASE_PARAMS = {
  beginner: {
    accumulation: { sets: '2–3', reps: '12–15', effort: 'Bom esforço',   effortColor: '#1D9E75', rest: 90,  rir: 3 },
    deload:       { sets: '2',   reps: '12',     effort: 'Leve',          effortColor: '#9FE1CB', rest: 60,  rir: 4 },
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

const MESOCYCLE_STRUCTURE = {
  beginner:     ['accumulation','accumulation','accumulation','deload'],
  basic:        ['accumulation','accumulation','accumulation','intensification','intensification','deload'],
  intermediate: ['accumulation','accumulation','intensification','intensification','peak','deload'],
  advanced:     ['accumulation','accumulation','intensification','intensification','peak','peak','deload'],
}

const PHASE_NAMES = {
  accumulation: 'Acumulação', intensification: 'Intensificação', peak: 'Pico', deload: 'Deload',
}

export function getCurrentPhase(level, currentWeek) {
  const structure = MESOCYCLE_STRUCTURE[level] || MESOCYCLE_STRUCTURE.beginner
  return structure[(currentWeek - 1) % structure.length] || 'accumulation'
}

export function getPhaseName(phase) {
  return PHASE_NAMES[phase] || 'Acumulação'
}

export function getWeekParams(level, currentWeek) {
  const phase  = getCurrentPhase(level, currentWeek)
  const params = PHASE_PARAMS[level]?.[phase] || PHASE_PARAMS.beginner.accumulation
  return { ...params, phase, phaseName: getPhaseName(phase) }
}

export function isDeloadWeek(level, currentWeek) {
  return getCurrentPhase(level, currentWeek) === 'deload'
}

export function calcCurrentWeek(createdAt) {
  if (!createdAt) return 1
  const diff = new Date() - new Date(createdAt)
  return Math.max(Math.floor(diff / (1000 * 60 * 60 * 24 * 7)) + 1, 1)
}

export function getMesocycleStructure(level) {
  return (MESOCYCLE_STRUCTURE[level] || MESOCYCLE_STRUCTURE.beginner).map((phase, i) => ({
    week: i + 1, phase, phaseName: getPhaseName(phase), isDeload: phase === 'deload',
  }))
}

// Fatores de progressão mínima esperada por nível (% do peso usado por semana)
const PROGRESSION_FACTORS = {
  beginner:     { minPctPerWeek: 0.02, minWeeksBeforePlateau: 2 },
  basic:        { minPctPerWeek: 0.01, minWeeksBeforePlateau: 3 },
  intermediate: { minPctPerWeek: 0.005, minWeeksBeforePlateau: 4 },
  advanced:     { minPctPerWeek: 0.0025, minWeeksBeforePlateau: 6 },
}

// Filtra logs válidos para análise — ignora sessões com check-in ruim (score ≤ 3)
function getValidLogs(logs) {
  return logs.filter(log => {
    // se não tem check-in salvo, considera válido (compatibilidade retroativa)
    if (log.checkin_score === null || log.checkin_score === undefined) return true
    return log.checkin_score >= 4
  })
}

// Detecta fadiga acumulada — muitos check-ins ruins seguidos
export function detectAccumulatedFatigue(logs) {
  if (!logs || logs.length < 3) return false
  const recent = logs
    .filter(l => l.checkin_score !== null && l.checkin_score !== undefined)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
  if (recent.length < 3) return false
  const lowScoreCount = recent.filter(l => l.checkin_score <= 3).length
  return lowScoreCount >= 3 // 3+ dos últimos 5 treinos com score ruim
}

export function analyzeProgression(logs, exerciseName, level = 'beginner') {
  if (!logs || logs.length < 2) return 'insufficient_data'

  // usa só logs válidos (check-in score ≥ 4 ou sem check-in)
  const validLogs = getValidLogs(logs)

  const filtered = validLogs
    .filter(log => log.sets_log?.some(s => s.exercise_name === exerciseName))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  if (filtered.length < 2) return 'insufficient_data'

  const factor = PROGRESSION_FACTORS[level] || PROGRESSION_FACTORS.beginner
  const minWeeks = factor.minWeeksBeforePlateau

  // verifica se já passou o tempo mínimo antes de declarar plateau
  const firstDate = new Date(filtered[0].created_at)
  const lastDate  = new Date(filtered[filtered.length - 1].created_at)
  const weeksBetween = (lastDate - firstDate) / (1000 * 60 * 60 * 24 * 7)
  if (weeksBetween < minWeeks) return 'insufficient_data'

  // pega peso máximo por sessão
  const getMaxWeight = log => {
    const sets = log.sets_log?.filter(s => s.exercise_name === exerciseName) || []
    return Math.max(...sets.map(s => parseFloat(s.weight_kg) || 0), 0)
  }

  const recentSessions = filtered.slice(-4)
  const weights = recentSessions.map(getMaxWeight)
  const recent  = weights.slice(-2)
  const older   = weights.slice(0, -2)

  const rAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const oAvg = older.length ? older.reduce((a, b) => a + b, 0) / older.length : rAvg

  // threshold proporcional: % do peso médio por semana
  const avgWeight   = (rAvg + oAvg) / 2 || 1
  const minProgress = avgWeight * factor.minPctPerWeek * weeksBetween

  const diff = rAvg - oAvg
  if (diff >= minProgress) return 'progressing'
  if (diff < -minProgress) return 'regressing'
  return 'stagnant'
}

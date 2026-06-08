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

export function analyzeProgression(logs, exerciseName) {
  if (!logs || logs.length < 2) return 'insufficient_data'
  const filtered = logs
    .filter(log => log.sets_log?.some(s => s.exercise_name === exerciseName))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .slice(-4)
  if (filtered.length < 2) return 'insufficient_data'
  const getMax = log => Math.max(...(log.sets_log?.filter(s => s.exercise_name === exerciseName).map(s => parseFloat(s.weight_kg) || 0) || [0]))
  const weights = filtered.map(getMax)
  const recent  = weights.slice(-2)
  const older   = weights.slice(0, -2)
  const rAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const oAvg = older.length ? older.reduce((a, b) => a + b, 0) / older.length : rAvg
  const diff = rAvg - oAvg
  if (diff > 1)  return 'progressing'
  if (diff < -1) return 'regressing'
  return 'stagnant'
}

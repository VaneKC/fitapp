// src/lib/levelEvaluation.js
// ─────────────────────────────────────────────────────────────
// Avalia se o usuário está pronto para avançar de nível
// e gera o próximo mesociclo automaticamente
// ─────────────────────────────────────────────────────────────
import { getMesocycleStructure, analyzeProgression } from './weeklyProgression'
import { generatePlan } from './planEngine'

// Thresholds de força relativa por nível (múltiplos do peso corporal)
const STRENGTH_THRESHOLDS = {
  beginner: {
    squat: 1.0, bench: 0.75, deadlift: 1.25, row: 0.75,
  },
  basic: {
    squat: 1.25, bench: 1.0, deadlift: 1.5, row: 1.0,
  },
  intermediate: {
    squat: 1.5, bench: 1.25, deadlift: 2.0, row: 1.25,
  },
}

// Exercícios substitutos para cada padrão de movimento
const MOVEMENT_ALTERNATIVES = {
  squat:    ['Agachamento livre','Leg press','Agachamento goblet','Avanço com halteres','Cadeira extensora'],
  bench:    ['Supino reto com barra','Supino inclinado com halter','Flexão de braços','Supino máquina'],
  deadlift: ['Levantamento terra','Terra romeno com halteres','Mesa flexora','Elevação de quadril'],
  row:      ['Remada curvada com barra','Remada unilateral com halter','Remada no cabo sentado','Remada na máquina'],
}

// Encontra o melhor 1RM estimado para um padrão de movimento nos logs
function getBestORM(logs, movementExercises, bodyWeight) {
  if (!logs?.length || !bodyWeight) return null
  let best = 0
  logs.forEach(log => {
    if (!log.sets_log) return
    log.sets_log.forEach(s => {
      if (!movementExercises.includes(s.exercise_name)) return
      const w = parseFloat(s.weight_kg) || 0
      const r = parseInt(s.reps_done) || 0
      if (w > 0 && r > 0) {
        const orm = w * (1 + r / 30)
        if (orm > best) best = orm
      }
    })
  })
  return best > 0 ? best : null
}

// Verifica critérios de progressão de nível
export function evaluateLevel(user, logs, plan) {
  const level        = plan?.level || 'beginner'
  const bodyWeight   = parseFloat(user?.peso) || 70
  const weeksTrained = Math.max(Math.floor((new Date() - new Date(user?.created_at)) / (1000 * 60 * 60 * 24 * 7)), 0)
  const daysPerWeek  = parseInt(user?.days_per_week) || 3
  const expected     = Math.max(weeksTrained, 1) * daysPerWeek
  const attendance   = Math.min(Math.round((logs.length / expected) * 100), 100)

  // critérios mínimos de tempo e presença por nível
  const timeReqs = { beginner: 12, basic: 32, intermediate: 104 }
  const minWeeks = timeReqs[level] || 12
  const meetsTime       = weeksTrained >= minWeeks
  const meetsAttendance = attendance >= 80

  // critérios de força relativa
  const thresholds = STRENGTH_THRESHOLDS[level]
  let meetsStrength = true
  const strengthDetails = {}

  if (thresholds) {
    Object.entries(thresholds).forEach(([movement, threshold]) => {
      const exercises = MOVEMENT_ALTERNATIVES[movement] || []
      const orm       = getBestORM(logs, exercises, bodyWeight)
      const relative  = orm ? orm / bodyWeight : 0
      const met       = relative >= threshold
      strengthDetails[movement] = {
        orm: orm ? Math.round(orm) : null,
        relative: relative.toFixed(2),
        threshold,
        met,
        label: { squat: 'Agachamento', bench: 'Supino', deadlift: 'Terra', row: 'Remada' }[movement],
      }
      if (!met) meetsStrength = false
    })
  }

  // critério de estagnação (progressão linear parou)
  const mainExercises = ['Agachamento livre','Leg press','Supino reto com barra','Levantamento terra','Terra romeno com halteres']
  const stagnantCount = mainExercises.filter(ex => analyzeProgression(logs, ex) === 'stagnant').length
  const meetsStagnation = level === 'beginner' ? logs.length >= 8 : stagnantCount >= 2

  // todos os critérios
  const allMet = meetsTime && meetsAttendance && meetsStrength && meetsStagnation

  const nextLevel = { beginner: 'basic', basic: 'intermediate', intermediate: 'advanced', advanced: 'advanced' }[level]

  return {
    currentLevel:      level,
    nextLevel,
    canPromote:        allMet && level !== 'advanced',
    criteria: {
      time:        { met: meetsTime,        value: `${weeksTrained} sem`, required: `${minWeeks} sem` },
      attendance:  { met: meetsAttendance,  value: `${attendance}%`,     required: '80%' },
      strength:    { met: meetsStrength,    details: strengthDetails },
      stagnation:  { met: meetsStagnation,  value: stagnantCount >= 2 ? 'Detectada' : 'Progredindo', required: 'Progressão estagnada' },
    },
    weeksTrained,
    attendance,
  }
}

// Gera o próximo mesociclo após o deload
export function generateNextMesocycle(user, evaluation) {
  const newLevel = evaluation.canPromote ? evaluation.nextLevel : evaluation.currentLevel
  const wasPromoted = newLevel !== evaluation.currentLevel

  // gera novo plano com nível atualizado
  const newPlan = generatePlan({
    primaryGoal:     user.primary_goal,
    experienceLevel: newLevel,
    daysPerWeek:     String(user.days_per_week || 3),
    injuries:        user.injuries || ['Nenhuma'],
    equipment:       user.equipment || [],
    location:        user.location || ['academia'],
  })

  return {
    ...newPlan,
    level:          newLevel,
    macrocycle:     (user.macrocycle || 1) + 1,
    wasPromoted,
    previousLevel:  evaluation.currentLevel,
    generatedAt:    new Date().toISOString(),
  }
}

// Detecta plateau e sugere exercício substituto
export function detectPlateauAndSuggest(logs, exercises) {
  if (!logs || logs.length < 3) return null

  const plateauExercises = exercises.filter(ex => {
    const status = analyzeProgression(logs, ex.name)
    return status === 'stagnant' || status === 'regressing'
  })

  if (!plateauExercises.length) return null

  const ex = plateauExercises[0]

  // sugere uma variação diferente do mesmo padrão
  const alternatives = MOVEMENT_ALTERNATIVES[ex.pattern] || []
  const current      = alternatives.indexOf(ex.name)
  const suggestion   = alternatives[current + 1] || alternatives[0]

  if (!suggestion || suggestion === ex.name) return null

  return {
    exerciseName: ex.name,
    suggestion,
    reason: analyzeProgression(logs, ex.name) === 'regressing'
      ? 'Queda de desempenho detectada — variação de estímulo pode ajudar.'
      : 'Carga estável por 2+ semanas — hora de variar o estímulo.',
  }
}

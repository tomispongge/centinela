// ════════════════════════════════════════════════════
// Cálculos de cumplimiento COMGES.
//
// AISLADO aquí a propósito: hoy las ponderaciones por eje están fijas, pero
// dejarlas en un solo módulo permite hacerlas configurables en la Fase 7
// (extensibilidad / COMGES 2027) sin tocar el JSX del Dashboard.
// Comportamiento idéntico al del HTML original (líneas 746–759).
// ════════════════════════════════════════════════════

// Peso del eje según su número en el código (ej: "COMGES 03" → 3).
// Ejes 1–4 → 20% c/u · Ejes 5–6 → 10% c/u · resto → 0.
export function axisWeight(code) {
  const n = parseInt(code?.match(/\d+/)?.[0]) || 0;
  if (n >= 1 && n <= 4) return 20;
  if (n >= 5 && n <= 6) return 10;
  return 0;
}

// Cumplimiento real: suma de los pesos de los ejes cuyo objetivo está 100% completo.
// `objectives` deben venir enriquecidos con { code, isComplete }.
export function realCompliance(objectives) {
  return objectives.reduce((acc, o) => acc + (o.isComplete ? axisWeight(o.code) : 0), 0);
}

// Cumplimiento global: promedio simple del % de avance de todos los objetivos.
// `objectives` deben venir enriquecidos con { progress }.
export function globalCompliance(objectives) {
  if (objectives.length === 0) return 0;
  return Math.round(objectives.reduce((s, o) => s + o.progress, 0) / objectives.length);
}

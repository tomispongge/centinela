// ════════════════════════════════════════════════════
// Constantes de UI y helpers de tono — portados del HTML original.
// ════════════════════════════════════════════════════

// Estilo base de las tarjetas glass-morphism.
export const CARD = {
  background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-lg)', backdropFilter: 'var(--blur-glass)',
  padding: 20, boxShadow: 'var(--shadow-md)',
};

// Tono según porcentaje de avance: >=75 ok, >=40 warn, resto risk.
export const getTone = p => p >= 75 ? 'ok' : p >= 40 ? 'warn' : 'risk';

export const TONE_COLOR = {
  ok: 'var(--success-500)', warn: 'var(--warning-500)', risk: 'var(--danger-500)',
};
export const TONE_GRAD = {
  ok: 'linear-gradient(90deg,#6EE7B7,#10B981)',
  warn: 'linear-gradient(90deg,#FCD77E,#F4B740)',
  risk: 'linear-gradient(90deg,#FCA5B8,#F2566F)',
};
export const TONE_STROKE = { ok: '#10B981', warn: '#F4B740', risk: '#F2566F' };
export const SEV_LABEL = { ok: 'Bajo', warn: 'Medio', risk: 'Crítico' };

// Formato de fecha localizado (es-CL). Devuelve '—' si no hay valor.
export const fmtDate = d => d ? new Date(d).toLocaleDateString('es-CL') : '—';

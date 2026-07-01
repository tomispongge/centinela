// ════════════════════════════════════════════════════
// Construye el prompt del informe a partir de los datos de la organización.
// Compartido y agnóstico del proveedor de IA.
//
// MINIMIZACIÓN DE PII: aquí NO entran nombres ni correos de personas
// (responsable, encargado, reported_by, owner). Solo datos institucionales,
// códigos, porcentajes, estados y fechas. La selección de columnas en el
// handler ya excluye esos campos; esto es la segunda barrera.
// ════════════════════════════════════════════════════

function axisWeight(code) {
  const n = parseInt((code || '').match(/\d+/)?.[0]) || 0;
  if (n >= 1 && n <= 4) return 20;
  if (n >= 5 && n <= 6) return 10;
  return 0;
}

const estadoObjetivo = p => (p >= 75 ? 'En meta' : p >= 40 ? 'En progreso' : 'Atrasado');

export function buildReportPrompt({ objectives, incidents, evidence, profile }) {
  const enriched = objectives.map(o => {
    const total = o.tasks?.length || 0;
    const done  = o.tasks?.filter(t => t.done).length || 0;
    const avance = total ? Math.round((done / total) * 100) : 0;
    return {
      codigo: o.code, nombre: o.name, plazo: o.plazo || null,
      avance_pct: avance, tareas: `${done}/${total}`,
      estado: estadoObjetivo(avance), completo: total > 0 && done === total,
    };
  });

  const globalPct = enriched.length
    ? Math.round(enriched.reduce((s, o) => s + o.avance_pct, 0) / enriched.length) : 0;
  const realPct = enriched.reduce((a, o) => a + (o.completo ? axisWeight(o.codigo) : 0), 0);

  const abiertos = incidents.filter(i => i.status !== 'Resuelto');
  const criticos = abiertos.filter(i => i.severity === 'risk');
  const evPorEstado = evidence.reduce((acc, e) => { acc[e.status] = (acc[e.status] || 0) + 1; return acc; }, {});

  const datos = {
    organismo: {
      nombre: profile.org_name || 'No especificado',
      tipo_oiv: profile.org_tipo_oiv || null,
      region: profile.org_region || null,
      ciudad: profile.org_ciudad || null,
      complejidad: profile.org_nivel_complejidad || null,
    },
    fecha_informe: new Date().toLocaleDateString('es-CL'),
    cumplimiento: {
      global_pct: globalPct,
      real_pct: realPct,
      nota: 'global = promedio del avance de tareas de todos los objetivos; real = ejes 1-4 valen 20% c/u y ejes 5-6 valen 10% c/u, sólo si el objetivo está 100% completo',
    },
    objetivos: enriched.map(({ completo, ...rest }) => rest),
    incidentes: {
      total: incidents.length, abiertos: abiertos.length, criticos: criticos.length,
      lista_abiertos: abiertos.slice(0, 10).map(i => ({
        titulo: i.title, severidad: i.sev_label, estado: i.status, fecha: i.incident_date,
      })),
    },
    evidencias: { total: evidence.length, por_estado: evPorEstado },
  };

  return [
    'Eres un analista de cumplimiento en ciberseguridad para el sector salud / público de Chile (marco COMGES / ANCI).',
    'Redacta un INFORME DE AVANCES profesional en español, en Markdown, basándote ÚNICAMENTE en los datos entregados. No inventes cifras ni hechos.',
    '',
    'FORMATO (respétalo para que todos los informes sean consistentes):',
    '- Comienza EXACTAMENTE con este título nivel 1: "# Informe de Avances — Cumplimiento COMGES / ANCI"',
    '- Debajo, una línea con: organismo, tipo de OIV, región/ciudad y fecha del informe.',
    '- Luego las 6 secciones numeradas de abajo, en ese orden.',
    '- Escribe el informe COMPLETO hasta las recomendaciones. No lo cortes ni lo dejes a medias.',
    '',
    'Secciones:',
    '1. **Resumen ejecutivo** (3-5 frases con lo más relevante).',
    '2. **Cumplimiento global y real**. Explica ambos con precisión y SIN dramatizar: el "real" solo cuenta objetivos cerrados al 100%, por eso puede ser 0% aunque el avance global sea alto. Deja claro que un avance global alto refleja progreso sustantivo aunque aún no se cierre ningún eje. No lo llames "crítico" si el global es razonable.',
    '3. **Avance por objetivo**: preséntalo como una TABLA con columnas: Código | Nombre | Avance % | Tareas | Estado. Luego destaca en 1-2 frases los atrasados y los que están en meta.',
    '4. **Incidentes de seguridad** (situación general; alerta explícita SOLO si hay incidentes críticos abiertos).',
    '5. **Estado de la evidencia documental** (según los estados por documento).',
    '6. **Recomendaciones** (3-5 acciones concretas y priorizadas según los datos).',
    '',
    'Tono: formal, claro, objetivo y orientado a la acción (ni alarmista ni complaciente). No incluyas datos personales de individuos.',
    '',
    'DATOS:',
    JSON.stringify(datos, null, 2),
  ].join('\n');
}

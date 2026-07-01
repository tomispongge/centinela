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
  const hoy = new Date();
  const diasHasta = (fecha) => (fecha ? Math.ceil((new Date(fecha) - hoy) / 86400000) : null);

  const enriched = objectives.map(o => {
    const total = o.tasks?.length || 0;
    const done  = o.tasks?.filter(t => t.done).length || 0;
    const avance = total ? Math.round((done / total) * 100) : 0;
    return {
      codigo: o.code, nombre: o.name, plazo: o.plazo || null,
      dias_para_plazo: diasHasta(o.plazo),
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
    'Actúas como el/la CISO de una institución de salud chilena (marco COMGES / ANCI) y redactas un INFORME EJECUTIVO dirigido a la DIRECCIÓN del hospital (audiencia ejecutiva, no técnica). En Markdown, en español.',
    'Objetivo del informe: que la Dirección entienda el estado, el RIESGO para la institución, si se llegará al plazo, y qué decisiones o apoyo se necesitan de ella.',
    '',
    'REGLAS DE HONESTIDAD (críticas):',
    '- Básate SOLO en los datos entregados. No inventes cifras ni hechos.',
    '- Los datos NO incluyen nivel de riesgo por objetivo ni si un incidente afectó datos de pacientes. Cuando priorices por riesgo o infieras consecuencias, decláralo como criterio de análisis a validar ("estimación, a confirmar por el CISO"), NO como dato.',
    '- NO afirmes que la institución "cumple" la ley. Habla de obligaciones y exposición, aclarando que es orientación general y debe verificarse con un especialista.',
    '',
    'FORMATO (respétalo para consistencia):',
    '- Título nivel 1 EXACTO: "# Informe Ejecutivo de Ciberseguridad — Cumplimiento COMGES / ANCI"',
    '- Debajo, una línea con: organismo, tipo de OIV, región/ciudad y fecha.',
    '- Luego las secciones en este orden. Escribe el informe COMPLETO; no lo cortes.',
    '',
    'Secciones:',
    '1. **Resumen para la Dirección** (4-6 frases): estado general, el principal riesgo hoy, si el ritmo alcanza para el plazo, y qué se solicita a la Dirección. Directo, sin jerga técnica.',
    '2. **Estado de cumplimiento**: explica el avance global y el "real" con sobriedad (el real solo cuenta objetivos 100% cerrados; puede ser 0% con avance global alto — no lo llames crítico si el global es razonable).',
    '3. **¿Llegamos al plazo?**: usa "dias_para_plazo" de cada objetivo. Indica EXPLÍCITAMENTE si el ritmo actual es suficiente e identifica los objetivos en riesgo de NO cumplir su plazo. Honesto y claro.',
    '4. **Riesgos priorizados**: ordena los objetivos con menor avance por RIESGO para un hospital (continuidad clínica, protección de datos de pacientes, control de accesos), NO solo por porcentaje. Para los 2-3 principales, explica la consecuencia concreta de la brecha. Marca esta priorización como criterio de análisis a validar.',
    '5. **Contexto regulatorio** (orientativo, a verificar; no es asesoría legal): un hospital puede calificar como Operador de Importancia Vital (OIV) bajo la Ley 21.663, con deberes ante la ANCI (registro, delegado de ciberseguridad, gestión y reporte de incidentes). Además la Ley 21.719 de protección de datos entra en plena vigencia el 01-12-2026, con una Agencia que puede fiscalizar y sancionar. Explica la exposición si el cumplimiento no está a tiempo, SIN afirmar incumplimiento.',
    '6. **Incidentes**: situación general. Si hubo incidentes, advierte que —de haber involucrado datos de pacientes— podrían gatillar deberes de notificación (a verificar por el CISO; el dato no lo especifica).',
    '7. **Avance por objetivo (detalle)**: TABLA con columnas Código | Nombre | Avance % | Tareas | Estado | Días para plazo.',
    '8. **Recomendaciones y decisiones solicitadas** (3-5, priorizadas). Cada una con: acción concreta, rol responsable sugerido (sin nombres), qué se solicita a la Dirección (recursos/decisión), y consecuencia de no actuar.',
    '',
    'Cierra con una nota breve en cursiva: "Informe generado con apoyo de IA a partir de los datos del sistema; debe ser validado por el CISO antes de su presentación."',
    '',
    'Tono: ejecutivo, formal, honesto, orientado a la decisión. Ni alarmista ni complaciente. No incluyas datos personales de individuos.',
    '',
    'DATOS:',
    JSON.stringify(datos, null, 2),
  ].join('\n');
}

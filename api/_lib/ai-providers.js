// ════════════════════════════════════════════════════
// Enchufe de proveedor de IA (provider seam).
//
// El resto de la app NO sabe qué IA se usa. Aquí se elige por la variable de
// entorno AI_PROVIDER, y cada proveedor es un adaptador pequeño: recibe un
// prompt (texto) y devuelve texto. La lógica del informe es compartida.
//
// Para cambiar o agregar un proveedor, ver docs/CAMBIAR-PROVEEDOR-IA.md.
// ════════════════════════════════════════════════════

export async function callAI(prompt) {
  const provider = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  switch (provider) {
    case 'gemini': return callGemini(prompt);
    // case 'openai': return callOpenAI(prompt);   // ← ver plantilla abajo
    // case 'claude': return callClaude(prompt);   // ← ver plantilla abajo
    default:
      throw new Error(`Proveedor de IA no soportado: "${provider}". Revisa AI_PROVIDER.`);
  }
}

// ─── Gemini (Google AI Studio) ──────────────────────
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Falta la variable de entorno GEMINI_API_KEY.');

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
        // gemini-2.5-flash "piensa" y ese razonamiento consume tokens de salida,
        // lo que cortaba el informe. Para un informe no hace falta: lo desactivamos
        // (informe completo, más rápido y más barato). Si el modelo no soporta
        // thinking, este campo se ignora sin error.
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`Gemini respondió ${resp.status}: ${detail}`);
  }

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
  if (!text) throw new Error('Gemini devolvió una respuesta vacía.');
  return text;
}

// ─── PLANTILLAS para agregar otros proveedores ──────
// Descomenta, completa, y agrega su `case` arriba. Cada key va como variable de
// entorno en Vercel SIN el prefijo VITE_ (así nunca llega al navegador).
//
// async function callOpenAI(prompt) {
//   const apiKey = process.env.OPENAI_API_KEY;
//   if (!apiKey) throw new Error('Falta OPENAI_API_KEY.');
//   const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
//   const resp = await fetch('https://api.openai.com/v1/chat/completions', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
//     body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.4 }),
//   });
//   if (!resp.ok) throw new Error(`OpenAI ${resp.status}: ${await resp.text()}`);
//   const data = await resp.json();
//   return data?.choices?.[0]?.message?.content || '';
// }
//
// async function callClaude(prompt) {
//   const apiKey = process.env.ANTHROPIC_API_KEY;
//   if (!apiKey) throw new Error('Falta ANTHROPIC_API_KEY.');
//   const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';
//   const resp = await fetch('https://api.anthropic.com/v1/messages', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
//     body: JSON.stringify({ model, max_tokens: 2048, messages: [{ role: 'user', content: prompt }] }),
//   });
//   if (!resp.ok) throw new Error(`Claude ${resp.status}: ${await resp.text()}`);
//   const data = await resp.json();
//   return data?.content?.[0]?.text || '';
// }

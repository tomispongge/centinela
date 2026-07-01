# Cómo cambiar o agregar el proveedor de IA

Los informes se generan en el servidor (`api/generate-report.js`), que llama a la IA a través de un **adaptador intercambiable**. Cambiar de proveedor **no toca la app ni la lógica del informe** — solo el adaptador y una variable de entorno.

```
Navegador → /api/generate-report → api/_lib/ai-providers.js → [ Gemini | OpenAI | Claude | … ]
             (junta datos, RLS)      (el enchufe)               (adaptador elegido)
```

## Regla de oro de seguridad

> La API key del proveedor va en **Vercel → Environment Variables**, **SIN** el prefijo `VITE_`.
> El prefijo `VITE_` expone la variable al navegador. La key de la IA **nunca** debe ir con ese prefijo: solo la lee la función del servidor.

---

## Cambiar a un proveedor que ya tiene plantilla (OpenAI o Claude)

En `api/_lib/ai-providers.js` ya hay plantillas comentadas. Para activar, por ejemplo, **OpenAI**:

1. **Descomenta** la función `callOpenAI(...)` al final del archivo.
2. **Descomenta** su línea en el `switch`:
   ```js
   case 'openai': return callOpenAI(prompt);
   ```
3. En **Vercel → Settings → Environment Variables** (Production + Preview), agrega:
   - `AI_PROVIDER` = `openai`
   - `OPENAI_API_KEY` = *(tu key)*  ← sin prefijo `VITE_`
   - (opcional) `OPENAI_MODEL` = `gpt-4o-mini`
4. **Redeploy** (push a la rama, o Vercel → Deployments → Redeploy).

Para **Claude** es igual, usando `AI_PROVIDER=claude` y `ANTHROPIC_API_KEY`.

---

## Agregar un proveedor nuevo (desde cero)

1. En `api/_lib/ai-providers.js`, escribe un adaptador siguiendo el patrón de `callGemini`:
   ```js
   async function callMiProveedor(prompt) {
     const apiKey = process.env.MIPROVEEDOR_API_KEY;
     if (!apiKey) throw new Error('Falta MIPROVEEDOR_API_KEY.');
     const resp = await fetch('https://api.miproveedor.com/…', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
       body: JSON.stringify({ /* formato del proveedor */ }),
     });
     if (!resp.ok) throw new Error(`MiProveedor ${resp.status}: ${await resp.text()}`);
     const data = await resp.json();
     return /* extraer el texto de la respuesta */;
   }
   ```
   La función **recibe un prompt (string) y devuelve un string** con el informe en Markdown. Nada más.

2. Agrega su `case` en el `switch` de `callAI`:
   ```js
   case 'miproveedor': return callMiProveedor(prompt);
   ```

3. En Vercel, setea `AI_PROVIDER=miproveedor` y `MIPROVEEDOR_API_KEY` (sin `VITE_`).

4. Redeploy.

---

## Cambiar solo el modelo (mismo proveedor)

Para Gemini, sin tocar código: en Vercel agrega/edita `GEMINI_MODEL` (ej. `gemini-2.0-flash`, `gemini-2.5-flash`, o el que te habilite tu institución) y redeploy.

---

## Qué NO cambia al cambiar de proveedor

- La app (el navegador siempre llama a `/api/generate-report`).
- La lógica del informe y la minimización de PII (`api/_lib/report-prompt.js`).
- El prompt (es texto plano, portable entre proveedores).

Solo cambia el adaptador y las variables de entorno.

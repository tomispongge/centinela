import { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateReport, getCachedReport, setCachedReport } from '../services/reports';
import { CARD } from '../lib/constants';
import Icon from '../components/common/Icon';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

// Estilos claros (para papel / Word) aplicados al HTML del informe al exportar.
const DOC_STYLES = `
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; line-height: 1.6; margin: 32px; }
  h1 { font-size: 20px; border-bottom: 2px solid #2A6FDB; padding-bottom: 6px; }
  h2 { font-size: 16px; margin-top: 20px; color: #0E2150; }
  h3 { font-size: 14px; margin-top: 14px; }
  p { margin: 8px 0; }
  ul, ol { margin: 8px 0 8px 22px; }
  li { margin: 4px 0; }
  strong { color: #000; }
  em { color: #555; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 12px; }
  th, td { border: 1px solid #999; padding: 6px 9px; text-align: left; }
  th { background: #eef2fb; }
`;

const fileStamp = () => new Date().toISOString().slice(0, 10);

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// ════════════════════════════════════════════════════
// ReportsScreen — genera un informe con IA (Gemini vía /api).
// No lo muestra en pantalla por defecto: el usuario elige "Ver en pantalla"
// o "Exportar" (.md / PDF / Word). El informe se mantiene renderizado (oculto)
// para poder exportarlo sin volver a generarlo.
// ════════════════════════════════════════════════════
export default function ReportsScreen() {
  const [loading, setLoading] = useState(false);
  const [report, setReport]   = useState(() => getCachedReport()); // restaura el informe al volver
  const [error, setError]     = useState('');
  const [shown, setShown]     = useState(false);
  const reportRef = useRef(null);

  const handleGenerate = async () => {
    setLoading(true); setError(''); setShown(false);
    try {
      const { report } = await generateReport();
      setReport(report);
      setCachedReport(report); // persiste hasta cerrar sesión
    } catch (e) {
      setError(e.message || 'No se pudo generar el informe.');
    } finally {
      setLoading(false);
    }
  };

  const exportMD = () => {
    downloadBlob(new Blob([report], { type: 'text/markdown;charset=utf-8' }), `informe-comges-${fileStamp()}.md`);
  };

  const exportPDF = () => {
    const html = reportRef.current?.innerHTML || '';
    const win = window.open('', '_blank');
    if (!win) { alert('Permite las ventanas emergentes para exportar a PDF.'); return; }
    win.document.write(
      `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Informe COMGES</title>` +
      `<style>${DOC_STYLES}</style></head><body>${html}` +
      `<script>window.onload=function(){window.print();}<\/script></body></html>`
    );
    win.document.close();
  };

  const exportDOCX = () => {
    // Word respeta el atributo border= mejor que el CSS, así la tabla sale con líneas.
    const html = (reportRef.current?.innerHTML || '')
      .replace(/<table/g, '<table border="1" cellspacing="0" cellpadding="6"');
    const doc =
      `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>` +
      `<head><meta charset="utf-8"><title>Informe COMGES</title><style>${DOC_STYLES}</style></head>` +
      `<body>${html}</body></html>`;
    // BOM + MIME de Word: se abre en Word conservando el formato; se re-guarda como .docx.
    downloadBlob(new Blob(['﻿', doc], { type: 'application/msword' }), `informe-comges-${fileStamp()}.doc`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
      {/* Encabezado + generar */}
      <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--text-strong)' }}>
            Informe de avances con IA
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            Genera un informe ejecutivo del estado de cumplimiento COMGES a partir de tus datos actuales.
            Luego decide si verlo en pantalla o solo exportarlo.
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generando…' : <><Icon name="file-text" size={15} /> {report ? 'Generar de nuevo' : 'Generar informe'}</>}
        </Button>
      </div>

      {error && (
        <div style={{ ...CARD, background: 'rgba(242,86,111,.12)', border: '1px solid rgba(252,165,184,.34)',
          color: 'var(--danger-300)', fontSize: 13.5 }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={CARD}>
          <Spinner />
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: -12 }}>
            La IA está analizando tus datos y redactando el informe…
          </p>
        </div>
      )}

      {report && !loading && (
        <div style={CARD}>
          {/* Barra de acciones: Ver / Exportar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--success-300)' }}>
              <Icon name="check" size={15} /> Informe listo
            </span>
            <div style={{ flex: 1 }} />
            <Button size="sm" variant={shown ? 'primary' : 'ghost'} onClick={() => setShown(s => !s)}>
              <Icon name="eye" size={14} /> {shown ? 'Ocultar' : 'Ver en pantalla'}
            </Button>
            <span style={{ fontSize: 12, color: 'var(--text-faint)', marginLeft: 4 }}>Exportar:</span>
            <Button size="sm" variant="ghost" onClick={exportMD}>.md</Button>
            <Button size="sm" variant="ghost" onClick={exportPDF}>PDF</Button>
            <Button size="sm" variant="ghost" onClick={exportDOCX}>Word</Button>
          </div>

          {/* El informe se renderiza siempre (para poder exportarlo), pero solo se
              muestra si el usuario eligió "Ver en pantalla". */}
          <div
            ref={reportRef}
            className="report-md"
            style={{ display: shown ? 'block' : 'none', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
          </div>
        </div>
      )}

      {!report && !loading && !error && (
        <div style={CARD}>
          <EmptyState icon="file-text" msg="Aún no has generado un informe. Presiona «Generar informe» para crearlo con IA." />
        </div>
      )}
    </div>
  );
}

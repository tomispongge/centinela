import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { generateReport } from '../services/reports';
import { CARD } from '../lib/constants';
import Icon from '../components/common/Icon';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';

// ════════════════════════════════════════════════════
// ReportsScreen — genera un informe de avances con IA (Gemini vía /api).
// Los datos y la key viven en el servidor; aquí solo se dispara y se muestra.
// ════════════════════════════════════════════════════
export default function ReportsScreen() {
  const [loading, setLoading] = useState(false);
  const [report, setReport]   = useState(null);
  const [error, setError]     = useState('');
  const [copied, setCopied]   = useState(false);

  const handleGenerate = async () => {
    setLoading(true); setError(''); setCopied(false);
    try {
      const { report } = await generateReport();
      setReport(report);
    } catch (e) {
      setError(e.message || 'No se pudo generar el informe.');
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    try { navigator.clipboard.writeText(report); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch (e) {}
  };

  const download = () => {
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `informe-comges-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
      {/* Encabezado + acción */}
      <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: 16, color: 'var(--text-strong)' }}>
            Informe de avances con IA
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            Genera un informe narrado del estado de cumplimiento COMGES a partir de tus datos actuales
            (objetivos, avance, incidentes y evidencias).
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={loading}>
          {loading ? 'Generando…' : <><Icon name="file-text" size={15} /> Generar informe</>}
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 14 }}>
            <Button size="sm" variant={copied ? 'success' : 'ghost'} onClick={copy}>
              {copied ? <><Icon name="check" size={14} /> Copiado</> : <><Icon name="copy" size={14} /> Copiar</>}
            </Button>
            <Button size="sm" variant="ghost" onClick={download}>
              <Icon name="file-check-2" size={14} /> Descargar .md
            </Button>
          </div>
          <div className="report-md">
            <ReactMarkdown>{report}</ReactMarkdown>
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

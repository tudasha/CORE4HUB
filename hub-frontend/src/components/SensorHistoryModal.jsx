import { useCallback } from 'react';
import { X, Download, TrendingUp } from 'lucide-react';

const W = 560, H = 130, PL = 42, PR = 16, PT = 10, PB = 22;

function LineChart({ data, field, label, color, unit }) {
  // only points that have a real value for this field
  const validPts = data.filter(p => p[field] != null);

  if (validPts.length < 2) {
    return (
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          {label}
        </div>
        <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 10 }}>
          Waiting for data…
        </div>
      </div>
    );
  }

  const vals = validPts.map(p => Number(p[field]));
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;

  const innerW = W - PL - PR;
  const innerH = H - PT - PB;

  // Map each valid point to x,y in SVG space
  const coords = validPts.map((p, i) => {
    const v = Number(p[field]);
    const x = PL + (i / (validPts.length - 1)) * innerW;
    const y = PT + (1 - (v - minV) / range) * innerH;
    return { x, y, val: v, ts: p.ts };
  });

  const linePoints = coords.map(c => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaPoints = `${PL},${PT + innerH} ${linePoints} ${coords[coords.length - 1].x.toFixed(1)},${PT + innerH}`;

  const lastC = coords[coords.length - 1];
  const gradId = `sg-${field}`;

  const fmt = ts => new Date(ts).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y-axis grid + labels */}
        {[0, 0.5, 1].map(t => {
          const y = PT + (1 - t) * innerH;
          const v = (minV + t * range).toFixed(1);
          return (
            <g key={t}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 3" />
              <text x={PL - 4} y={y + 3} fontSize="9" fill="rgba(255,255,255,0.3)" textAnchor="end">{v}</text>
            </g>
          );
        })}

        {/* Area fill */}
        <polygon points={areaPoints} fill={`url(#${gradId})`} />

        {/* Line */}
        <polyline points={linePoints} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Last value dot + label */}
        <circle cx={lastC.x} cy={lastC.y} r="5" fill={color} />
        <rect x={lastC.x + 8} y={lastC.y - 10} width={52} height={16} rx="4" fill="rgba(0,0,0,0.55)" />
        <text x={lastC.x + 34} y={lastC.y + 3} fontSize="10" fill={color} fontWeight="700" textAnchor="middle">
          {lastC.val.toFixed(1)}{unit}
        </text>

        {/* Time axis labels */}
        <text x={PL} y={H - 4} fontSize="9" fill="rgba(255,255,255,0.28)">{fmt(validPts[0].ts)}</text>
        <text x={W - PR} y={H - 4} fontSize="9" fill="rgba(255,255,255,0.28)" textAnchor="end">{fmt(validPts[validPts.length - 1].ts)}</text>
      </svg>
    </div>
  );
}

// -------- Modal --------
const CHARTS = [
  { field: 'temperature',  label: 'Temperature',  color: '#f59e0b', unit: '°C'   },
  { field: 'humidity',     label: 'Humidity',      color: '#06b6d4', unit: '%'    },
  { field: 'pressure',     label: 'Pressure',      color: '#8b5cf6', unit: ' hPa' },
  { field: 'lightLevel',   label: 'Light Level',   color: '#eab308', unit: ' lx'  },
  { field: 'electricFlow', label: 'Electric Flow', color: '#10b981', unit: ' A'   },
];

export default function SensorHistoryModal({ history = [], onClose }) {
  const downloadPDF = useCallback(() => {
    const now = new Date().toLocaleString('ro-RO');
    const rows = history.map(p =>
      `<tr>
        <td>${new Date(p.ts).toLocaleTimeString('ro-RO')}</td>
        <td>${p.temperature ?? '-'}</td>
        <td>${p.humidity ?? '-'}</td>
        <td>${p.pressure ?? '-'}</td>
        <td>${p.altitude ?? '-'}</td>
        <td>${p.lightLevel ?? '-'}</td>
        <td>${p.electricFlow ?? '-'}</td>
      </tr>`
    ).join('');

    const html = `<!DOCTYPE html>
<html lang="ro"><head><meta charset="UTF-8"/>
<title>SmartHub Sensor Report – ${now}</title>
<style>
  body{font-family:Segoe UI,Arial,sans-serif;background:#fff;color:#111;padding:32px}
  h1{font-size:20px;margin-bottom:4px}
  .sub{font-size:11px;color:#666;margin-bottom:20px}
  table{width:100%;border-collapse:collapse;font-size:11px}
  th{background:#1a1a2e;color:#fff;padding:7px 10px;text-align:left}
  td{padding:5px 10px;border-bottom:1px solid #e5e7eb}
  tr:nth-child(even) td{background:#f9fafb}
  @media print{body{padding:12px}}
</style></head><body>
<h1>🏠 SmartHub – Sensor History Report</h1>
<div class="sub">Generated: ${now} &nbsp;|&nbsp; Window: last 10 min &nbsp;|&nbsp; ${history.length} samples</div>
<table><thead><tr>
  <th>Time</th><th>Temp (°C)</th><th>Humidity (%)</th><th>Pressure (hPa)</th>
  <th>Altitude (m)</th><th>Light (lx)</th><th>Electric (A)</th>
</tr></thead><tbody>${rows}</tbody></table>
</body></html>`;

    try {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 500);
      }
    } catch (e) {
      console.error('PDF export error:', e);
    }
  }, [history]);

  const activeCharts = CHARTS.filter(c => history.some(p => p[c.field] != null));

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 700, maxHeight: '92vh',
        background: '#13141f',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 20,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: 10, padding: 8, display: 'flex' }}>
            <TrendingUp size={20} color="#6366f1" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>Live Sensor History</div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              Rolling 10-min window &nbsp;·&nbsp; {history.length} samples recorded
            </div>
          </div>
          <button
            onClick={downloadPDF}
            disabled={history.length < 1}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: history.length < 1 ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 10, padding: '8px 14px',
              cursor: history.length < 1 ? 'not-allowed' : 'pointer',
              color: history.length < 1 ? 'rgba(255,255,255,0.3)' : '#6366f1',
              fontSize: '0.8rem', fontWeight: 600,
            }}
          >
            <Download size={14} /> Download PDF
          </button>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable charts area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {history.length < 2 ? (
            <div style={{ textAlign: 'center', padding: '56px 0', color: 'rgba(255,255,255,0.3)' }}>
              <TrendingUp size={44} style={{ opacity: 0.15, marginBottom: 14, display: 'block', margin: '0 auto 14px' }} />
              <div style={{ fontSize: '0.9rem', marginBottom: 6 }}>Waiting for live Arduino data…</div>
              <div style={{ fontSize: '0.75rem' }}>Charts will appear as sensor readings arrive via WebSocket.</div>
            </div>
          ) : activeCharts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>
              No Arduino sensor fields detected in history.
            </div>
          ) : (
            activeCharts.map(c => (
              <LineChart key={c.field} data={history} {...c} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

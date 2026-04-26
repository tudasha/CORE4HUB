import { useRef, useCallback } from 'react';
import { X, Download, TrendingUp } from 'lucide-react';

// ------- tiny SVG line chart -------
function LineChart({ data, field, label, color, unit }) {
  const W = 520, H = 120, PAD = 32;

  const vals = data.map(p => p[field]).filter(v => v != null);
  if (vals.length < 2) {
    return (
      <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        Not enough data yet…
      </div>
    );
  }

  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;

  const points = data
    .map((p, i) => {
      if (p[field] == null) return null;
      const x = PAD + ((data.length <= 1 ? 0 : i / (data.length - 1)) * (W - PAD * 2));
      const y = H - PAD - ((p[field] - min) / range) * (H - PAD * 2);
      return `${x},${y}`;
    })
    .filter(Boolean)
    .join(' ');

  // x-axis time labels (first and last)
  const fmt = ts => new Date(ts).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const firstTs = data[0]?.ts;
  const lastTs  = data[data.length - 1]?.ts;

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
        {label}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, overflow: 'visible' }}>
        {/* grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = H - PAD - t * (H - PAD * 2);
          const val = (min + t * range).toFixed(1);
          return (
            <g key={t}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <text x={PAD - 4} y={y + 4} fontSize="9" fill="rgba(255,255,255,0.35)" textAnchor="end">{val}</text>
            </g>
          );
        })}
        {/* gradient fill */}
        <defs>
          <linearGradient id={`grad-${field}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* area fill */}
        <polyline
          points={`${PAD},${H - PAD} ${points} ${W - PAD},${H - PAD}`}
          fill={`url(#grad-${field})`}
          stroke="none"
        />
        {/* line */}
        <polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* current value dot */}
        {(() => {
          const last = points.split(' ').pop();
          if (!last) return null;
          const [lx, ly] = last.split(',');
          return (
            <>
              <circle cx={lx} cy={ly} r="5" fill={color} />
              <text x={+lx + 8} y={+ly + 4} fontSize="11" fill={color} fontWeight="700">
                {vals[vals.length - 1]?.toFixed(1)}{unit}
              </text>
            </>
          );
        })()}
        {/* time labels */}
        {firstTs && <text x={PAD} y={H - 4} fontSize="9" fill="rgba(255,255,255,0.3)">{fmt(firstTs)}</text>}
        {lastTs  && <text x={W - PAD} y={H - 4} fontSize="9" fill="rgba(255,255,255,0.3)" textAnchor="end">{fmt(lastTs)}</text>}
      </svg>
    </div>
  );
}

// ------- Modal -------
export default function SensorHistoryModal({ history, onClose }) {
  const printRef = useRef(null);

  const downloadPDF = useCallback(() => {
    const now = new Date().toLocaleString('ro-RO');
    const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8"/>
  <title>SmartHub Sensor Report – ${now}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; padding: 32px; }
    h1 { font-size: 22px; margin-bottom: 4px; color: #1a1a2e; }
    .sub { font-size: 12px; color: #555; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 16px; }
    th { background: #1a1a2e; color: #fff; padding: 8px 10px; text-align: left; }
    td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) td { background: #f9fafb; }
    @media print { body { padding: 16px; } }
  </style>
</head>
<body>
  <h1>🏠 SmartHub – Sensor History Report</h1>
  <div class="sub">Generated: ${now} &nbsp;|&nbsp; Window: last 10 minutes &nbsp;|&nbsp; ${history.length} samples</div>
  <table>
    <thead>
      <tr>
        <th>Time</th>
        <th>Temp (°C)</th>
        <th>Humidity (%)</th>
        <th>Pressure (hPa)</th>
        <th>Altitude (m)</th>
        <th>Light (lux)</th>
        <th>Electric (A)</th>
      </tr>
    </thead>
    <tbody>
      ${history.map(p => `
        <tr>
          <td>${new Date(p.ts).toLocaleTimeString('ro-RO')}</td>
          <td>${p.temperature ?? '-'}</td>
          <td>${p.humidity ?? '-'}</td>
          <td>${p.pressure ?? '-'}</td>
          <td>${p.altitude ?? '-'}</td>
          <td>${p.lightLevel ?? '-'}</td>
          <td>${p.electricFlow ?? '-'}</td>
        </tr>`).join('')}
    </tbody>
  </table>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }, [history]);

  const CHARTS = [
    { field: 'temperature', label: 'Temperature',   color: '#f59e0b', unit: '°C'  },
    { field: 'humidity',    label: 'Humidity',       color: '#06b6d4', unit: '%'   },
    { field: 'pressure',    label: 'Pressure',       color: '#8b5cf6', unit: ' hPa'},
    { field: 'lightLevel',  label: 'Light Level',    color: '#eab308', unit: ' lux'},
    { field: 'electricFlow',label: 'Electric Flow',  color: '#10b981', unit: ' A'  },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={printRef} style={{
        width: '100%', maxWidth: 680, maxHeight: '92vh',
        background: 'var(--surface-glass, #13131f)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: 10, padding: 8, display: 'flex' }}>
            <TrendingUp size={20} color="var(--accent-primary, #6366f1)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary, #fff)' }}>Live Sensor History</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #888)', marginTop: 2 }}>
              Rolling 10-min window &nbsp;·&nbsp; {history.length} samples
            </div>
          </div>
          <button
            onClick={downloadPDF}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 10, padding: '8px 14px', cursor: 'pointer',
              color: 'var(--accent-primary, #6366f1)', fontSize: '0.8rem', fontWeight: 600,
            }}
          >
            <Download size={14} /> Download PDF
          </button>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted, #888)', padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Chart area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {history.length < 2 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted, #888)', fontSize: '0.875rem' }}>
              <TrendingUp size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
              <br />Waiting for live data from Arduino…
              <br /><span style={{ fontSize: '0.75rem' }}>Charts will appear as sensor readings arrive.</span>
            </div>
          ) : (
            CHARTS.filter(c => history.some(p => p[c.field] != null)).map(c => (
              <LineChart key={c.field} data={history} {...c} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

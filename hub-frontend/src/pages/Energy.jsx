import { useState, useEffect } from 'react';
import { mockEnergy } from '../utils/mockData';
import { Zap, Sun, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useDevices } from '../context/DevicesContext';
function MiniBarChart({ data, color, height = 70 }) {
  const max = Math.max(...data.map(d => d.consumption));
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:2, height, position:'relative' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative', group:true }}>
          <div
            style={{
              width:'100%',
              borderRadius:'3px 3px 0 0',
              background: d.consumption > max * 0.8
                ? `linear-gradient(to top, var(--accent-rose), var(--accent-amber))`
                : `linear-gradient(to top, ${color}, ${color}88)`,
              height: `${(d.consumption / max) * (height - 12)}px`,
              minHeight: 2,
              transition: 'height 0.8s ease',
              cursor: 'pointer',
            }}
            title={`${d.hour}: ${d.consumption}kWh — ${d.price} RON/kWh`}
          />
        </div>
      ))}
    </div>
  );
}

export default function Energy({ sensorData }) {
  const [energy, setEnergy] = useState(mockEnergy());
  const { devices } = useDevices();

  useEffect(() => {
    const interval = setInterval(() => setEnergy(mockEnergy()), 15000);
    return () => clearInterval(interval);
  }, []);

  const sd = sensorData || {};
  const solarOutput = sd.solarOutput ?? energy.solarProduced;

  return (
    <div className="fade-in" style={{ maxWidth: 1400 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="section-title">Energy Dashboard</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginTop:4 }}>
          Live power flow, cost analysis & solar prediction
        </p>
      </div>

      {/* Top Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom:16 }}>
        {[
          { label:'Today\'s Usage', value: energy.totalTodayKwh, unit:'kWh', color:'#eab308', icon: Zap },
          { label:'Today\'s Cost',  value: `${energy.totalTodayCost}`, unit:'RON', color:'var(--accent-rose)', icon: TrendingUp },
          { label:'Solar Output',   value: solarOutput, unit:'kW', color:'var(--accent-emerald)', icon: Sun },
          { label:'Current Price',  value: energy.priceNow, unit:'RON/kWh', color:'var(--accent-teal)', icon: TrendingDown },
        ].map(({ label, value, unit, color, icon: Icon }) => (
          <div key={label} className="glass-card p-5 stat-card" style={{ '--accent-primary': color }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div style={{ background:`${color}22`, borderRadius:10, padding:8, display:'flex' }}><Icon size={18} color={color}/></div>
            </div>
            <div className="metric-value" style={{ color }}>{value}<span style={{ fontSize:'1rem', fontWeight:500, opacity:0.7 }}> {unit}</span></div>
            <div className="metric-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Hourly Chart + Price Forecast */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
        <div className="glass-card p-5">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <span style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)' }}>⚡ Hourly Consumption (kWh)</span>
            <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Red = peak usage</span>
          </div>
          <MiniBarChart data={energy.hourly} color="var(--accent-amber)" height={100}/>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
            {['00','04','08','12','16','20'].map(h => (
              <span key={h} style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>{h}:00</span>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <div style={{ marginBottom:14 }}>
            <span style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)' }}>📈 Price Forecast</span>
          </div>
          <div style={{ padding:'14px', borderRadius:12, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)', marginBottom:14 }}>
            <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
              <AlertTriangle size={16} color="var(--accent-amber)" style={{ flexShrink:0, marginTop:2 }}/>
              <p style={{ fontSize:'0.825rem', color:'var(--text-primary)', lineHeight:1.6 }}>{energy.priceForecast}</p>
            </div>
          </div>
          <div style={{ padding:'14px', borderRadius:12, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
              <Sun size={16} color="var(--accent-emerald)" style={{ flexShrink:0, marginTop:2 }}/>
              <p style={{ fontSize:'0.825rem', color:'var(--text-primary)', lineHeight:1.6 }}>{energy.solarForecast}</p>
            </div>
          </div>

          <div className="divider" style={{ margin:'16px 0' }}/>
          <div style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)', marginBottom:12 }}>☀️ Solar Panel</div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ fontFamily:'Space Grotesk', fontSize:'2rem', fontWeight:700, color:'var(--accent-emerald)' }}>{solarOutput}<span style={{ fontSize:'1rem' }}> kW</span></div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Currently producing</div>
            </div>
            <div>
              <div style={{ fontFamily:'Space Grotesk', fontSize:'2rem', fontWeight:700, color:'#eab308' }}>{energy.uvIndex ?? sd.uvIndex ?? '--'}</div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>UV Index</div>
            </div>
          </div>
        </div>
      </div>

      {/* Devices */}
      <div className="glass-card p-5">
        <div style={{ marginBottom:16 }}>
          <span style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)' }}>🏠 Device Consumption</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
          {devices.map((d, i) => (
            <div key={i} style={{ padding:'14px 16px', borderRadius:12, background:'rgba(255,255,255,0.03)', border:`1px solid ${d.on ? 'rgba(16,185,129,0.2)' : 'var(--border-glass)'}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:'1.5rem' }}>{d.icon}</span>
                <div>
                  <div style={{ fontSize:'0.825rem', fontWeight:600, color:'var(--text-primary)' }}>{d.name}</div>
                  <div style={{ fontSize:'0.72rem', color: d.on ? 'var(--accent-emerald)' : 'var(--text-muted)', fontWeight:600 }}>{d.on ? '● ON' : '○ OFF'}</div>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'Space Grotesk', fontSize:'1.1rem', fontWeight:700, color: d.on ? 'var(--accent-amber)' : 'var(--text-muted)' }}>
                  {d.on ? `${d.watts}W` : '—'}
                </div>
                {d.on && <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>~{(d.watts * energy.priceNow / 1000).toFixed(3)} RON/h</div>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:16, padding:'12px 16px', borderRadius:10, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', fontSize:'0.825rem', color:'var(--text-primary)', lineHeight:1.6 }}>
          💡 <strong>AI Tip:</strong> Solar production is high now — ideal time to run washing machine and EV charger. This could save ~0.8 RON vs. peak grid pricing.
        </div>
      </div>
    </div>
  );
}

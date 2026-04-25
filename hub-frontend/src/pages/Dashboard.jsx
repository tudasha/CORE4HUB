import { useState, useEffect } from 'react';
import {
  Thermometer, Droplets, Wind, Zap, Heart, Activity,
  Footprints, Sun, CloudSun, AlertTriangle, CheckCircle, Info, X, Bell, BrainCircuit, Loader, RefreshCw
} from 'lucide-react';
import { useWeather, useTransit } from '../hooks/useWeather';
import { useAuth } from '../context/AuthContext';
import { useSchedule } from '../context/ScheduleContext';
import { useSettings } from '../context/SettingsContext';
import { useDevices } from '../context/DevicesContext';
function StatCard({ icon: Icon, label, value, unit, color, pulse }) {
  return (
    <div className="glass-card stat-card p-4 fade-in" style={{ '--accent-primary': color }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ background: `${color}22`, borderRadius:10, padding:8, display:'flex' }}>
          <Icon size={18} color={color} />
        </div>
        {pulse && <div className="pulse-dot" />}
      </div>
      <div className="metric-value" style={{ color, marginBottom:4 }}>
        {value}<span style={{ fontSize:'1rem', fontWeight:500, opacity:0.7 }}> {unit}</span>
      </div>
      <div className="metric-label">{label}</div>
    </div>
  );
}

function AlertCard({ alert, onApprove, onDismiss, autoApplied }) {
  const typeMap = {
    action: { cls: 'alert-warning', icon: AlertTriangle, prefix: '⚡ Action Required' },
    info:   { cls: 'alert-info',    icon: Info,           prefix: '💡 AI Suggestion' },
    warning:{ cls: 'alert-warning', icon: AlertTriangle,  prefix: '⚠️ Alert'         },
  };
  const { cls, prefix } = typeMap[alert.type] || typeMap.info;

  return (
    <div className={`glass-card p-4 fade-in`} style={{ borderLeft:'3px solid', borderLeftColor: alert.type === 'action' ? 'var(--accent-amber)' : 'var(--accent-teal)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
        <div style={{ flex:1 }}>
          <span className={`alert-badge ${cls}`} style={{ marginBottom:8, display:'inline-flex' }}>{prefix}</span>
          <p style={{ fontSize:'0.875rem', color:'var(--text-primary)', lineHeight:1.6 }}>{alert.message}</p>
        </div>
        <button onClick={() => onDismiss(alert.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}><X size={16}/></button>
      </div>
      {alert.requiresApproval && !autoApplied && (
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          <button className="btn-approve" onClick={() => onApprove(alert.id)}>
            <CheckCircle size={14}/> Approve
          </button>
          <button className="btn-dismiss" onClick={() => onDismiss(alert.id)}>
            <X size={14}/> Dismiss
          </button>
        </div>
      )}
      {autoApplied && (
        <div style={{ display:'inline-flex', gap:6, alignItems:'center', marginTop:12, padding:'4px 10px', background:'rgba(16,185,129,0.1)', borderRadius:6, color:'var(--accent-emerald)', fontSize:'0.75rem', fontWeight:600 }}>
          <CheckCircle size={14}/> Auto-Applied to Schedule
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ sensorData, alerts = [], dismissAlert, connected }) {
  const { user } = useAuth();
  const { schedule, addScheduleItem } = useSchedule();
  const { modules, requireAiConfirmation } = useSettings();
  const { data: weatherRes } = useWeather();
  const { transitInfo: trafficRes } = useTransit();
  const { devices, toggleDevice } = useDevices();
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [approvedIds, setApprovedIds] = useState([]);
  const [autoAppliedIds, setAutoAppliedIds] = useState([]);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t2 = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t2);
  }, []);

  const fetchLiveSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const prompt = `Analyze this live smart home data and output EXACTLY a JSON array of 1 to 2 suggestions.
Data:
- Weather: ${weatherRes?.temp}°C
- Energy Price: ${sensorData?.energyPrice ?? 130} EUR/MWh
- Indoor Temp: ${sensorData?.temperature}°C
- Devices ON: ${devices.filter(d => d.on).map(d => d.name).join(', ') || 'None'}

Rules:
If Energy Price > 100 and high-wattage devices (HVAC, Washing Machine, EV Charger) are ON, suggest turning them off.
Output format:
[
  {
    "id": "ai_1",
    "type": "action",
    "message": "Reasoning...",
    "action": "Button Label",
    "requiresApproval": true,
    "deviceAction": {"device": "HVAC", "on": false}
  }
]
NO markdown, ONLY JSON array.`;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] })
      });
      const data = await response.json();
      let replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
      replyText = replyText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(replyText);
      if (Array.isArray(parsed)) setSuggestions(parsed);
    } catch (e) {
      console.error('Failed to fetch AI suggestions:', e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    if (suggestions.length === 0 && !loadingSuggestions && sensorData && devices.length > 0) {
      fetchLiveSuggestions();
    }
  }, [sensorData]); // runs once when sensorData lands

  useEffect(() => {
    if (!requireAiConfirmation) {
      suggestions.forEach(s => {
        if (s.requiresApproval && !autoAppliedIds.includes(s.id) && !approvedIds.includes(s.id)) {
          if (s.scheduleAction) addScheduleItem({ ...s.scheduleAction, label: s.scheduleAction.label + ' (Auto-Scheduled)' });
          if (s.deviceAction) toggleDevice(s.deviceAction.device, s.deviceAction.on);
          setAutoAppliedIds(prev => [...prev, s.id]);
        }
      });
    }
  }, [requireAiConfirmation, suggestions, autoAppliedIds, approvedIds, addScheduleItem, toggleDevice]);

  const handleApprove = (id) => {
    const origId = id.startsWith('s_') ? id.slice(2) : id;
    const suggestion = suggestions.find(s => String(s.id) === String(origId));
    if (suggestion?.scheduleAction) addScheduleItem(suggestion.scheduleAction);
    if (suggestion?.deviceAction) toggleDevice(suggestion.deviceAction.device, suggestion.deviceAction.on);
    
    setApprovedIds(prev => [...prev, origId]);
    setSuggestions(prev => prev.filter(s => String(s.id) !== String(origId)));
  };
  const handleDismiss = (id) => {
    const origId = id.startsWith('s_') ? id.slice(2) : id;
    setSuggestions(prev => prev.filter(s => String(s.id) !== String(origId)));
    dismissAlert?.(id);
  };

  const allAlerts = [
    ...suggestions.map(s => ({ ...s, _origId: s.id, id: `s_${s.id}` })),
    ...alerts.slice(0, 3),
  ];

  const sd = sensorData || {};

  return (
    <div className="fade-in" style={{ maxWidth:1600 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:28 }}>
        <div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>
            {now.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </div>
          <h1 className="section-title" style={{ fontSize:'2rem' }}>Good Morning, {user?.name || 'User'} 👋</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginTop:4 }}>
            {weatherRes ? `${weatherRes.condition} · ${weatherRes.temp}°C in Cluj-Napoca` : 'Loading weather...'}
          </p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontFamily:'Space Grotesk', fontSize:'2rem', fontWeight:700, color:'var(--text-primary)', letterSpacing:'-0.04em' }}>
            {now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', hour12:false })}
          </div>
          <Bell size={20} color="var(--text-muted)"/>
        </div>
      </div>

      {/* Live Sensor Stats Grid (Blended with External Weather APIs) */}
      <div className="dashboard-grid" style={{ marginBottom:20 }}>
        {modules.find(m => m.id === 'weather')?.active && (
          <>
            <StatCard icon={Thermometer}  label="Temperature"  value={weatherRes ? weatherRes.temp : '--'} unit="°C"  color="var(--accent-amber)"    pulse={!!weatherRes} />
            <StatCard icon={Droplets}     label="Humidity"     value={weatherRes ? weatherRes.humidity : '--'}    unit="%"   color="var(--accent-teal)"     />
            <StatCard icon={Wind}         label="Air Quality"  value={weatherRes ? weatherRes.aqi : '--'}  unit="AQI" color="var(--accent-secondary)"/>
            <StatCard icon={CloudSun}     label="Wind Speed"   value={weatherRes ? weatherRes.wind : '--'}     unit="m/s"    color="var(--accent-amber)"   />
          </>
        )}
        
        {modules.find(m => m.id === 'health')?.active && (
          <>
            <StatCard icon={Heart}        label="Heart Rate"   value={sd.heartRate ?? '--'}   unit="bpm" color="var(--accent-rose)"     pulse />
            <StatCard icon={Activity}     label="SpO₂"         value={sd.oxygenLevel ?? '--'} unit="%"   color="var(--accent-emerald)"  />
            <StatCard icon={Footprints}   label="Steps Today"  value={(sd.steps ?? 0).toLocaleString()} unit="" color="var(--accent-primary)" />
          </>
        )}

        {modules.find(m => m.id === 'energy')?.active && (
          <StatCard icon={Zap}          label="Electric Flow" value={sd.electricFlow ?? '--'} unit="A" color="#eab308"               />
        )}
      </div>

      {/* Second Row: Alerts | Traffic | Schedule */}
      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr 1fr', gap:16, marginBottom:20 }}>

        {/* Alerts & AI Suggestions */}
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <BrainCircuit size={16} color="var(--accent-primary)"/>
              <span style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)' }}>
                AI Alerts & Suggestions
              </span>
            </div>
            <button onClick={fetchLiveSuggestions} disabled={loadingSuggestions} style={{ background:'none', border:'none', cursor:'pointer', display:'flex' }}>
              <RefreshCw size={14} className={loadingSuggestions ? 'animate-spin' : ''} color="var(--text-muted)" />
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {loadingSuggestions ? (
              <div className="glass-card p-4" style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'0.875rem' }}>
                <Loader className="animate-spin" size={24} style={{ marginBottom:8, opacity:0.4, margin:'0 auto' }}/><br/>Gemini is analyzing live data...
              </div>
            ) : allAlerts.length === 0 ? (
              <div className="glass-card p-4" style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'0.875rem' }}>
                <CheckCircle size={24} style={{ marginBottom:8, opacity:0.4, margin:'0 auto' }}/><br/>All clear. No new suggestions.
              </div>
            ) : (
              allAlerts.map(a => (
                <AlertCard key={a.id} alert={a} autoApplied={autoAppliedIds.includes(a.id)} onApprove={handleApprove} onDismiss={(id) => { handleDismiss(id); dismissAlert?.(id); }} />
              ))
            )}
          </div>
        </div>

        {/* Traffic / Transit */}
        <div className="glass-card p-5">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <span style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)' }}>🚍 Live Transit – Tranzy Cluj</span>
            <span className={`alert-badge ${trafficRes?.level === 'Running' ? 'alert-success' : 'alert-info'}`}>
              {trafficRes ? trafficRes.level : 'Loading...'}
            </span>
          </div>
          <div className="metric-value" style={{ color:'var(--accent-teal)', marginBottom:4 }}>
            {trafficRes?.routes?.length > 0 ? trafficRes.routes.length : '--'}
            <span style={{ fontSize:'1rem' }}> live buses</span>
          </div>
          <div className="metric-label" style={{ marginBottom:16 }}>Relevant to your schedule</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {!trafficRes ? (
               <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Synching real-time GPS...</div>
            ) : trafficRes.routes?.map((r, i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 12px', background:'rgba(255,255,255,0.03)', borderRadius:8 }}>
                <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>{r.name}</span>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:'0.78rem', fontWeight:600, color:'var(--text-primary)' }}>{r.duration} min</span>
                  <span className={`alert-badge ${r.traffic === 'Delayed' ? 'alert-warning' : r.traffic === 'On Time' ? 'alert-success' : 'alert-info'}`} style={{ fontSize:'0.65rem', padding:'2px 8px' }}>{r.traffic}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="glass-card p-5">
          <div style={{ marginBottom:16 }}>
            <span style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)' }}>📅 Today's Schedule</span>
          </div>
          {schedule
            .filter(e => {
              const eDate = e.date || `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
              const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
              return eDate === todayStr;
            })
            .sort((a,b) => a.time.localeCompare(b.time))
            .map((e) => (
            <div key={e.id} style={{ display:'flex', gap:12, marginBottom:12, opacity: e.done ? 0.5 : 1 }}>
              <div style={{ width:48, fontSize:'0.72rem', fontWeight:600, color:'var(--text-muted)', paddingTop:2, flexShrink:0 }}>{e.time}</div>
              <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                <div style={{ width:3, height:'100%', minHeight:32, borderRadius:2, background:e.color, flexShrink:0 }} />
                <span style={{ fontSize:'0.825rem', color: e.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: e.done ? 'line-through' : 'none' }}>{e.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weather Mini & Energy Mini */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div className="glass-card p-5">
          <span style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)' }}>☁️ Weather Snapshot</span>
          <div style={{ display:'flex', alignItems:'center', gap:20, marginTop:12 }}>
            <span style={{ fontSize:'3rem', filter:'drop-shadow(0 0 12px rgba(6,182,212,0.4))' }}>{weatherRes ? (weatherRes.temp > 20 ? '☀️' : '⛅') : '☁️'}</span>
            <div>
              <div className="metric-value" style={{ color:'var(--accent-teal)' }}>{weatherRes ? weatherRes.temp : '--'}°C</div>
              <div style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>{weatherRes ? weatherRes.condition : 'Loading...'} · Humidity {weatherRes ? weatherRes.humidity : '--'}%</div>
              <div style={{ color:'var(--text-secondary)', fontSize:'0.8rem' }}>Wind {weatherRes ? weatherRes.wind : '--'} km/h · AQI {weatherRes ? weatherRes.aqi : '--'}</div>
            </div>
          </div>
        </div>
        <div className="glass-card p-5">
          <span style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)' }}>⚡ Energy Snapshot</span>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:12 }}>
            <div>
              <div className="metric-value" style={{ color:'#eab308' }}>{sd.solarOutput ?? '--'}<span style={{ fontSize:'1rem' }}> kW</span></div>
              <div style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>Solar Output</div>
            </div>
            <div style={{ width:1, height:40, background:'var(--border-glass)' }}/>
            <div>
              <div className="metric-value" style={{ color:'var(--accent-amber)' }}>{sd.energyCost ?? '--'}<span style={{ fontSize:'1rem' }}> RON/h</span></div>
              <div style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>Current Cost</div>
            </div>
            <div style={{ width:1, height:40, background:'var(--border-glass)' }}/>
            <div>
              <div className="metric-value" style={{ color:'var(--accent-emerald)' }}>{sd.electricFlow ?? '--'}<span style={{ fontSize:'1rem' }}> A</span></div>
              <div style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>Electric Flow</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

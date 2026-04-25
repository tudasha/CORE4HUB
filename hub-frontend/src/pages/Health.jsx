import { useState, useEffect } from 'react';
import { mockHealth } from '../utils/mockData';
import { Heart, Activity, Footprints, Moon, Flame, Droplets } from 'lucide-react';

function Ring({ value, max, color, label, icon: Icon }) {
  const pct = Math.min((value / max) * 100, 100);
  const r = 38, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8}/>
        <circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25}
          strokeLinecap="round" style={{ transition:'stroke-dasharray 1s ease' }}/>
        <text x={50} y={46} textAnchor="middle" fill="white" fontSize={15} fontWeight={700} fontFamily="Space Grotesk">{value}</text>
        <text x={50} y={60} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={9}>{label}</text>
      </svg>
    </div>
  );
}

function MiniBar({ data, color, keyX, keyY, height = 80 }) {
  if (!data?.length) return null;
  const maxV = Math.max(...data.map(d => d[keyY]));
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:4, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <div style={{
            width:'100%', borderRadius:4,
            background: `linear-gradient(to top, ${color}, ${color}88)`,
            height: `${(d[keyY] / maxV) * (height - 20)}px`,
            minHeight:4,
            transition:'height 0.8s ease',
          }}/>
          <span style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>{d[keyX]}</span>
        </div>
      ))}
    </div>
  );
}

export default function Health({ sensorData }) {
  const [health, setHealth] = useState(mockHealth());

  useEffect(() => {
    const interval = setInterval(() => setHealth(mockHealth()), 10000);
    return () => clearInterval(interval);
  }, []);

  const sd = sensorData || {};
  const hr = sd.heartRate || health.heartRate;
  const o2 = sd.oxygenLevel || health.oxygen;
  const steps = sd.steps || health.steps;

  const caloriesPct = Math.round((health.calories / health.calorieGoal) * 100);
  const stepsPct = Math.round((steps / health.stepsGoal) * 100);

  return (
    <div className="fade-in" style={{ maxWidth: 1400 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="section-title">Health & Sports</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginTop:4 }}>
          Connected: Smartwatch · Phone · Step Tracker · Live metrics
        </p>
      </div>

      {/* Top Rings */}
      <div className="glass-card p-6" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-around', alignItems:'flex-start', flexWrap:'wrap', gap:24 }}>
          <Ring value={steps.toLocaleString()} max={health.stepsGoal} color="var(--accent-primary)" label="/ 10k steps" icon={Footprints}/>
          <Ring value={health.calories} max={health.calorieGoal} color="var(--accent-rose)" label="kcal" icon={Flame}/>
          <Ring value={health.sleepHours} max={9} color="var(--accent-secondary)" label="hrs sleep" icon={Moon}/>
          <Ring value={health.sleepQuality} max={100} color="var(--accent-teal)" label="% quality" icon={Moon}/>

          <div style={{ display:'flex', flexDirection:'column', gap:16, justifyContent:'center' }}>
            {[
              { label:'Heart Rate', value:`${hr} bpm`, color:'var(--accent-rose)', icon: Heart },
              { label:'SpO₂', value:`${o2}%`, color:'var(--accent-teal)', icon: Activity },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ background:`${color}22`, borderRadius:10, padding:8, display:'flex' }}><Icon size={18} color={color}/></div>
                <div>
                  <div style={{ fontFamily:'Space Grotesk', fontSize:'1.4rem', fontWeight:700, color, lineHeight:1 }}>{value}</div>
                  <div className="metric-label">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <div className="glass-card p-5">
          <div style={{ marginBottom:12 }}>
            <span style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)' }}>👣 Weekly Steps</span>
          </div>
          <MiniBar data={health.weeklySteps} keyX="day" keyY="steps" color="var(--accent-primary)" height={90}/>
        </div>
        <div className="glass-card p-5">
          <div style={{ marginBottom:12 }}>
            <span style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)' }}>❤️ Weekly Heart Rate (avg bpm)</span>
          </div>
          <MiniBar data={health.weeklyHeart} keyX="day" keyY="bpm" color="var(--accent-rose)" height={90}/>
        </div>
      </div>

      {/* Nutrition + Macros Row */}
      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:16 }}>
        {/* Meals */}
        <div className="glass-card p-5">
          <div style={{ marginBottom:14 }}>
            <span style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)' }}>🍽️ Nutrition Log (from phone)</span>
            <span style={{ float:'right', fontSize:'0.75rem', color:'var(--text-muted)' }}>{health.calories} / {health.calorieGoal} kcal</span>
          </div>
          <div className="progress-bar" style={{ marginBottom:16 }}>
            <div className="progress-fill" style={{ width:`${caloriesPct}%`, background:'linear-gradient(90deg, var(--accent-rose), var(--accent-amber))' }}/>
          </div>
          {health.meals.map((m, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom: i < health.meals.length - 1 ? '1px solid var(--border-glass)' : 'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:'1.4rem' }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize:'0.875rem', fontWeight:500, color:'var(--text-primary)' }}>{m.name}</div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{m.time}</div>
                </div>
              </div>
              <span style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--accent-amber)' }}>{m.calories} kcal</span>
            </div>
          ))}
        </div>

        {/* Macros */}
        <div className="glass-card p-5">
          <div style={{ marginBottom:14 }}>
            <span style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)' }}>💪 Macronutrients</span>
          </div>
          {[
            { label:'Protein', value:health.macros.protein, max:160, unit:'g', color:'var(--accent-rose)' },
            { label:'Carbohydrates', value:health.macros.carbs,   max:280, unit:'g', color:'var(--accent-amber)' },
            { label:'Fat',     value:health.macros.fat,     max:80,  unit:'g', color:'var(--accent-teal)' },
          ].map(({ label, value, max, unit, color }) => (
            <div key={label} style={{ marginBottom:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:'0.825rem', color:'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontSize:'0.825rem', fontWeight:600, color }}>{value} / {max} {unit}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width:`${Math.min((value/max)*100,100)}%`, background:`linear-gradient(90deg, ${color}, ${color}88)` }}/>
              </div>
            </div>
          ))}

          <div className="divider" style={{ margin:'16px 0' }}/>
          <div>
            <div style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)', marginBottom:12 }}>🏋️ AI Workout Suggestion</div>
            <div style={{ padding:'12px 14px', borderRadius:10, background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', fontSize:'0.825rem', color:'var(--text-primary)', lineHeight:1.6 }}>
              Based on your activity this week, I recommend a <strong>30-min moderate cardio</strong> session today. Your resting heart rate is slightly elevated — avoid high-intensity training.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

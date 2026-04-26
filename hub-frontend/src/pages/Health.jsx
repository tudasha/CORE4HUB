import { useState, useEffect } from 'react';
import { Heart, Activity, Footprints, Moon, Flame, Trash2, Plus } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function Ring({ value, max, color, label }) {
  const pct = Math.min((parseFloat(value) / max) * 100, 100) || 0;
  const r = 38, circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8}/>
        <circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25}
          strokeLinecap="round" style={{ transition:'stroke-dasharray 1s ease' }}/>
        <text x={50} y={46} textAnchor="middle" fill="white" fontSize={13} fontWeight={700} fontFamily="Space Grotesk">{value ?? '--'}</text>
        <text x={50} y={60} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={9}>{label}</text>
      </svg>
    </div>
  );
}

function MiniBar({ data, color, keyX, keyY, height = 80 }) {
  if (!data?.length) return <div style={{ color:'var(--text-muted)', fontSize:'0.8rem', textAlign:'center', padding:'20px 0' }}>No data yet</div>;
  const maxV = Math.max(...data.map(d => d[keyY]), 1);
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:4, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
          <div style={{
            width:'100%', borderRadius:4,
            background:`linear-gradient(to top, ${color}, ${color}88)`,
            height:`${(d[keyY] / maxV) * (height - 20)}px`,
            minHeight:4, transition:'height 0.8s ease',
          }}/>
          <span style={{ fontSize:'0.6rem', color:'var(--text-muted)' }}>{d[keyX]}</span>
        </div>
      ))}
    </div>
  );
}

export default function Health({ sensorData }) {
  const [steps, setSteps] = useState(null);
  const [stepsHistory, setStepsHistory] = useState([]);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingMeal, setAddingMeal] = useState(false);
  const [mealForm, setMealForm] = useState({ name:'', icon:'🍽️', calories:'', protein:'', carbs:'', fat:'', meal_type:'lunch' });

  const token = localStorage.getItem('token');
  const authHeaders = { 'Content-Type':'application/json', Authorization:`Bearer ${token}` };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const [stepsRes, histRes, mealsRes] = await Promise.all([
        fetch(`${API}/api/health/steps`, { headers: authHeaders }),
        fetch(`${API}/api/health/steps?days=7`, { headers: authHeaders }),
        fetch(`${API}/api/health/meals?date=${today}`, { headers: authHeaders }),
      ]);
      const stepsData = await stepsRes.json();
      const histData  = await histRes.json();
      const mealsData = await mealsRes.json();

      // Latest step count
      if (stepsData.history?.length) {
        const last = stepsData.history[stepsData.history.length - 1];
        setSteps({ steps: parseInt(last.steps), goal: parseInt(last.goal) });
      }
      // Weekly history for bar chart
      setStepsHistory((histData.history || []).map(r => ({
        day: new Date(r.day).toLocaleDateString('en', { weekday:'short' }),
        steps: parseInt(r.steps),
      })));
      setMeals(mealsData.meals || []);
    } catch (e) {
      console.error('Health fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const deleteMeal = async (id) => {
    await fetch(`${API}/api/health/meals/${id}`, { method:'DELETE', headers: authHeaders });
    setMeals(prev => prev.filter(m => m.id !== id));
  };

  const submitMeal = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API}/api/health/meals`, {
      method:'POST', headers: authHeaders,
      body: JSON.stringify({ ...mealForm, calories: +mealForm.calories, protein: +mealForm.protein, carbs: +mealForm.carbs, fat: +mealForm.fat }),
    });
    const data = await res.json();
    if (data.meal) { setMeals(prev => [...prev, data.meal]); setAddingMeal(false); setMealForm({ name:'', icon:'🍽️', calories:'', protein:'', carbs:'', fat:'', meal_type:'lunch' }); }
  };

  const sd = sensorData || {};
  const hr = sd.heartRate ?? '--';
  const o2 = sd.oxygenLevel ?? '--';
  const totalCals = meals.reduce((s, m) => s + (parseFloat(m.calories) || 0), 0);
  const totalProtein = meals.reduce((s, m) => s + (parseFloat(m.protein) || 0), 0);
  const totalCarbs = meals.reduce((s, m) => s + (parseFloat(m.carbs) || 0), 0);
  const totalFat = meals.reduce((s, m) => s + (parseFloat(m.fat) || 0), 0);
  const calorieGoal = 2200;
  const stepsGoal = steps?.goal || 10000;
  const currentSteps = steps?.steps || 0;

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', color:'var(--text-muted)' }}>
      Loading health data...
    </div>
  );

  return (
    <div className="fade-in" style={{ maxWidth: 1400 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 className="section-title">Health & Sports</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginTop:4 }}>
          Live data from Core4Health · Steps · Nutrition · Live vitals
        </p>
      </div>

      {/* Top Rings */}
      <div className="glass-card p-6" style={{ marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-around', alignItems:'flex-start', flexWrap:'wrap', gap:24 }}>
          <Ring value={currentSteps.toLocaleString()} max={stepsGoal} color="var(--accent-primary)" label={`/ ${(stepsGoal/1000).toFixed(0)}k steps`} />
          <Ring value={Math.round(totalCals)} max={calorieGoal} color="var(--accent-rose)" label="kcal today" />

          <div style={{ display:'flex', flexDirection:'column', gap:16, justifyContent:'center' }}>
            {[
              { label:'Heart Rate', value:`${hr} bpm`, color:'var(--accent-rose)', icon: Heart },
              { label:'SpO₂',       value:`${o2}%`,   color:'var(--accent-teal)', icon: Activity },
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
          <MiniBar data={stepsHistory} keyX="day" keyY="steps" color="var(--accent-primary)" height={90}/>
        </div>
        <div className="glass-card p-5">
          <div style={{ marginBottom:12 }}>
            <span style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)' }}>🔥 Calories Today</span>
          </div>
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontFamily:'Space Grotesk', fontSize:'2.5rem', fontWeight:700, color:'var(--accent-rose)' }}>{Math.round(totalCals)}</div>
            <div style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>/ {calorieGoal} kcal goal</div>
            <div className="progress-bar" style={{ marginTop:12 }}>
              <div className="progress-fill" style={{ width:`${Math.min((totalCals/calorieGoal)*100,100)}%`, background:'linear-gradient(90deg, var(--accent-rose), var(--accent-amber))' }}/>
            </div>
          </div>
        </div>
      </div>

      {/* Meals + Macros */}
      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:16 }}>
        <div className="glass-card p-5">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <span style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)' }}>🍽️ Meals Today</span>
            <button onClick={() => setAddingMeal(v => !v)} style={{ background:'var(--accent-primary)', border:'none', borderRadius:8, color:'white', padding:'4px 12px', fontSize:'0.8rem', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
              <Plus size={14}/> Add
            </button>
          </div>

          {addingMeal && (
            <form onSubmit={submitMeal} style={{ marginBottom:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <input required placeholder="Name" value={mealForm.name} onChange={e => setMealForm(p => ({...p, name:e.target.value}))} className="input" style={{ gridColumn:'1/-1' }}/>
              <input placeholder="kcal" type="number" value={mealForm.calories} onChange={e => setMealForm(p => ({...p, calories:e.target.value}))} className="input"/>
              <input placeholder="Protein (g)" type="number" value={mealForm.protein} onChange={e => setMealForm(p => ({...p, protein:e.target.value}))} className="input"/>
              <input placeholder="Carbs (g)" type="number" value={mealForm.carbs} onChange={e => setMealForm(p => ({...p, carbs:e.target.value}))} className="input"/>
              <input placeholder="Fat (g)" type="number" value={mealForm.fat} onChange={e => setMealForm(p => ({...p, fat:e.target.value}))} className="input"/>
              <button type="submit" style={{ gridColumn:'1/-1', background:'var(--accent-primary)', border:'none', borderRadius:8, color:'white', padding:'8px', cursor:'pointer' }}>Save Meal</button>
            </form>
          )}

          {meals.length === 0 ? (
            <div style={{ color:'var(--text-muted)', fontSize:'0.85rem', padding:'20px 0', textAlign:'center' }}>No meals logged today. Add your first meal!</div>
          ) : meals.map((m, i) => (
            <div key={m.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom: i < meals.length-1 ? '1px solid var(--border-glass)' : 'none' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ fontSize:'1.4rem' }}>{m.icon}</span>
                <div>
                  <div style={{ fontSize:'0.875rem', fontWeight:500, color:'var(--text-primary)' }}>{m.name}</div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{m.meal_type} · {m.protein}g P · {m.carbs}g C · {m.fat}g F</div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--accent-amber)' }}>{m.calories} kcal</span>
                <button onClick={() => deleteMeal(m.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}><Trash2 size={14}/></button>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card p-5">
          <div style={{ marginBottom:14 }}>
            <span style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)' }}>💪 Macronutrients Today</span>
          </div>
          {[
            { label:'Protein', value:Math.round(totalProtein), max:160, unit:'g', color:'var(--accent-rose)' },
            { label:'Carbohydrates', value:Math.round(totalCarbs), max:280, unit:'g', color:'var(--accent-amber)' },
            { label:'Fat', value:Math.round(totalFat), max:80, unit:'g', color:'var(--accent-teal)' },
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
        </div>
      </div>
    </div>
  );
}

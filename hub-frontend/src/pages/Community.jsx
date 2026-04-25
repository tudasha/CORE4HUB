import { useState } from 'react';
import { Users, Plus, LogIn, Copy, Check, MessageSquare, Calendar, Activity } from 'lucide-react';

const DEMO_HUB = {
  code: 'HUB42X',
  name: 'Familie Popescu',
  members: [
    { name: 'Alex', avatar: '👨‍💻', status: 'Active', steps: 7420, heartRate: 72 },
    { name: 'Maria', avatar: '👩‍🦱', status: 'Away',   steps: 5800, heartRate: 68 },
    { name: 'Bunica', avatar: '👵', status: 'Inactive', steps: 3200, heartRate: 75 },
  ],
  sharedEvents: [
    { title: 'Family Dinner', date: '2026-04-25', time: '19:00', color: '#f59e0b' },
    { title: 'Movie Night',   date: '2026-04-26', time: '21:00', color: '#8b5cf6' },
    { title: 'Garden Work',   date: '2026-04-27', time: '10:00', color: '#10b981' },
  ],
};

export default function Community() {
  const [mode, setMode] = useState(null); // null | 'create' | 'join' | 'hub'
  const [hubName, setHubName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [hub, setHub] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('members');

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (mode === 'hub' || hub) {
    const h = hub || DEMO_HUB;
    return (
      <div className="fade-in" style={{ maxWidth: 1200 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <h1 className="section-title">{h.name}</h1>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginTop:4 }}>Community Hub</p>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <div style={{ padding:'8px 16px', borderRadius:10, background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.3)', display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:600 }}>HUB CODE</span>
              <span style={{ fontFamily:'Space Grotesk', fontWeight:700, color:'var(--accent-primary)', letterSpacing:'0.1em' }}>{h.code}</span>
              <button onClick={() => copyCode(h.code)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}>
                {copied ? <Check size={14} color="var(--accent-emerald)"/> : <Copy size={14}/>}
              </button>
            </div>
            <button className="btn-ghost" onClick={() => { setMode(null); setHub(null); }}>Leave Hub</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:16 }}>
          {[
            { id:'members', icon: Users,       label:'Members' },
            { id:'events',  icon: Calendar,    label:'Shared Schedule' },
            { id:'health',  icon: Activity,    label:'Group Health' },
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} id={`hub-tab-${id}`}
              className={activeTab === id ? 'btn-primary' : 'btn-ghost'}
              onClick={() => setActiveTab(id)}
              style={{ display:'flex', gap:8, alignItems:'center', fontSize:'0.825rem' }}>
              <Icon size={15}/>{label}
            </button>
          ))}
        </div>

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
            {h.members.map((m, i) => (
              <div key={i} className="glass-card p-5 slide-in" style={{ textAlign:'center' }}>
                <div style={{ fontSize:'3rem', marginBottom:12 }}>{m.avatar}</div>
                <div style={{ fontFamily:'Space Grotesk', fontSize:'1.1rem', fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{m.name}</div>
                <span className={`alert-badge ${m.status==='Active'?'alert-success':m.status==='Away'?'alert-warning':'alert-info'}`} style={{ marginBottom:14 }}>
                  {m.status}
                </span>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:12 }}>
                  <div style={{ padding:'10px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border-glass)' }}>
                    <div style={{ fontFamily:'Space Grotesk', fontSize:'1.2rem', fontWeight:700, color:'var(--accent-primary)' }}>{m.steps.toLocaleString()}</div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Steps</div>
                  </div>
                  <div style={{ padding:'10px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border-glass)' }}>
                    <div style={{ fontFamily:'Space Grotesk', fontSize:'1.2rem', fontWeight:700, color:'var(--accent-rose)' }}>{m.heartRate}</div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em' }}>BPM</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Shared Schedule Tab */}
        {activeTab === 'events' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:600 }}>
            {h.sharedEvents.map((e, i) => (
              <div key={i} className="glass-card p-4 slide-in" style={{ borderLeft:`3px solid ${e.color}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontSize:'0.9rem', fontWeight:600, color:'var(--text-primary)' }}>{e.title}</div>
                    <div style={{ fontSize:'0.78rem', color:`${e.color}`, fontWeight:600, marginTop:2 }}>📅 {e.date} · 🕐 {e.time}</div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    {h.members.map((m, j) => (
                      <div key={j} style={{ width:28, height:28, borderRadius:'50%', background:'rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem' }}>
                        {m.avatar}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Group Health Tab */}
        {activeTab === 'health' && (
          <div className="glass-card p-5">
            <div style={{ marginBottom:20 }}>
              <span style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)' }}>Group Activity Overview</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {h.members.map((m, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:16 }}>
                  <span style={{ fontSize:'1.5rem', width:32, textAlign:'center' }}>{m.avatar}</span>
                  <span style={{ width:70, fontSize:'0.875rem', fontWeight:500, color:'var(--text-primary)' }}>{m.name}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                      <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Steps: {m.steps.toLocaleString()} / 10,000</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width:`${Math.min((m.steps/10000)*100,100)}%`, background:'linear-gradient(90deg, var(--accent-primary), var(--accent-teal))' }}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth:900 }}>
      <div style={{ marginBottom:32 }}>
        <h1 className="section-title">Community Hub</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginTop:4 }}>
          Connect with family, friends or neighbours. Share schedules and health goals.
        </p>
      </div>

      {!mode ? (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, maxWidth:640 }}>
          {[
            { id:'create-hub-btn', action:()=>setMode('create'), icon: Plus,   label:'Create a Hub',   desc:'Start a new shared community hub and invite others with a code.', color:'var(--accent-primary)' },
            { id:'join-hub-btn',   action:()=>setMode('join'),   icon: LogIn,  label:'Join a Hub',    desc:'Enter a hub code to join an existing community.',                color:'var(--accent-teal)' },
            { id:'demo-hub-btn',   action:()=>{ setHub(DEMO_HUB); setMode('hub'); }, icon: Users, label:'View Demo Hub', desc:'See a live demo of a shared family hub.', color:'var(--accent-secondary)' },
          ].map(({ id, action, icon: Icon, label, desc, color }) => (
            <div key={id} id={id} className="glass-card p-6" style={{ cursor:'pointer', '--accent-primary': color }} onClick={action}>
              <div style={{ background:`${color}22`, borderRadius:14, padding:14, display:'inline-flex', marginBottom:16 }}><Icon size={24} color={color}/></div>
              <div style={{ fontFamily:'Space Grotesk', fontSize:'1.05rem', fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>{label}</div>
              <p style={{ fontSize:'0.825rem', color:'var(--text-secondary)', lineHeight:1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      ) : mode === 'create' ? (
        <div className="glass-card p-8 slide-in" style={{ maxWidth:440 }}>
          <h2 style={{ fontFamily:'Space Grotesk', fontSize:'1.1rem', fontWeight:700, marginBottom:20 }}>Create a Hub</h2>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--text-muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Hub Name</div>
            <input id="create-hub-name" className="glass-input" placeholder="e.g. Familia Popescu" value={hubName} onChange={e => setHubName(e.target.value)}/>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button id="confirm-create-hub" className="btn-primary" style={{ flex:1 }} onClick={() => { if (hubName) { setHub({ ...DEMO_HUB, name: hubName, code: Math.random().toString(36).substring(2,8).toUpperCase(), members:[{ name:'You', avatar:'👤', status:'Active', steps:0, heartRate:70 }], sharedEvents:[] }); setMode('hub'); } }}>
              <Plus size={16}/> Create
            </button>
            <button className="btn-ghost" style={{ flex:1 }} onClick={()=>setMode(null)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 slide-in" style={{ maxWidth:440 }}>
          <h2 style={{ fontFamily:'Space Grotesk', fontSize:'1.1rem', fontWeight:700, marginBottom:20 }}>Join a Hub</h2>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--text-muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Hub Code</div>
            <input id="join-hub-code" className="glass-input" placeholder="e.g. HUB42X" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} style={{ fontFamily:'Space Grotesk', letterSpacing:'0.1em' }}/>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button id="confirm-join-hub" className="btn-primary" style={{ flex:1 }} onClick={() => { if (joinCode) { setHub({ ...DEMO_HUB, code: joinCode }); setMode('hub'); } }}>
              <LogIn size={16}/> Join
            </button>
            <button className="btn-ghost" style={{ flex:1 }} onClick={()=>setMode(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

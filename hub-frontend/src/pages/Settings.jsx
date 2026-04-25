import { useState } from 'react';
import { User, Bell, Shield, Package, CreditCard, ChevronRight, Check, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

const PLANS = [
  { id:'free',  label:'Free',       price:'0',   desc:'Daily AI summaries • 5 sensors • Basic dashboards' },
  { id:'pro',   label:'Pro',        price:'29',  desc:'Weekly summaries • 20 sensors • Energy + Health analytics', popular:true },
  { id:'ultra', label:'Ultra',      price:'59',  desc:'Monthly trends • Unlimited sensors • Priority AI • Doctor access' },
];

export default function Settings() {
  const { user } = useAuth();
  const { 
    modules, toggleModule, 
    language, setLanguage, 
    voiceAutoSend, setVoiceAutoSend, 
    voiceEngine, setVoiceEngine,
    requireAiConfirmation, setRequireAiConfirmation 
  } = useSettings();
  
  const [plan, setPlan] = useState('pro');
  const [tab, setTab] = useState('account');
  const [notifs, setNotifs] = useState({ alerts:true, ai:true, energy:false, health:true });
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };


  const tabs = [
    { id:'account',      icon: User,    label:'Account' },
    { id:'modules',      icon: Package, label:'My Modules' },
    { id:'subscription', icon: CreditCard, label:'Subscription' },
    { id:'notifications',icon: Bell,    label:'Notifications' },
  ];

  return (
    <div className="fade-in" style={{ maxWidth:1000 }}>
      <div style={{ marginBottom:24 }}>
        <h1 className="section-title">Settings</h1>
        <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginTop:4 }}>Manage your account, modules, and subscription</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:20 }}>
        {/* Side Tabs */}
        <div className="glass-card p-3" style={{ height:'fit-content' }}>
          {tabs.map(({ id, icon: Icon, label }) => (
            <button key={id} id={`settings-tab-${id}`}
              onClick={() => setTab(id)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, border:'none', cursor:'pointer', background: tab===id ? 'rgba(99,102,241,0.15)' : 'transparent', color: tab===id ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize:'0.875rem', fontWeight:500, fontFamily:'inherit', marginBottom:4, transition:'all 0.2s ease' }}>
              <Icon size={17}/> {label}
              {tab===id && <ChevronRight size={14} style={{ marginLeft:'auto' }}/>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div>
          {/* Account */}
          {tab === 'account' && (
            <div className="glass-card p-6 slide-in">
              <h2 style={{ fontFamily:'Space Grotesk', fontSize:'1.1rem', fontWeight:700, marginBottom:20 }}>Account Information</h2>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24, padding:'16px', borderRadius:14, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ width:60, height:60, borderRadius:'50%', background:'linear-gradient(135deg, var(--accent-primary), var(--accent-teal))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', fontWeight:700, color:'#000', fontFamily:'Space Grotesk' }}>
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div style={{ fontFamily:'Space Grotesk', fontSize:'1.05rem', fontWeight:700, color:'var(--text-primary)' }}>{user?.name || 'Authorized User'}</div>
                  <div style={{ fontSize:'0.825rem', color:'var(--text-secondary)' }}>{user?.username || 'user'}@smarthub.app</div>
                  <span className="alert-badge" style={{ marginTop:6, background:'var(--accent-primary)', color:'#000', fontWeight:700, padding:'2px 8px', borderRadius:4, fontSize:'0.7rem' }}>
                    {plan.toUpperCase()} PLAN
                  </span>
                </div>
              </div>
              {[
                { label:'Full Name',    id:'account-name',  value: user?.name || '' },
                { label:'Username/Email',id:'account-email', value: user?.username || '' },
                { label:'Location',     id:'account-loc',   value:'Cluj-Napoca, Romania' },
              ].map(({ label, id, value }) => (
                <div key={id} style={{ marginBottom:16 }}>
                  <div style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--text-muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</div>
                  <input id={id} className="glass-input" defaultValue={value} readOnly={id === 'account-email'} />
                </div>
              ))}

              <div style={{ marginTop: 32, borderTop: '1px solid var(--border-glass)', paddingTop: 24 }}>
                <h2 style={{ fontFamily:'Space Grotesk', fontSize:'1rem', fontWeight:700, marginBottom:16 }}>AI Voice Assistant Preferences</h2>
                
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--border-glass)' }}>
                  <div>
                    <div style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-primary)' }}>Chat Language</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:2 }}>Spoken and understood language for Speech AI</div>
                  </div>
                  <select className="glass-input" style={{ width:120, padding:'6px 10px', colorScheme: 'dark' }} value={language} onChange={e => setLanguage(e.target.value)}>
                    <option value="en-US">English</option>
                    <option value="ro-RO">Romanian</option>
                  </select>
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--border-glass)' }}>
                  <div>
                    <div style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-primary)' }}>Auto-Send Realtime Speech</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:2 }}>Immediately send message when you stop talking</div>
                  </div>
                  <button onClick={() => setVoiceAutoSend(!voiceAutoSend)} style={{ width:44, height:24, borderRadius:12, background: voiceAutoSend ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.3s ease' }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', background:'white', position:'absolute', top:3, left: voiceAutoSend ? 23 : 3, transition:'left 0.3s ease' }}/>
                  </button>
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--border-glass)' }}>
                  <div>
                    <div style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-primary)' }}>Require AI Confirmation</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:2 }}>Verify Schedule changes before applying</div>
                  </div>
                  <button onClick={() => setRequireAiConfirmation(!requireAiConfirmation)} style={{ width:44, height:24, borderRadius:12, background: requireAiConfirmation ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.3s ease' }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', background:'white', position:'absolute', top:3, left: requireAiConfirmation ? 23 : 3, transition:'left 0.3s ease' }}/>
                  </button>
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--border-glass)' }}>
                  <div>
                    <div style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-primary)' }}>Text-to-Speech Engine</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:2 }}>AI will automatically read replies aloud</div>
                  </div>
                  <button onClick={() => setVoiceEngine(!voiceEngine)} style={{ width:44, height:24, borderRadius:12, background: voiceEngine ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.3s ease' }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', background:'white', position:'absolute', top:3, left: voiceEngine ? 23 : 3, transition:'left 0.3s ease' }}/>
                  </button>
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:16, marginTop:24 }}>
                <button id="save-account-btn" className="btn-primary" onClick={handleSave}>
                  <Check size={16}/> Save Changes
                </button>
                {isSaved && (
                  <span className="fade-in" style={{ color:'var(--accent-primary)', fontSize:'0.875rem', fontWeight:600, display:'flex', alignItems:'center', gap:6 }}>
                    <CheckCircle size={16} /> Successfully saved!
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Modules */}
          {tab === 'modules' && (
            <div className="glass-card p-6 slide-in">
              <h2 style={{ fontFamily:'Space Grotesk', fontSize:'1.1rem', fontWeight:700, marginBottom:6 }}>My Hardware Modules</h2>
              <p style={{ fontSize:'0.825rem', color:'var(--text-secondary)', marginBottom:20 }}>Modules are unlocked based on the sensors in your purchased package. Add new hardware to expand your hub.</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {modules.map((m) => (
                  <div key={m.id} style={{ padding:'14px 16px', borderRadius:12, background:'rgba(255,255,255,0.03)', border:`1px solid ${m.active ? 'rgba(16,185,129,0.25)' : 'var(--border-glass)'}`, display:'flex', alignItems:'center', gap:12 }}>
                    <span style={{ fontSize:'1.5rem' }}>{m.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-primary)' }}>{m.label}</div>
                      <div style={{ fontSize:'0.72rem', fontWeight:600, color: m.active ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                        {m.active ? '● Active' : '○ Not purchased'}
                      </div>
                    </div>
                    {!m.active ? (
                      <button className="btn-ghost" style={{ fontSize:'0.72rem', padding:'4px 10px', opacity:0.7 }} onClick={() => toggleModule(m.id)}>+ Install</button>
                    ) : (
                      <button className="btn-ghost" style={{ fontSize:'0.72rem', padding:'4px 10px', opacity:0.7, color:'var(--accent-rose)' }} onClick={() => toggleModule(m.id)}>- Remove</button>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ marginTop:16, padding:'12px 16px', borderRadius:10, background:'rgba(6,182,212,0.08)', border:'1px solid rgba(6,182,212,0.2)', fontSize:'0.825rem', color:'var(--text-secondary)' }}>
                💡 Purchase new sensors at <strong style={{ color:'var(--accent-teal)' }}>smarthub.io/shop</strong>. Your account updates automatically when your order ships.
              </div>
            </div>
          )}

          {/* Subscription */}
          {tab === 'subscription' && (
            <div className="slide-in">
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {PLANS.map(p => (
                  <div key={p.id} id={`plan-${p.id}`}
                    onClick={() => setPlan(p.id)}
                    className="glass-card"
                    style={{ padding:'20px 24px', cursor:'pointer', border: plan===p.id ? '1px solid rgba(99,102,241,0.5)' : '1px solid var(--border-glass)', background: plan===p.id ? 'rgba(99,102,241,0.1)' : 'var(--bg-card)', position:'relative', transition:'all 0.25s ease' }}>
                    {p.popular && <span className="tag" style={{ position:'absolute', top:16, right:16 }}>Most Popular</span>}
                    <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                      <div style={{ width:20, height:20, borderRadius:'50%', border:`2px solid ${plan===p.id ? 'var(--accent-primary)' : 'var(--text-muted)'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        {plan===p.id && <div style={{ width:10, height:10, borderRadius:'50%', background:'var(--accent-primary)' }}/>}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontFamily:'Space Grotesk', fontSize:'1rem', fontWeight:700, color:'var(--text-primary)' }}>{p.label}</div>
                        <div style={{ fontSize:'0.825rem', color:'var(--text-secondary)', marginTop:2 }}>{p.desc}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <span style={{ fontFamily:'Space Grotesk', fontSize:'1.5rem', fontWeight:800, color: p.id==='free' ? 'var(--text-muted)' : 'var(--accent-primary)' }}>{p.price === '0' ? 'Free' : `${p.price} RON`}</span>
                        {p.price !== '0' && <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>/month</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button id="upgrade-plan-btn" className="btn-primary" style={{ marginTop:16 }}><CreditCard size={16}/> Confirm Plan</button>
            </div>
          )}

          {/* Notifications */}
          {tab === 'notifications' && (
            <div className="glass-card p-6 slide-in">
              <h2 style={{ fontFamily:'Space Grotesk', fontSize:'1.1rem', fontWeight:700, marginBottom:20 }}>Notification Preferences</h2>
              {[
                { key:'alerts',  label:'System Alerts',          desc:'Anomaly detection, electric spikes, sensor failures' },
                { key:'ai',      label:'AI Suggestions',         desc:'Schedule adaptations and smart recommendations' },
                { key:'energy',  label:'Energy Price Alerts',    desc:'When electricity prices change significantly' },
                { key:'health',  label:'Health Reminders',       desc:'Daily activity goals, sleep quality reports' },
              ].map(({ key, label, desc }) => (
                <div key={key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--border-glass)' }}>
                  <div>
                    <div style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-primary)' }}>{label}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:2 }}>{desc}</div>
                  </div>
                  <button
                    id={`notif-${key}`}
                    onClick={() => setNotifs(n => ({ ...n, [key]: !n[key] }))}
                    style={{ width:44, height:24, borderRadius:12, background: notifs[key] ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', position:'relative', transition:'background 0.3s ease', flexShrink:0 }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', background:'white', position:'absolute', top:3, left: notifs[key] ? 23 : 3, transition:'left 0.3s ease', boxShadow:'0 2px 4px rgba(0,0,0,0.3)' }}/>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

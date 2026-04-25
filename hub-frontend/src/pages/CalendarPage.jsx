import { useState, useEffect } from 'react';
import { Plus, X, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';

const COLORS = ['var(--accent-primary)','var(--accent-teal)','var(--accent-emerald)','var(--accent-amber)','var(--accent-rose)','#8b5cf6','#ec4899'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const DEMO_EVENTS = [
  { id: 101, title:'Doctor Appt',     date:'2026-04-28', time:'10:00', color:'var(--accent-emerald)', desc:'Annual checkup.' },
  { id: 102, title:'Project Deadline',date:'2026-04-30', time:'17:00', color:'var(--accent-amber)', desc:'Submit final report.' },
];

export default function CalendarPage() {
  const { schedule, markDone, removeScheduleItem } = useSchedule();
  
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents] = useState(DEMO_EVENTS);
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', date:'', time:'', desc:'', color: COLORS[0] });

  const [showModal, setShowModal] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_,i)=>i+1)];

  const todayStrReal = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const selectedStr = `${year}-${String(month+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`;
  
  // Get events for a specific day string — merges calendar events + dated schedule items
  const getEventsForDay = (dayStr) => {
    const list = events.filter(e => e.date === dayStr);
    // Show tagged schedule items on their target date (not just today)
    schedule
      .filter(s => (s.date || todayStrReal) === dayStr)
      .forEach(s => {
        list.push({ id: s.id, title: s.label, time: s.time, color: s.color, desc: 'Daily Routine', done: s.done, isGlobal: true });
      });
    return list.sort((a,b) => a.time.localeCompare(b.time));
  };

  const dayEvents = showModal ? getEventsForDay(selectedStr) : [];

  const addEvent = () => {
    if (!form.title || !form.date) return;
    setEvents(prev => [...prev, { ...form, id: Date.now() }]);
    setForm({ title:'', date:'', time:'', desc:'', color: COLORS[0] });
    setShowForm(false);
  };

  const deleteEvent = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    removeScheduleItem(id); // try global
  };

  const openDayModal = (day) => {
    setSelectedDay(day);
    setShowModal(true);
  };

  return (
    <div className="fade-in" style={{ maxWidth: 1400, height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24, flexShrink:0 }}>
        <div>
          <h1 className="section-title">Calendar & Schedule</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginTop:4 }}>AI-adaptive planning with your personal events</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-ghost" style={{ padding:'8px' }} onClick={() => setCurrentDate(new Date(year, month-1, 1))}>
            <ChevronLeft size={18}/>
          </button>
          <h2 style={{ fontFamily:'Space Grotesk', fontSize:'1.25rem', fontWeight:700, color:'var(--text-primary)', width: 180, textAlign: 'center' }}>
            {MONTHS[month]} {year}
          </h2>
          <button className="btn-ghost" style={{ padding:'8px' }} onClick={() => setCurrentDate(new Date(year, month+1, 1))}>
            <ChevronRight size={18}/>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', border: '1px solid var(--border-glass)' }}>
        
        {/* Days Header */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', borderBottom: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.2)' }}>
          {DAYS.map(d => (
            <div key={d} style={{ textAlign:'center', fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', padding:'12px 4px' }}>{d}</div>
          ))}
        </div>
        
        {/* Days Cells */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', flex: 1, gridAutoRows: '1fr' }}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} style={{ borderRight: '1px solid var(--border-glass)', borderBottom: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.01)' }}/>;
            
            const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
            const cellEvents = getEventsForDay(ds);
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

            return (
              <div
                key={day}
                className={`cal-grid-day ${isToday ? 'today' : ''}`}
                onClick={() => openDayModal(day)}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: isToday ? 'var(--accent-primary)' : 'var(--text-secondary)', marginBottom: 8 }}>
                  {day}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
                  {cellEvents.slice(0, 3).map(e => (
                    <div key={e.id} style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, background: `${e.color}15`, borderLeft: `2px solid ${e.color}`, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {e.time} {e.title}
                    </div>
                  ))}
                  {cellEvents.length > 3 && (
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', paddingLeft: 4 }}>+ {cellEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Events Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setShowModal(false); }}>
          <div className="modal-content fade-in" style={{ display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily:'Space Grotesk', fontSize:'1.25rem', fontWeight:700, color:'var(--text-primary)' }}>
                {MONTHS[month]} {selectedDay}, {year}
              </span>
              <button onClick={() => setShowModal(false)} className="btn-ghost" style={{ padding: 4 }}><X size={20}/></button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Agenda</span>
                <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem' }} onClick={() => { setShowModal(false); setShowForm(true); setForm(f => ({...f, date: selectedStr})); }}>
                  <Plus size={14}/> Add Event
                </button>
              </div>

              {dayEvents.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)', fontSize:'0.875rem' }}>
                  <div style={{ fontSize:'2rem', marginBottom:8 }}>📭</div>
                  No events mapped for this day.
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {dayEvents.map(e => (
                    <div key={e.id} style={{ padding:'12px 14px', borderRadius:12, background:'rgba(255,255,255,0.04)', border:`1px solid ${e.color}44`, borderLeft:`3px solid ${e.color}`, position:'relative', opacity: e.done ? 0.5 : 1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                          {e.isGlobal && (
                            <button onClick={() => markDone(e.id, !e.done)} style={{ background:'none', border:'none', cursor:'pointer', color: e.color, marginTop:2 }}>
                              <CheckCircle size={18} fill={e.done ? e.color : 'none'} fillOpacity={0.2} />
                            </button>
                          )}
                          <div>
                            <div style={{ fontSize:'0.9rem', fontWeight:600, color: e.done ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: e.done ? 'line-through' : 'none' }}>{e.title}</div>
                            <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginTop:2 }}>{e.time}</div>
                            {e.desc && <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:6 }}>{e.desc}</div>}
                          </div>
                        </div>
                        <button className="btn-ghost" style={{ padding:4, color:'var(--text-muted)' }} onClick={() => deleteEvent(e.id)}>
                          <X size={14}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setShowForm(false); }}>
          <div className="modal-content fade-in p-6">
            <h2 style={{ fontFamily:'Space Grotesk', fontSize:'1.1rem', fontWeight:700, marginBottom:20 }}>Create New Event</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:24 }}>
              <div>
                <label className="metric-label">Title</label>
                <input className="glass-input" placeholder="e.g. Doctor Appt" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div>
                  <label className="metric-label">Date</label>
                  <input type="date" className="glass-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} style={{ colorScheme: 'dark' }} />
                </div>
                <div>
                  <label className="metric-label">Time</label>
                  <input type="time" className="glass-input" value={form.time} onChange={e => setForm({...form, time: e.target.value})} style={{ colorScheme: 'dark' }} />
                </div>
              </div>
              <div>
                <label className="metric-label">Color Label</label>
                <div style={{ display:'flex', gap:8, marginTop:8 }}>
                  {COLORS.map(c => (
                    <div key={c} onClick={() => setForm({...form, color: c})} style={{ width:28, height:28, borderRadius:'50%', background:c, cursor:'pointer', border: form.color === c ? '3px solid white' : '2px solid transparent' }} />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:12 }}>
              <button className="btn-primary" style={{ flex:1 }} onClick={addEvent}><Plus size={16}/> Save Event</button>
              <button className="btn-ghost" style={{ padding:'8px 16px' }} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

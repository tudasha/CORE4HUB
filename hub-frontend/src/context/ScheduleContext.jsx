import { createContext, useContext, useState, useEffect } from 'react';

const ScheduleContext = createContext();

const getTodayStr = () => {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`;
};

export function ScheduleProvider({ children }) {
  const [schedule, setSchedule] = useState(() => {
    const todayStr = getTodayStr();
    return [
      { id: 1, time: '07:00', label: 'Morning jog',             color: 'var(--accent-emerald)',   done: true,  date: todayStr },
      { id: 2, time: '09:00', label: 'Team standup \u2013 WFH',      color: 'var(--accent-primary)',   done: true,  date: todayStr },
      { id: 3, time: '12:30', label: 'Lunch break',              color: 'var(--accent-amber)',     done: false, date: todayStr },
      { id: 4, time: '15:00', label: 'Focus work block',         color: 'var(--accent-secondary)', done: false, date: todayStr },
      { id: 5, time: '18:30', label: 'Gym session',              color: 'var(--accent-rose)',      done: false, date: todayStr },
      { id: 6, time: '22:30', label: 'Sleep preparation (AI)',   color: 'var(--accent-teal)',      done: false, date: todayStr },
    ];
  });

  const updateScheduleItem = (id, newProps) => {
    setSchedule(prev => prev.map(item => item.id === id ? { ...item, ...newProps } : item));
  };

  const addScheduleItem = (item) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    setSchedule(prev => [...prev, { ...item, id: Date.now(), date: item.date || todayStr }]);
  };

  const removeScheduleItem = (id) => {
    setSchedule(prev => prev.filter(item => item.id !== id));
  };

  const markDone = (id, done) => {
    updateScheduleItem(id, { done });
  };

  return (
    <ScheduleContext.Provider value={{
      schedule, setSchedule, updateScheduleItem, addScheduleItem, removeScheduleItem, markDone
    }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export const useSchedule = () => useContext(ScheduleContext);

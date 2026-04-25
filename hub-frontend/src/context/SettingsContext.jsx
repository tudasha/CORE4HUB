import { createContext, useContext, useState } from 'react';

const SettingsContext = createContext();

export const DEFAULT_MODULES = [
  { id:'weather',   icon:'🌤️', label:'Weather Station',    active:true },
  { id:'health',    icon:'❤️', label:'Health Wearable',    active:true },
  { id:'energy',    icon:'⚡', label:'Energy Monitor',     active:true },
  { id:'solar',     icon:'☀️', label:'Solar Panel Module', active:false },
  { id:'security',  icon:'📷', label:'Security Camera',    active:false },
  { id:'water',     icon:'💧', label:'Water Quality',      active:false },
];

export function SettingsProvider({ children }) {
  const [language, setLanguage] = useState('en-US'); // Options: 'en-US', 'ro-RO'
  const [voiceAutoSend, setVoiceAutoSend] = useState(false); // true: auto-send, false: manual check
  const [voiceEngine, setVoiceEngine] = useState(true); // TTS Reader toggle
  const [requireAiConfirmation, setRequireAiConfirmation] = useState(true); // Auto-apply AI suggestions
  const [modules, setModules] = useState(DEFAULT_MODULES);

  const toggleModule = (id) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, active: !m.active } : m));
  };

  return (
    <SettingsContext.Provider value={{
      language, setLanguage,
      voiceAutoSend, setVoiceAutoSend,
      voiceEngine, setVoiceEngine,
      requireAiConfirmation, setRequireAiConfirmation,
      modules, toggleModule
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);

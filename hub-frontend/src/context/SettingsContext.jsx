import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const DEFAULT_MODULES = [
  { id:'weather',   icon:'🌤️', label:'Weather Station',    active:true },
  { id:'health',    icon:'❤️', label:'Health Wearable',    active:true },
  { id:'energy',    icon:'⚡', label:'Energy Monitor',     active:true },
  { id:'indoor_climate', icon:'🌡️', label:'Temperature & Humidity Sensor', active:false },
  { id:'indoor_light',   icon:'💡', label:'Light Sensor',                  active:false },
  { id:'indoor_motion',  icon:'🏃', label:'Motion Sensor',                 active:false },
];

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const [language, setLanguage] = useState('en-US'); // Options: 'en-US', 'ro-RO'
  const [voiceAutoSend, setVoiceAutoSend] = useState(false); // true: auto-send, false: manual check
  const [voiceEngine, setVoiceEngine] = useState(true); // TTS Reader toggle
  const [requireAiConfirmation, setRequireAiConfirmation] = useState(true); // Auto-apply AI suggestions
  const [modules, setModules] = useState(DEFAULT_MODULES);

  useEffect(() => {
    if (user && user.modules && Array.isArray(user.modules)) {
      setModules(DEFAULT_MODULES.map(m => ({
        ...m,
        active: user.modules.includes(m.id)
      })));
    } else {
      setModules(DEFAULT_MODULES);
    }
  }, [user]);

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

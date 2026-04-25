import { createContext, useContext, useState } from 'react';

const DevicesContext = createContext();

const INITIAL_DEVICES = [
  { name: 'HVAC', icon: '❄️', watts: 1200, on: true },
  { name: 'Refrigerator', icon: '🧊', watts: 150, on: true },
  { name: 'Washing Machine', icon: '🫧', watts: 500, on: false },
  { name: 'EV Charger', icon: '🔋', watts: 3500, on: false },
  { name: 'Lighting', icon: '💡', watts: 80, on: true },
  { name: 'TV & Media', icon: '📺', watts: 100, on: true },
];

export function DevicesProvider({ children }) {
  const [devices, setDevices] = useState(INITIAL_DEVICES);

  const toggleDevice = (name, state) => {
    setDevices(prev => prev.map(d => 
      d.name === name ? { ...d, on: state !== undefined ? state : !d.on } : d
    ));
  };

  return (
    <DevicesContext.Provider value={{ devices, setDevices, toggleDevice }}>
      {children}
    </DevicesContext.Provider>
  );
}

export const useDevices = () => useContext(DevicesContext);

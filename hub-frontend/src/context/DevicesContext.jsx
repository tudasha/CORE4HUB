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
    let targetState = state;

    setDevices(prev => prev.map(d => {
      if (d.name === name) {
        targetState = state !== undefined ? state : !d.on;
        return { ...d, on: targetState };
      }
      return d;
    }));

    // Trigger physical LEDs locally
    if (name === 'Lighting') {
      // We expect the browser to fire a local HTTP GET to the Arduino.
      // Mode 'no-cors' prevents the browser from blocking the request due to CORS policies,
      // since we only care about sending the command, not reading the response.
      const url = targetState 
        ? 'http://192.168.1.50/?c=FF0042&b=250' 
        : 'http://192.168.1.50/?c=000000&b=0';

      fetch(url, { mode: 'no-cors' })
        .catch(err => console.error('Failed to communicate with Arduino at 192.168.1.50:', err));
    }
  };

  return (
    <DevicesContext.Provider value={{ devices, setDevices, toggleDevice }}>
      {children}
    </DevicesContext.Provider>
  );
}

export const useDevices = () => useContext(DevicesContext);

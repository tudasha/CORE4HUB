import { createContext, useContext, useState, useRef } from 'react';

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
  // Dynamic IP of the Arduino — updated whenever a WebSocket ARDUINO_UPDATE arrives
  const arduinoIpRef = useRef(null);

  const setArduinoIp = (ip) => { arduinoIpRef.current = ip; };

  const toggleDevice = (name, state) => {
    // Compute target state upfront from current devices snapshot
    const current = devices.find(d => d.name === name);
    const targetState = state !== undefined ? state : !current?.on;

    setDevices(prev => prev.map(d =>
      d.name === name ? { ...d, on: targetState } : d
    ));

    // Send LED command to Arduino when Lighting is toggled
    if (name === 'Lighting') {
      const ip = arduinoIpRef.current || '10.224.220.44';
      // Format: http://<ip>/?c=<hex_color>&b=<brightness>
      const url = targetState
        ? `http://${ip}/?c=FF0042&b=250`
        : `http://${ip}/?c=000000&b=0`;

      console.log(`[Lighting] → ${url}`);
      fetch(url, { mode: 'no-cors' })
        .catch(err => console.error(`[Lighting] Failed to reach ${ip}:`, err));
    }
  };

  return (
    <DevicesContext.Provider value={{ devices, setDevices, toggleDevice, setArduinoIp }}>
      {children}
    </DevicesContext.Provider>
  );
}

export const useDevices = () => useContext(DevicesContext);


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
    let targetState = state;

    setDevices(prev => prev.map(d => {
      if (d.name === name) {
        targetState = state !== undefined ? state : !d.on;
        return { ...d, on: targetState };
      }
      return d;
    }));

    // Trigger physical LEDs on the Arduino sender via its local IP
    if (name === 'Lighting') {
      // Use the IP received from the Arduino's POST payload (set via setArduinoIp).
      // Falls back to the known static IP if the device hasn't connected yet.
      const ip = arduinoIpRef.current || '10.224.220.44';
      const url = targetState
        ? `http://${ip}/?c=FF0042&b=250`
        : `http://${ip}/?c=000000&b=0`;

      console.log(`[Lighting] Sending LED command to ${ip}:`, url);
      fetch(url, { mode: 'no-cors' })
        .catch(err => console.error(`Failed to reach Arduino at ${ip}:`, err));
    }
  };

  return (
    <DevicesContext.Provider value={{ devices, setDevices, toggleDevice, setArduinoIp }}>
      {children}
    </DevicesContext.Provider>
  );
}

export const useDevices = () => useContext(DevicesContext);


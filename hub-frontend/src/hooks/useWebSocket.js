// Custom hook for WebSocket connection to backend for live sensor data
import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

export function useWebSocket() {
  const ws = useRef(null);
  const [sensorData, setSensorData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;
    try {
      ws.current = new WebSocket(WS_URL);
      ws.current.onopen = () => setConnected(true);
      ws.current.onclose = () => {
        setConnected(false);
        setTimeout(connect, 3000); // auto-reconnect
      };
      ws.current.onerror = () => ws.current?.close();
      ws.current.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'SENSOR_UPDATE') {
            // Merge only non-indoor fields so real Arduino data is never overwritten
            setSensorData(prev => ({
              ...prev,
              ...msg.data,
              // Preserve real Arduino indoor readings if we already have them
              ...(prev?.source === 'arduino' && {
                temperature:   prev.temperature,
                humidity:      prev.humidity,
                pressure:      prev.pressure,
                altitude:      prev.altitude,
                lightLevel:    prev.lightLevel,
                motionDetected: prev.motionDetected,
                arduinoIp:     prev.arduinoIp,
                source:        'arduino',
              }),
            }));
          }
          if (msg.type === 'ARDUINO_UPDATE') {
            // Real Arduino data — merge on top and mark source
            setSensorData(prev => ({
              ...prev,
              ...(msg.data.temperature !== null && { temperature: msg.data.temperature }),
              ...(msg.data.humidity    !== null && { humidity: msg.data.humidity }),
              ...(msg.data.pressure    !== null && { pressure: msg.data.pressure }),
              ...(msg.data.altitude    !== null && { altitude: msg.data.altitude }),
              ...(msg.data.lightLevel  !== null && { lightLevel: msg.data.lightLevel }),
              motionDetected: msg.data.motionDetected,
              arduinoIp:      msg.data.arduinoIp ?? prev?.arduinoIp,
              source: 'arduino',
            }));
          }
          if (msg.type === 'HEALTH_UPDATE' && msg.kind === 'steps') {
            setSensorData(prev => ({
              ...prev,
              steps: msg.data.steps,
              source: prev?.source || 'ws'
            }));
          }
          if (msg.type === 'ALERT') {
            setAlerts(prev => [{ ...msg, id: Date.now() }, ...prev].slice(0, 20));
          }
        } catch {}
      };
    } catch {
      setTimeout(connect, 3000);
    }
  }, []);

  useEffect(() => {
    connect();
    
    // Fetch initial steps on mount so AI assistant has them before any live updates arrive
    const fetchInitialSteps = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const api = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${api}/api/health/steps`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.history?.length) {
          const last = data.history[data.history.length - 1];
          setSensorData(prev => ({
            ...prev,
            steps: parseInt(last.steps)
          }));
        }
      } catch (e) {
        // silent fail
      }
    };
    fetchInitialSteps();
    
    return () => ws.current?.close();
  }, [connect]);

  const dismissAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  return { sensorData, alerts, connected, dismissAlert };
}

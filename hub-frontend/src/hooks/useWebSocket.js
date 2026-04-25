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
          if (msg.type === 'SENSOR_UPDATE') setSensorData(msg.data);
          if (msg.type === 'ARDUINO_UPDATE') {
            // Real Arduino data overrides the mock sensor values
            setSensorData(prev => ({
              ...prev,
              ...(msg.data.temperature !== null && { temperature: msg.data.temperature }),
              ...(msg.data.humidity    !== null && { humidity: msg.data.humidity }),
              ...(msg.data.pressure    !== null && { pressure: msg.data.pressure }),
              ...(msg.data.altitude    !== null && { altitude: msg.data.altitude }),
              ...(msg.data.lightLevel  !== null && { lightLevel: msg.data.lightLevel }),
              motionDetected: msg.data.motionDetected,
              source: 'arduino',
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
    return () => ws.current?.close();
  }, [connect]);

  const dismissAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  return { sensorData, alerts, connected, dismissAlert };
}

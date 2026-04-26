// Rolling 10-minute history of Arduino sensor data
import { useRef, useEffect, useState, useCallback } from 'react';

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const PRUNE_INTERVAL_MS = 30 * 1000; // prune every 30s

export function useSensorHistory(sensorData) {
  const historyRef = useRef([]); // [{ts, temperature, humidity, pressure, altitude, lightLevel, electricFlow}]
  const [snapshot, setSnapshot] = useState([]); // for rendering

  // Append a new data point whenever sensorData changes (only Arduino fields)
  useEffect(() => {
    if (!sensorData) return;

    // Only record if we have at least one useful value from Arduino
    const hasData = sensorData.temperature != null
      || sensorData.humidity != null
      || sensorData.electricFlow != null
      || sensorData.lightLevel != null;

    if (!hasData) return;

    const now = Date.now();
    const cutoff = now - WINDOW_MS;

    // Append new point
    historyRef.current.push({
      ts: now,
      temperature: sensorData.temperature ?? null,
      humidity: sensorData.humidity ?? null,
      pressure: sensorData.pressure ?? null,
      altitude: sensorData.altitude ?? null,
      lightLevel: sensorData.lightLevel ?? null,
      electricFlow: sensorData.electricFlow ?? null,
    });

    // Prune old points only when appending new data
    historyRef.current = historyRef.current.filter(p => p.ts >= cutoff);

    setSnapshot([...historyRef.current]);
  }, [sensorData]);

  // Periodic prune — only update snapshot if the array actually shrank
  useEffect(() => {
    const id = setInterval(() => {
      const cutoff = Date.now() - WINDOW_MS;
      const before = historyRef.current.length;
      const pruned = historyRef.current.filter(p => p.ts >= cutoff);

      // Only update state if entries were actually removed — avoids blank-screen re-renders
      if (pruned.length !== before) {
        historyRef.current = pruned;
        setSnapshot([...historyRef.current]);
      }
    }, PRUNE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    setSnapshot([]);
  }, []);

  return { history: snapshot, clearHistory };
}

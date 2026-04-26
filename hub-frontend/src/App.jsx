import { useEffect, useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AIAssistant from './pages/AIAssistant';
import Health from './pages/Health';
import Weather from './pages/Weather';
import Indoors from './pages/Indoors';
import CalendarPage from './pages/CalendarPage';
import Energy from './pages/Energy';
import Community from './pages/Community';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import { useWebSocket } from './hooks/useWebSocket';
import { useAuth } from './context/AuthContext';
import { useSettings } from './context/SettingsContext';
import { useDevices } from './context/DevicesContext';
import { Loader, Lock } from 'lucide-react';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'var(--bg-primary)' }}>
        <Loader className="animate-spin" size={32} color="var(--accent-primary)" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function ModuleRoute({ moduleId, moduleIds, children }) {
  const { modules } = useSettings();
  
  const idsToCheck = moduleIds || (moduleId ? [moduleId] : []);
  const active = idsToCheck.some(id => modules.find(m => m.id === id)?.active);
  
  if (!active) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:16, color:'var(--text-muted)' }}>
      <Lock size={48} style={{ opacity:0.3 }} />
      <div style={{ fontSize:'1.1rem', fontWeight:600 }}>Module not unlocked</div>
      <div style={{ fontSize:'0.875rem', opacity:0.6 }}>Purchase this sensor package on the SmartEnv website to activate this page.</div>
    </div>
  );
  return children;
}

function MainLayout() {
  const { sensorData: wsSensorData, alerts, connected, dismissAlert } = useWebSocket();
  const { devices, toggleDevice, setArduinoIp } = useDevices();
  const [sensorData, setSensorData] = useState(null); // null = waiting for Arduino, persists after first update
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (wsSensorData) {
      setSensorData(wsSensorData);
      // Store the sender IP so LED commands can reach the correct Arduino
      if (wsSensorData.arduinoIp) setArduinoIp(wsSensorData.arduinoIp);
    }
    // No mock fallback — data persists from last Arduino transmission
  }, [wsSensorData]);

  // Auto-shutoff Ventilator only when humidity *drops* below 40%
  const prevHumRef = useRef(null);
  useEffect(() => {
    const currentHum = sensorData?.humidity;
    if (currentHum === undefined || currentHum === null) return;

    const prevHum = prevHumRef.current;
    const fan = devices.find(d => d.name === 'Ventilator');

    // If fan is ON, and humidity WAS >= 40, and NOW is < 40 -> Turn Off
    if (fan?.on && prevHum >= 40 && currentHum < 40) {
      console.log('Humidity dropped below 40%. Auto-shutting off Ventilator.');
      toggleDevice('Ventilator', false);
    }

    prevHumRef.current = currentHum;
  }, [sensorData?.humidity, devices, toggleDevice]);

  return (
    <>
      <div className="app-bg" />
      <Sidebar connected={connected} />
      <main className={`main-content ${collapsed ? 'expanded' : ''}`}>
        <Routes>
          <Route path="/"          element={<Dashboard sensorData={sensorData} alerts={alerts} dismissAlert={dismissAlert} connected={connected} />} />
          <Route path="/indoors"   element={<ModuleRoute moduleIds={['indoor_climate', 'indoor_light', 'indoor_motion']}><Indoors sensorData={sensorData} /></ModuleRoute>} />
          <Route path="/assistant" element={<AIAssistant sensorData={sensorData} />} />
          <Route path="/health"    element={<ModuleRoute moduleId="health"><Health sensorData={sensorData} /></ModuleRoute>} />
          <Route path="/weather"   element={<ModuleRoute moduleId="weather"><Weather /></ModuleRoute>} />
          <Route path="/calendar"  element={<CalendarPage />} />
          <Route path="/energy"    element={<ModuleRoute moduleId="energy"><Energy sensorData={sensorData} /></ModuleRoute>} />
          <Route path="/community" element={<Community />} />
          <Route path="/settings"  element={<Settings />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

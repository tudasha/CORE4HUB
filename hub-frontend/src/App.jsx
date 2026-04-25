import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AIAssistant from './pages/AIAssistant';
import Health from './pages/Health';
import Weather from './pages/Weather';
import CalendarPage from './pages/CalendarPage';
import Energy from './pages/Energy';
import Community from './pages/Community';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import { useWebSocket } from './hooks/useWebSocket';
import { mockSensors } from './utils/mockData';
import { useAuth } from './context/AuthContext';
import { Loader } from 'lucide-react';

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

function MainLayout() {
  const { sensorData: wsSensorData, alerts, connected, dismissAlert } = useWebSocket();
  const [sensorData, setSensorData] = useState(mockSensors());
  const [collapsed, setCollapsed] = useState(false); // To implement collapse in Sidebar if needed

  useEffect(() => {
    if (wsSensorData) { setSensorData(wsSensorData); return; }
    const interval = setInterval(() => setSensorData(mockSensors()), 3000);
    return () => clearInterval(interval);
  }, [wsSensorData]);

  return (
    <>
      <div className="app-bg" />
      <Sidebar connected={connected} />
      <main className={`main-content ${collapsed ? 'expanded' : ''}`}>
        <Routes>
          <Route path="/"          element={<Dashboard sensorData={sensorData} alerts={alerts} dismissAlert={dismissAlert} connected={connected} />} />
          <Route path="/assistant" element={<AIAssistant sensorData={sensorData} />} />
          <Route path="/health"    element={<Health sensorData={sensorData} />} />
          <Route path="/weather"   element={<Weather />} />
          <Route path="/calendar"  element={<CalendarPage />} />
          <Route path="/energy"    element={<Energy sensorData={sensorData} />} />
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

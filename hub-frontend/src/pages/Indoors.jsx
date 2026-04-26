import { useSettings } from '../context/SettingsContext';
import { Thermometer, Droplets, Gauge, Lightbulb, Activity, Wind } from 'lucide-react';

function StatCard({ icon: Icon, label, value, unit, color, pulse = false }) {
  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '12px', 
            background: `${color}15`, color: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <Icon size={20} className={pulse ? "pulse" : ""} />
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-secondary)' }}>{label}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>
          {value}
        </span>
        <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>{unit}</span>
      </div>
    </div>
  );
}

export default function Indoors({ sensorData }) {
  const { modules } = useSettings();
  const hasClimate = modules.find(m => m.id === 'indoor_climate')?.active;
  const hasLight = modules.find(m => m.id === 'indoor_light')?.active;
  const hasMotion = modules.find(m => m.id === 'indoor_motion')?.active;

  const sd = sensorData || {};
  const isArduino = sd.source === 'arduino';

  return (
    <div className="fade-in" style={{ maxWidth: 1200 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="section-title">Indoor Environment</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
          Live data directly from your Arduino sensors.
        </p>
      </div>

      {!isArduino && (
        <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 24, borderLeft: '4px solid var(--accent-amber)', background: 'rgba(245, 158, 11, 0.05)' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--accent-amber)', fontWeight: 600 }}>Waiting for Arduino connection...</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>Showing mock data. Make sure your Arduino is powered on and connected to Wi-Fi.</div>
        </div>
      )}

      {hasClimate && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 16, color: 'var(--text-primary)' }}>Climate & Atmosphere</h2>
          <div className="dashboard-grid">
            <StatCard icon={Thermometer} label="Temperature" value={sd.temperature ?? '--'} unit="°C" color="var(--accent-amber)" />
            <StatCard icon={Droplets} label="Humidity" value={sd.humidity ?? '--'} unit="%" color="var(--accent-teal)" />
            <StatCard icon={Gauge} label="Pressure" value={sd.pressure ?? '--'} unit="hPa" color="var(--accent-primary)" />
            <StatCard icon={Wind} label="Altitude" value={sd.altitude ?? '--'} unit="m" color="var(--accent-secondary)" />
          </div>
        </div>
      )}

      {(hasLight || hasMotion) && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 16, color: 'var(--text-primary)' }}>Security & Ambience</h2>
          <div className="dashboard-grid">
            {hasLight && (
              <StatCard icon={Lightbulb} label="Light Level" value={sd.lightLevel ?? '--'} unit="lux" color="#eab308" pulse={sd.lightLevel > 500} />
            )}
            {hasMotion && (
              <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px', background: sd.motionDetected ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-glass)' }}>
                <div style={{ width: 64, height: 64, borderRadius: 32, background: sd.motionDetected ? 'var(--accent-rose)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
                  <Activity size={32} color={sd.motionDetected ? '#fff' : 'var(--text-muted)'} className={sd.motionDetected ? 'pulse' : ''} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: sd.motionDetected ? 'var(--accent-rose)' : 'var(--text-secondary)' }}>
                    {sd.motionDetected ? 'Motion Detected!' : 'All Clear'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    {sd.motionDetected ? 'Movement currently detected by the sensor.' : 'No movement detected.'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

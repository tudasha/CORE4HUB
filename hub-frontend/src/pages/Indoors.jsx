import { useSettings } from '../context/SettingsContext';
import { Thermometer, Gauge, Lightbulb, Activity } from 'lucide-react';

function StatCard({ icon: Icon, label, value, unit, color }) {
  return (
    <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px',
          background: `${color}15`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={20} />
        </div>
        <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>
          {value ?? '--'}
        </span>
        <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '500' }}>{unit}</span>
      </div>
    </div>
  );
}

export default function Indoors({ sensorData }) {
  const { modules } = useSettings();
  const hasClimate = modules.find(m => m.id === 'indoor_climate')?.active;
  const hasLight   = modules.find(m => m.id === 'indoor_light')?.active;
  const hasMotion  = modules.find(m => m.id === 'indoor_motion')?.active;

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
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Make sure your Arduino is powered on and connected to Wi-Fi. Data updates every 10–20 seconds.
          </div>
        </div>
      )}

      {/* Temp + Pressure + Light Intensity — all 3 come from the same Arduino */}
      {(hasClimate || hasLight) && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 16, color: 'var(--text-primary)' }}>Climate & Atmosphere</h2>
          <div className="dashboard-grid">
            {hasClimate && (
              <>
                <StatCard icon={Thermometer} label="Temperature"    value={sd.temperature} unit="°C"  color="var(--accent-amber)" />
                <StatCard icon={Gauge}       label="Pressure"       value={sd.pressure}    unit="hPa" color="var(--accent-primary)" />
              </>
            )}
            {hasLight && (
              <StatCard icon={Lightbulb} label="Light Intensity" value={sd.lightLevel} unit="lux" color="#eab308" />
            )}
          </div>
        </div>
      )}

      {/* Motion Sensor */}
      {hasMotion && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: 16, color: 'var(--text-primary)' }}>Security</h2>
          <div className="dashboard-grid">
            <div className="glass-card" style={{
              padding: '24px', display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center', gap: '16px',
              background: sd.motionDetected ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-glass)'
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 32,
                background: sd.motionDetected ? 'var(--accent-rose)' : 'rgba(255,255,255,0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s'
              }}>
                <Activity size={32} color={sd.motionDetected ? '#fff' : 'var(--text-muted)'} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: sd.motionDetected ? 'var(--accent-rose)' : 'var(--text-secondary)' }}>
                  {sd.motionDetected ? 'Motion Detected!' : 'All Clear'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  {sd.motionDetected ? 'Movement currently detected.' : 'No movement detected.'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

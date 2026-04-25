import { useState } from 'react';
import { useWeather, useTransit } from '../hooks/useWeather';
import { RefreshCw, Wind, Droplets, Thermometer, Sun, Loader } from 'lucide-react';

function AqiBadge({ aqi }) {
  const levels = [
    [1, 1, 'Good',      'var(--accent-emerald)'],
    [2, 2, 'Fair',      'var(--accent-teal)'],
    [3, 3, 'Moderate',  'var(--accent-amber)'],
    [4, 4, 'Poor',      'var(--accent-rose)'],
    [5, 5, 'Hazardous', '#ef4444'],
  ];
  const [,,label,color] = levels.find(([lo,hi]) => aqi >= lo && aqi <= hi) || levels[0];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:20, background:`${color}22`, border:`1px solid ${color}44`, color, fontSize:'0.8rem', fontWeight:600 }}>
      AQI Level {aqi} — {label}
    </span>
  );
}

export default function Weather() {
  const { data: weather, loading: weatherLoading, error: weatherError } = useWeather();
  const { transitInfo: traffic } = useTransit();

  if (weatherLoading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'50vh', color:'var(--text-muted)' }}>
        <Loader className="animate-spin" size={32} style={{ marginRight:12 }}/> Loading Live OpenWeather Data...
      </div>
    );
  }

  if (weatherError) {
    return (
      <div className="glass-card p-6 alert-danger" style={{ maxWidth: 600 }}>
        Error loading weather: {weatherError}
        <br/><br/>
        <small>Please ensure your VITE_OPENWEATHER_API_KEY is correct in the backend .env file.</small>
      </div>
    );
  }

  // Helper mappings
  const getWeatherIcon = (condition) => {
    switch(condition) {
      case 'Clear': return '☀️';
      case 'Clouds': return '☁️';
      case 'Rain': return '🌧️';
      case 'Snow': return '❄️';
      case 'Thunderstorm': return '⛈️';
      default: return '⛅';
    }
  }

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="fade-in" style={{ maxWidth:1400 }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 className="section-title">Weather & Environment</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem', marginTop:4 }}>
            📍 Cluj-Napoca · Live Data
          </p>
        </div>
      </div>

      {/* Hero Current Weather */}
      <div className="glass-card glass-card-glow p-8" style={{ marginBottom:20, background:'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(99,102,241,0.08) 100%)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:24 }}>
            <span className="weather-icon">{getWeatherIcon(weather.condition)}</span>
            <div>
              <div style={{ fontFamily:'Space Grotesk', fontSize:'5rem', fontWeight:800, color:'var(--text-primary)', lineHeight:1, letterSpacing:'-0.04em' }}>
                {weather.temp}°
              </div>
              <div style={{ fontSize:'1.25rem', color:'var(--text-secondary)', fontWeight:500 }}>{weather.condition}</div>
              <div style={{ fontSize:'0.875rem', color:'var(--text-muted)', marginTop:4, textTransform:'capitalize' }}>{weather.desc}</div>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {[
              { icon: Droplets,    label:'Humidity',  value:`${weather.humidity}%`,       color:'var(--accent-teal)' },
              { icon: Wind,        label:'Wind',      value:`${weather.wind} km/h`,        color:'var(--accent-secondary)' },
              { icon: Thermometer, label:'Pressure',  value:`1012 hPa`,    color:'var(--accent-amber)' }, // Mocked or extract from API if desired
              { icon: Sun,         label:'UV Index',  value:'Moderate',              color:'#eab308' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:12, background:'rgba(255,255,255,0.04)', border:'1px solid var(--border-glass)' }}>
                <Icon size={18} color={color}/>
                <div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase' }}>{label}</div>
                  <div style={{ fontSize:'0.95rem', fontWeight:700, color:'var(--text-primary)' }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5-Day Forecast */}
      <div className="glass-card p-6" style={{ marginBottom:20 }}>
        <div style={{ marginBottom:16 }}>
          <span style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)' }}>📅 5-Day Forecast</span>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:16 }}>
          {(weather.forecast || []).map((d, i) => {
            const dayName = d.date ? days[new Date(d.date + 'T12:00:00').getDay()] : '---';
            return (
              <div key={i} style={{ textAlign:'center', padding:'16px 8px', borderRadius:12, background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-glass)' }}>
                <div style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--text-muted)', marginBottom:8, textTransform:'uppercase' }}>
                  {dayName}
                </div>
                <div style={{ fontSize:'2rem', marginBottom:8 }}>{getWeatherIcon(d.condition)}</div>
                <div style={{ fontSize:'0.875rem', fontWeight:700, color:'var(--text-primary)' }}>{d.temp}°</div>
                <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{d.feelsLike}° feels</div>
                {d.pop > 0 && (
                  <div style={{ fontSize:'0.72rem', color:'var(--accent-teal)', marginTop:4 }}>💧 {d.pop}%</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AQI + Traffic Row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Air Quality */}
        <div className="glass-card p-6">
          <div style={{ marginBottom:14 }}>
            <span style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)' }}>🌬️ Air Quality (Live)</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
            <div style={{ fontFamily:'Space Grotesk', fontSize:'3.5rem', fontWeight:800, color:'var(--accent-emerald)', lineHeight:1 }}>
              {weather.aqi}
            </div>
            <div>
              <AqiBadge aqi={weather.aqi}/>
              <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:6 }}>PM2.5: {weather.pollutants.pm2_5} µg/m³</div>
            </div>
          </div>
          {[
            { label:'PM2.5', value: weather.pollutants.pm2_5, max:50, color:'var(--accent-rose)' },
            { label:'PM10',  value: weather.pollutants.pm10, max:100, color:'var(--accent-amber)' },
            { label:'NO₂',   value: weather.pollutants.no2, max:200, color:'var(--accent-teal)' },
          ].map(({ label, value, max, color }) => (
            <div key={label} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize:'0.78rem', color, fontWeight:600 }}>{value}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width:`${Math.min((value/max)*100,100)}%`, background:`linear-gradient(90deg, ${color}, ${color}88)` }}/>
              </div>
            </div>
          ))}
        </div>

        {/* Traffic / Transit */}
        <div className="glass-card p-6">
          <div style={{ marginBottom:14 }}>
            <span style={{ fontSize:'0.8rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-secondary)' }}>🚍 Live Transit – Tranzy Cluj</span>
          </div>
          {!traffic ? (
             <div style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>Synching transit data...</div>
          ) : (
            <>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
                <div style={{ fontFamily:'Space Grotesk', fontSize:'3.5rem', fontWeight:800, color:'var(--accent-teal)', lineHeight:1 }}>
                  {traffic.routes?.length || 0}<span style={{ fontSize:'1.5rem' }}>🚌</span>
                </div>
                <div>
                  <span className={`alert-badge ${traffic.level === 'Running' ? 'alert-success' : 'alert-info'}`}>{traffic.level}</span>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:6 }}>Active transit paths relative to you</div>
                </div>
              </div>
              {traffic.routes?.map((r, i) => (
                <div key={i} style={{ padding:'12px 16px', borderRadius:10, background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-glass)', marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'0.825rem', color:'var(--text-secondary)' }}>{r.name}</span>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'0.875rem' }}>{r.duration} min</span>
                    <span className={`alert-badge ${r.traffic==='Delayed'?'alert-warning':r.traffic==='On Time'?'alert-success':'alert-info'}`} style={{ padding:'2px 8px', fontSize:'0.65rem' }}>{r.traffic}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';

export function useWeather(city = 'Cluj-Napoca') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/weather?city=${city}`);
        const result = await res.json();
        
        if (!res.ok) throw new Error(result.error || 'Failed to fetch weather');

        // Build a clean 5-day forecast (one entry per day at ~noon)
        const rawForecast = result.forecast.list;
        const forecastByDay = {};
        rawForecast.forEach(entry => {
          const dateKey = entry.dt_txt.split(' ')[0]; // "YYYY-MM-DD"
          const hour = parseInt(entry.dt_txt.split(' ')[1]);
          // Prefer midday entry (12:00) as representative
          if (!forecastByDay[dateKey] || Math.abs(hour - 12) < Math.abs(parseInt(forecastByDay[dateKey].dt_txt?.split(' ')[1] || '0') - 12)) {
            forecastByDay[dateKey] = entry;
          }
        });
        const forecast5Day = Object.entries(forecastByDay).slice(0, 5).map(([date, e]) => ({
          date,
          temp: Math.round(e.main.temp),
          feelsLike: Math.round(e.main.feels_like),
          condition: e.weather[0].main,
          desc: e.weather[0].description,
          humidity: e.main.humidity,
          wind: e.wind.speed,
          pop: Math.round((e.pop || 0) * 100), // probability of precipitation %
          icon: e.weather[0].icon,
        }));

        setData({
          temp: Math.round(result.weather.main.temp),
          condition: result.weather.weather[0].main,
          desc: result.weather.weather[0].description,
          humidity: result.weather.main.humidity,
          wind: result.weather.wind.speed,
          aqi: result.airQuality.list[0].main.aqi,
          pollutants: result.airQuality.list[0].components,
          forecast: forecast5Day,
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city]);

  return { data, loading, error };
}

export function useTransit() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    async function fetchTransit() {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/transit/live`);
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (e) {
        console.error("Transit fetch error", e);
      }
    }
    fetchTransit();
    const interval = setInterval(fetchTransit, 60000);
    return () => clearInterval(interval);
  }, []);

  return { transitInfo: data };
}

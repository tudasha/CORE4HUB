// Mock data generators for sensors and APIs (used when real data is unavailable)
export function mockWeather() {
  const conditions = [
    { icon: '⛅', label: 'Partly Cloudy', temp: 17 },
    { icon: '☀️', label: 'Sunny', temp: 23 },
    { icon: '🌧️', label: 'Rainy', temp: 12 },
    { icon: '⛈️', label: 'Thunderstorm', temp: 10 },
    { icon: '🌤️', label: 'Mostly Clear', temp: 20 },
  ];
  const c = conditions[Math.floor(Math.random() * conditions.length)];
  return {
    ...c,
    humidity: Math.floor(40 + Math.random() * 40),
    wind: (5 + Math.random() * 20).toFixed(1),
    pressure: (1010 + Math.random() * 20).toFixed(0),
    uvIndex: (Math.random() * 10).toFixed(1),
    feelsLike: c.temp - 2 + Math.floor(Math.random() * 4),
    forecast: [
      { day: 'Mon', icon: '☀️', high: 22, low: 14 },
      { day: 'Tue', icon: '🌧️', high: 15, low: 10 },
      { day: 'Wed', icon: '⛅', high: 18, low: 12 },
      { day: 'Thu', icon: '☀️', high: 24, low: 16 },
      { day: 'Fri', icon: '🌤️', high: 21, low: 14 },
    ],
    airQuality: { index: Math.floor(30 + Math.random() * 70), label: 'Good', pm25: (5 + Math.random() * 15).toFixed(1) },
    location: 'Cluj-Napoca, RO',
  };
}

export function mockSensors() {
  return {
    temperature: +(18 + Math.random() * 10).toFixed(1),
    humidity: +(45 + Math.random() * 35).toFixed(1),
    airQuality: Math.floor(30 + Math.random() * 70),
    electricFlow: +(1 + Math.random() * 4).toFixed(2),
    heartRate: Math.floor(60 + Math.random() * 40),
    oxygenLevel: +(96.5 + Math.random() * 2.5).toFixed(1),
    steps: Math.floor(2000 + Math.random() * 10000),
    uvIndex: +(Math.random() * 10).toFixed(1),
    waterQuality: Math.floor(72 + Math.random() * 25),
    solarOutput: +(Math.random() * 5.2).toFixed(2),
    energyCost: +(0.5 + Math.random() * 3).toFixed(2), // RON
    monthlyEnergy: +(40 + Math.random() * 60).toFixed(1) // kWh
  };
}

export function mockTraffic() {
  const levels = ['Light', 'Moderate', 'Heavy', 'Severe'];
  return {
    level: levels[Math.floor(Math.random() * levels.length)],
    travelTime: Math.floor(10 + Math.random() * 40),
    incidents: Math.floor(Math.random() * 5),
    routes: [
      { name: 'Via Calea Florești', duration: Math.floor(12 + Math.random() * 20), traffic: 'Moderate' },
      { name: 'Via Calea Turzii', duration: Math.floor(15 + Math.random() * 25), traffic: 'Light' },
      { name: 'Via Strada Memorandumului', duration: Math.floor(8 + Math.random() * 18), traffic: 'Heavy' },
    ],
  };
}

export function mockHealth() {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  return {
    heartRate: Math.floor(62 + Math.random() * 30),
    oxygen: +(97 + Math.random() * 2).toFixed(1),
    steps: Math.floor(4000 + Math.random() * 8000),
    stepsGoal: 10000,
    sleepHours: +(6 + Math.random() * 3).toFixed(1),
    sleepQuality: Math.floor(60 + Math.random() * 40),
    calories: Math.floor(1400 + Math.random() * 800),
    calorieGoal: 2200,
    weeklySteps: days.map(d => ({ day: d, steps: Math.floor(3000 + Math.random() * 9000) })),
    weeklyHeart: days.map(d => ({ day: d, bpm: Math.floor(58 + Math.random() * 35) })),
    macros: {
      protein: Math.floor(60 + Math.random() * 60),
      carbs: Math.floor(120 + Math.random() * 100),
      fat: Math.floor(40 + Math.random() * 40),
    },
    meals: [
      { time: '08:00', name: 'Oatmeal & Berries', calories: 320, icon: '🥣' },
      { time: '12:30', name: 'Grilled Chicken Salad', calories: 480, icon: '🥗' },
      { time: '16:00', name: 'Greek Yogurt', calories: 140, icon: '🍦' },
      { time: '19:30', name: 'Pasta & Veggies', calories: 560, icon: '🍝' },
    ],
  };
}

export function mockEnergy() {
  const hours = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    consumption: +(0.2 + Math.random() * 2.5).toFixed(2),
    price: +(0.65 + Math.random() * 0.4).toFixed(3), // RON/kWh
  }));

  return {
    totalTodayKwh: +(hours.reduce((s, h) => s + h.consumption, 0)).toFixed(1),
    totalTodayCost: +(hours.reduce((s, h) => s + h.consumption * h.price, 0)).toFixed(2),
    solarProduced: +(Math.random() * 8).toFixed(2),
    solarForecast: 'High solar production expected (Sunny day)',
    priceNow: +(0.65 + Math.random() * 0.4).toFixed(3),
    priceForecast: 'Prices expected to rise 12% this weekend',
    uvIndex: +(Math.random() * 10).toFixed(1),
    hourly: hours,
    devices: [
      { name: 'HVAC', icon: '❄️', watts: Math.floor(800 + Math.random() * 1200), on: true },
      { name: 'Refrigerator', icon: '🧊', watts: Math.floor(100 + Math.random() * 100), on: true },
      { name: 'Washing Machine', icon: '🫧', watts: Math.floor(400 + Math.random() * 600), on: false },
      { name: 'EV Charger', icon: '🔋', watts: Math.floor(3000 + Math.random() * 4000), on: false },
      { name: 'Lighting', icon: '💡', watts: Math.floor(60 + Math.random() * 100), on: true },
      { name: 'TV & Media', icon: '📺', watts: Math.floor(80 + Math.random() * 120), on: true },
    ],
  };
}

export const AI_SUGGESTIONS = [
  {
    id: 1, type: 'action',
    message: 'Sleep quality was 68% last night. Recommend closing bedroom window at 22:30 tonight to improve temperature.',
    action: 'Close Window', requiresApproval: true,
    scheduleAction: { time: '22:30', label: 'Close bedroom window', color: 'var(--accent-teal)' }
  },
  {
    id: 2, type: 'action',
    message: 'Heavy rain expected at 17:00. Rescheduling your evening jog to 16:00 would avoid the storm.',
    action: 'Reschedule Jog', requiresApproval: true,
    scheduleAction: { time: '16:00', label: 'Evening Jog (Rescheduled by AI)', color: 'var(--accent-primary)' }
  },
  {
    id: 3, type: 'action',
    message: 'Morning commute traffic is severe on usual route. Suggest leaving 15 min earlier.',
    action: 'Adjust Alarm', requiresApproval: true,
    scheduleAction: { time: '07:45', label: 'Commute (Leaving Early)', color: 'var(--accent-amber)' }
  },
];

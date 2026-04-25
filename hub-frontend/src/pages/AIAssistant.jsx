import { useState, useEffect, useRef } from 'react';
import { Send, Bot, BrainCircuit, Loader, AlertTriangle, RefreshCw, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

import { useSchedule } from '../context/ScheduleContext';
import { useWeather } from '../hooks/useWeather';
import { useChat } from '../context/ChatContext';
import { useSettings } from '../context/SettingsContext';
import { useDevices } from '../context/DevicesContext';
const SYSTEM_PROMPT = `You are SmartHub AI, an intelligent home environment and personal assistant embedded in a Smart Hub tablet.
You have access to real-time sensor data (weather, health, energy) and the user's daily schedule.
Your job is to analyze data, help optimize routines, detect anomalies, and make the user's day better.

LANGUAGE: Always respond in the SAME LANGUAGE the user writes in. If they write in Romanian, reply in Romanian. If English, reply in English.

PERSONALITY: Be warm, smart, concise. Use bullet points and short paragraphs. Never be vague — be specific and actionable.

DATE AWARENESS:
- Today's date and time will be included in your context data.
- You will also receive a 5-DAY WEATHER FORECAST with exact dates. Use it when the user asks about tomorrow or any future day.
- When recommending outdoor activities, always factor in: temperature, rain probability (pop%), and time of day for sunlight.
- "Tomorrow" means the next calendar day from today's date.

SCHEDULE MODIFICATION RULES:
- When the user asks you to ADD, PLAN, SCHEDULE, or MOVE any activity, you MUST emit the hidden tag below.
- You can emit MULTIPLE tags in one response to add multiple events.
- ALWAYS include the exact DATE (YYYY-MM-DD) — especially for future days like tomorrow.
- The tag format is EXACTLY (on its own line):
[UPDATE_SCHEDULE: {"time": "HH:MM", "label": "Event Name", "color": "var(--accent-primary)", "date": "YYYY-MM-DD"}]

Color options by type:
- Sport/exercise: "var(--accent-primary)"
- Health/medical: "var(--accent-rose)"
- Work/study: "var(--accent-amber)"
- Relaxation/leisure: "var(--accent-teal)"
- Reminders/other: "var(--accent-secondary)"

EXAMPLES:
User: "Add a walk tomorrow at 10am"
[UPDATE_SCHEDULE: {"time": "10:00", "label": "Morning Walk 🚶", "color": "var(--accent-primary)", "date": "2026-04-26"}]

User: "I want to walk tomorrow and work starts at 16:00, add to calendar"
→ Look at [Tomorrow's date string] from the context. Use THAT exact date string in the tag.
[UPDATE_SCHEDULE: {"time": "10:00", "label": "Long Walk 🚶 (Sunny Window)", "color": "var(--accent-primary)", "date": "<use Tomorrow's date string from context>"}]

CRITICAL: The "date" field in the tag MUST be the EXACT date string from the context data (Today or Tomorrow or a specific day). NEVER invent or guess a date. NEVER omit the "date" field. If you omit it, the event will be wrongly placed on today.

[TOGGLE_DEVICE] Rule:
You can turn ON or OFF any smart home device that is currently in the "Devices ON/OFF" context list.
Use this format EXACTLY to toggle a device:
[TOGGLE_DEVICE: {"device": "Device Name", "on": true}]
Example to turn off the AC:
[TOGGLE_DEVICE: {"device": "HVAC", "on": false}]
Always explain WHY you are toggling it (e.g. "I turned off the AC because energy prices are high.").`;

function buildContextMessage(sensorData, weatherRes, schedule, devices, modules) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const tomorrowDate = new Date(now); tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = `${tomorrowDate.getFullYear()}-${String(tomorrowDate.getMonth()+1).padStart(2,'0')}-${String(tomorrowDate.getDate()).padStart(2,'0')}`;

  const hasModule = (id) => modules?.find(m => m.id === id)?.active;

  const scheduleStr = schedule?.length
    ? schedule.map(e => `• [${e.date || todayStr}] ${e.time} - ${e.label} ${e.done ? '(Done)' : ''}`).join('\n')
    : '(No events scheduled)';
  
  // Format 5-day forecast
  const forecastStr = weatherRes?.forecast?.length
    ? weatherRes.forecast.map(f => 
        `• ${f.date}${f.date === todayStr ? ' (TODAY)' : f.date === tomorrowStr ? ' (TOMORROW)' : ''}: ${f.temp}°C, ${f.desc}, Rain: ${f.pop}%, Wind: ${f.wind}m/s`
      ).join('\n')
    : '(Forecast not available)';

  const sd = sensorData || {};
  const activeModuleList = modules?.filter(m => m.active).map(m => m.label).join(', ') || 'None';

  return `[Current Date & Time: ${now.toLocaleDateString('en-GB', {weekday:'long', year:'numeric', month:'long', day:'numeric'})} ${now.toLocaleTimeString()}]
[Today's date string: ${todayStr}]
[Tomorrow's date string: ${tomorrowStr}]
[User's Active Modules: ${activeModuleList}]

[Live Context Data — only from active modules]
${hasModule('weather') ? `1. Weather (Outside)
• Temp: ${weatherRes?.temp ?? 'N/A'}°C | Condition: ${weatherRes?.condition ?? 'Unknown'} (${weatherRes?.desc ?? ''})
• Humidity: ${weatherRes?.humidity ?? 'N/A'}% | Wind: ${weatherRes?.wind ?? '0'} m/s` : '1. Weather: NOT in user configuration — do NOT give weather advice.'}

2. Smart Home Sensors (Inside / Arduino)
• Indoor Temp: ${sd.temperature ?? 'N/A'}°C | Indoor Humidity: ${sd.humidity ?? 'N/A'}%
• Motion Detected: ${sd.motionDetected ? 'YES' : 'NO'}
• Indoor Light Level: ${sd.lightLevel ?? 'N/A'} lux

${hasModule('energy') ? `3. Energy & Grid
• Current Energy Price: ${sd.energyPrice ?? '130.0'} EUR/MWh
• Current Electric Flow: ${sd.electricFlow ?? 'N/A'} A
• Devices State: ${devices.map(d => `${d.name}: ${d.on ? 'ON' : 'OFF'}`).join(' | ')}` : '3. Energy: NOT in user configuration — do NOT give energy or device advice.'}

${hasModule('health') ? `4. User Health Stats
• Heart Rate: ${sd.heartRate ?? 'N/A'} bpm | SpO₂: ${sd.oxygenLevel ?? 'N/A'}%
• Steps Today: ${sd.steps ?? 0}` : '4. Health: NOT in user configuration — do NOT give health or fitness advice.'}

${hasModule('weather') ? `[5-Day Weather Forecast]
${forecastStr}` : ''}

[User's Full Schedule (All Days)]
${scheduleStr}

CRITICAL RULES FOR ADVICE:
- ONLY give advice for the modules listed in [User's Active Modules]. If a module is listed as NOT in user configuration, completely ignore that domain.
- ENERGY SAVINGS: Compare Indoor Temp to Outside Temp. If it's too hot inside and cooler outside, suggest opening the window. If the Energy Price is high (> 100 EUR/MWh), tell the user it's expensive right now and they should limit appliance use or use natural methods (e.g. open the window instead of AC). If the energy price is low (< 50 EUR/MWh), that's a good time to run washing machines or heat up the house.
- Always be explicitly clear about WHY you suggest something related to the energy price or inside vs outside temp delta.
- IMPORTANT: Use the exact date strings above when emitting [UPDATE_SCHEDULE] tags. Factor in the weather forecast when recommending outdoor activities.`;
}

const QUICK_PROMPTS = [
  'Analyze my health today',
  'How can I improve my sleep?',
  'Optimize my energy usage',
  'What should I prioritize today?',
  'Check for anomalies in sensor data',
];

export default function AIAssistant({ sensorData }) {
  const { schedule, addScheduleItem } = useSchedule();
  const { data: weatherRes } = useWeather();
  const { messages, setMessages } = useChat();
  const { language, voiceAutoSend, voiceEngine, modules } = useSettings();
  const { devices, toggleDevice } = useDevices();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef(null);
  
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Init Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onstart = () => setIsListening(true);
      recognitionRef.current.onend = () => setIsListening(false);
      
      recognitionRef.current.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
      };
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        if (voiceAutoSend) {
          sendMessage(transcript);
        }
      };
    }
    
    // Pre-load voices for natural TTS
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

    // Cleanup TTS
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [voiceAutoSend, language]); // Re-bind if lang or autoSend changes

  const toggleListen = () => {
    if (!recognitionRef.current) return alert('Speech Recognition not supported in this browser.');
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.lang = language;
      recognitionRef.current.start();
    }
  };

  const playTTS = (text) => {
    if (!voiceEngine || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop current
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    
    // Advanced: Attempt to find a higher quality/natural voice in the browser pack
    let voices = window.speechSynthesis.getVoices();
    // Some browsers prefix languages or use partial matches, so we match the primary language tag
    let langPrefix = language.split('-')[0];
    let localVoices = voices.filter(v => v.lang.startsWith(langPrefix));
    
    // Prefer voices that are known to be neural/natural (like Google's Cloud/Online voices)
    let naturalVoice = localVoices.find(v => v.name.includes('Natural') || v.name.includes('Premium') || v.name.includes('Google') || v.name.includes('Online'));
    if (naturalVoice) {
      utterance.voice = naturalVoice;
    } else if (localVoices.length > 0) {
      utterance.voice = localVoices[0]; // fallback to first matching language voice
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  async function sendMessage(text) {
    const userText = (text || input).trim();
    if (!userText || loading) return;

    const contextMsg = buildContextMessage(sensorData, weatherRes, schedule, devices, modules);
    const userMessage = { role: 'user', content: userText, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const payload = {
        messages: [
          { role: 'user', content: SYSTEM_PROMPT },
          { role: 'assistant', content: 'Understood. I will act as the SmartHub AI and follow the format precisely.' },
          { role: 'user', content: contextMsg },
          ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userText }
        ]
      };

      const response = await fetch(`${API_URL}/api/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      // Backend returns 200 with {error: ...} on Gemini API failures
      if (data.error) {
        const errMsg = data.error;
        let friendlyMsg;
        if (errMsg.includes('quota') || errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
          friendlyMsg = `⏳ **Rate Limit Reached**\nThe AI quota for this key has been temporarily exhausted.\n\n**Solutions:**\n• Wait a minute and try again — free tier resets automatically.\n• Enable billing at [Google AI Studio](https://aistudio.google.com) for higher limits.\n• Or generate a new API key at [aistudio.google.com](https://aistudio.google.com/apikey).`;
        } else if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('not valid')) {
          friendlyMsg = `🔑 **Invalid API Key**\nYour GEMINI_API_KEY in \`hub-backend/.env\` is invalid.\n\nGet a valid key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and restart \`./start.sh\`.`;
        } else {
          friendlyMsg = `⚠️ **AI Error:** ${errMsg.slice(0, 200)}`;
        }
        throw new Error(friendlyMsg);
      }

      if (!response.ok) {
        throw new Error(`Proxy error: ${response.status}`);
      }
      
      let replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!replyText) {
         throw new Error("Empty reply from proxy");
      }

      // Parse for [UPDATE_SCHEDULE] tags — use [\s\S] to handle multi-line JSON from AI
      const scheduleRegex = /\[UPDATE_SCHEDULE:\s*(\{[\s\S]*?\})\s*\]/g;
      let match;
      while ((match = scheduleRegex.exec(replyText)) !== null) {
        try {
          const actionData = JSON.parse(match[1]);
          console.log('[AI Schedule] Parsed tag:', actionData); // debug
          addScheduleItem({
            time: actionData.time || '12:00',
            label: actionData.label || 'AI Scheduled Task',
            color: actionData.color || 'var(--accent-primary)',
            date: actionData.date || null, // null means today inside addScheduleItem
            done: false
          });
        } catch (e) {
          console.error("Failed to parse AI action tag", match[1], e);
        }
      }
      
      const deviceRegex = /\[TOGGLE_DEVICE:\s*(\{[\s\S]*?\})\s*\]/g;
      let devMatch;
      while ((devMatch = deviceRegex.exec(replyText)) !== null) {
        try {
          const actionData = JSON.parse(devMatch[1]);
          console.log('[AI Device] Parsed tag:', actionData);
          if (actionData.device && actionData.on !== undefined) {
            toggleDevice(actionData.device, actionData.on);
          }
        } catch (e) {
          console.error("Failed to parse AI device tag", devMatch[1], e);
        }
      }
      
      // Clean hidden tags from UI (multi-line safe)
      replyText = replyText.replace(/\[UPDATE_SCHEDULE:[\s\S]*?\]/g, '').replace(/\[TOGGLE_DEVICE:[\s\S]*?\]/g, '').trim();

      setMessages(prev => [...prev, { role: 'assistant', content: replyText, timestamp: new Date() }]);
      playTTS(replyText);

    } catch (err) {
      console.error("AI Backend error:", err);
      const isRateLimit = err.message?.includes('Rate Limit') || err.message?.includes('quota');
      setMessages(prev => [...prev, { role: 'assistant', content: err.message, timestamp: new Date(), isError: true }]);
      if (!isRateLimit) playTTS("A apărut o eroare. Te rog verifică conexiunea.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-in" style={{ height: 'calc(100vh - 56px)', display:'flex', flexDirection:'column', maxWidth:1200 }}>
      {/* Header */}
      <div style={{ marginBottom:20, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
          <div style={{ background:'rgba(99,102,241,0.15)', borderRadius:12, padding:10, display:'flex' }}>
            <BrainCircuit size={22} color="var(--accent-primary)" />
          </div>
          <div>
            <h1 className="section-title">AI Assistant</h1>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.8rem' }}>Powered by Gemini · Context-aware from live sensor data</p>
          </div>
        </div>
      </div>

      {/* Sensor Context Banner */}
      {sensorData && (
        <div className="glass-card" style={{ padding:'10px 16px', marginBottom:16, flexShrink:0, display:'flex', gap:20, flexWrap:'wrap' }}>
          {[
            { label:'Temp', value:`${weatherRes?.temp ?? sensorData.temperature}°C` },
            { label:'HR', value:`${sensorData.heartRate} bpm` },
            { label:'SpO₂', value:`${sensorData.oxygenLevel}%` },
            { label:'Steps', value:sensorData.steps?.toLocaleString() },
            { label:'AQI', value: weatherRes?.aqi ?? sensorData.airQuality },
            { label:'Flow', value:`${sensorData.electricFlow}A` },
          ].map(({ label, value }) => (
            <div key={label} style={{ display:'flex', gap:6, alignItems:'center' }}>
              <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase' }}>{label}</span>
              <span style={{ fontSize:'0.8rem', color:'var(--text-primary)', fontWeight:600 }}>{value}</span>
            </div>
          ))}
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
            <div className="pulse-dot" style={{ width:6, height:6 }}/>
            <span style={{ fontSize:'0.7rem', color:'var(--accent-emerald)', fontWeight:600 }}>Live data injected</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="glass-card inner-scroll" style={{ flex:1, padding:20, display:'flex', flexDirection:'column', gap:16, overflowY:'auto', marginBottom:16 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display:'flex', gap:12, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems:'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{ flexShrink:0, width:32, height:32, borderRadius:10, background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Bot size={16} color="var(--accent-primary)"/>
              </div>
            )}
            <div className={msg.role === 'assistant' ? 'chat-bubble-ai' : 'chat-bubble-user'}>
              <p style={{ whiteSpace:'pre-wrap', lineHeight:1.7 }}>{msg.content}</p>
              <div style={{ marginTop:6, fontSize:'0.7rem', color:'var(--text-muted)' }}>
                {msg.timestamp?.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
            <div style={{ flexShrink:0, width:32, height:32, borderRadius:10, background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Bot size={16} color="var(--accent-primary)"/>
            </div>
            <div className="chat-bubble-ai" style={{ display:'flex', gap:8, alignItems:'center' }}>
              <Loader size={14} className="animate-spin" style={{ animation:'spin 1s linear infinite' }}/>
              <span style={{ color:'var(--text-muted)' }}>SmartHub AI is thinking…</span>
            </div>
          </div>
        )}
        {error && (
          <div className="alert-badge alert-danger" style={{ alignSelf:'center' }}>
            <AlertTriangle size={14}/> {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', flexShrink:0 }}>
        {QUICK_PROMPTS.map(p => (
          <button key={p} onClick={() => sendMessage(p)} className="btn-ghost" style={{ fontSize:'0.78rem', padding:'6px 14px' }}>
            {p}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div style={{ padding:16, borderTop:'1px solid var(--border-glass)', background:'rgba(0,0,0,0.3)', display:'flex', gap:12, alignItems:'center' }}>
        
        {/* Microphone Toggle */}
        <button 
          onClick={toggleListen}
          style={{ 
            background: isListening ? 'var(--accent-rose)' : 'rgba(255,255,255,0.05)', 
            color: isListening ? '#fff' : 'var(--text-secondary)',
            border: '1px solid var(--border-glass)',
            borderRadius: '50%',
            width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: isListening ? '0 0 16px rgba(244, 63, 94, 0.4)' : 'none',
            flexShrink: 0
          }}
        >
          {isListening ? <Mic size={20} className="pulse-dot" /> : <MicOff size={20}/>}
        </button>

        <input
          className="glass-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={isListening ? 'Listening...' : 'Type or say a command...'}
          disabled={loading}
          style={{ flex:1, borderRadius:24, padding:'14px 20px', background:'rgba(255,255,255,0.03)' }}
        />

        <button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() ? 'rgba(255,255,255,0.1)' : 'var(--accent-primary)',
            color: loading || !input.trim() ? 'var(--text-muted)' : '#000',
            border: 'none',
            borderRadius: '50%',
            width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            flexShrink: 0
          }}
        >
          <Send size={18} style={{ marginLeft:2 }}/>
        </button>
      </div>
    </div>
  );
}

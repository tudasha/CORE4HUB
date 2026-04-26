import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ScheduleProvider } from './context/ScheduleContext'
import { ChatProvider } from './context/ChatContext'
import { SettingsProvider } from './context/SettingsContext'
import { DevicesProvider } from './context/DevicesContext'

// ── Global Error Boundary — prevents blank white screen on any render crash ──
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary] Caught render error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', background: '#0d0f18',
          color: '#fff', gap: 16, padding: 32, textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>Something went wrong</div>
          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', maxWidth: 480 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </div>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{
              marginTop: 8, padding: '10px 24px', borderRadius: 10,
              background: '#6366f1', border: 'none', color: '#fff',
              fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
            }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SettingsProvider>
            <DevicesProvider>
              <ScheduleProvider>
                <ChatProvider>
                  <App />
                </ChatProvider>
              </ScheduleProvider>
            </DevicesProvider>
          </SettingsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)

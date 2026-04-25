import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, AlertTriangle, Loader } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await register(name, email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Registration failed. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', width:'100vw', background:'var(--bg-primary)', position:'relative' }}>
      <div className="app-bg" style={{ position:'absolute', inset:0, zIndex:0 }}/>
      
      <div className="glass-card fade-in" style={{ width:'100%', maxWidth:420, padding:40, position:'relative', zIndex:10, border:'1px solid var(--border-glass-hover)' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div className="sidebar-logo" style={{ fontSize:'2rem', marginBottom:8 }}>SmartHub</div>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>Create your account to start managing your smart home.</p>
        </div>

        {error && (
          <div className="alert-badge alert-danger" style={{ width:'100%', marginBottom:24, justifyContent:'center' }}>
            <AlertTriangle size={14}/> {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div>
            <label style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, display:'block' }}>Full Name</label>
            <input 
              type="text" 
              required
              className="glass-input" 
              placeholder="Alex Popescu"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, display:'block' }}>Email Address</label>
            <input 
              type="email" 
              required
              className="glass-input" 
              placeholder="alex.popescu@smarthub.app"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, display:'block' }}>Password</label>
            <input 
              type="password" 
              required
              className="glass-input" 
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={isLoading} style={{ width:'100%', justifyContent:'center', padding:'12px', marginTop:8 }}>
            {isLoading ? <Loader size={18} className="animate-spin" style={{ animation:'spin 1s linear infinite' }}/> : <UserPlus size={18}/>}
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:24, fontSize:'0.875rem', color:'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ color:'var(--accent-primary)', textDecoration:'none', fontWeight:600 }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}

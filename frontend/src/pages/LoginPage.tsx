import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      await login(username, password);
      navigate('/admin');
    } catch (err: any) {
      setError(err.error?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-lg overflow-hidden border border-border">
        <div className="px-8 pt-8 pb-6 text-center border-b border-border">
          <h1 className="text-2xl font-bold text-foreground mb-2">Admin Login</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage channels</p>
        </div>
        
        <form onSubmit={handleSubmit} className="px-8 py-8">
          {error && (
            <div className="mb-6 p-3 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm">
              {error}
            </div>
          )}
          
          <div className="mb-5">
            <label htmlFor="username" className="block mb-2 text-sm font-semibold text-foreground">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
              autoFocus
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block mb-2 text-sm font-semibold text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}




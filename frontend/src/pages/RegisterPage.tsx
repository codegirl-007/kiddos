import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (username.length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (!dateOfBirth) {
      setError('Date of birth is required');
      return;
    }
    
    // Validate age on frontend as well
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    
    let actualAge = age;
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      actualAge--;
    }
    
    if (actualAge < 18) {
      setError('You must be at least 18 years old to register');
      return;
    }
    
    setLoading(true);
    
    try {
      const { authApi } = await import('../services/apiClient');
      await authApi.register(username, password, dateOfBirth);
      
      // Registration endpoint returns tokens and user data, same as login
      // Use login function to set user and token in auth context
      // This ensures consistent state management
      await login(username, password);
      
      // Navigate to home page
      navigate('/');
    } catch (err: any) {
      setError(err.error?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex items-start justify-center bg-background px-4 pt-12 pb-8">
      <div className="w-full max-w-md bg-card rounded-3xl shadow-lg overflow-hidden border border-border">
        <div className="px-8 pt-8 pb-6 text-center border-b border-border">
          <h1 className="text-2xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-sm text-muted-foreground">Sign up to get started</p>
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
              minLength={3}
              maxLength={50}
              autoFocus
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-muted-foreground">Must be at least 3 characters</p>
          </div>
          
          <div className="mb-5">
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
              minLength={8}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-muted-foreground">Must be at least 8 characters</p>
          </div>
          
          <div className="mb-5">
            <label htmlFor="confirmPassword" className="block mb-2 text-sm font-semibold text-foreground">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              minLength={8}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="dateOfBirth" className="block mb-2 text-sm font-semibold text-foreground">
              Date of Birth
            </label>
            <input
              id="dateOfBirth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              disabled={loading}
              required
              max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
            />
            <p className="mt-1 text-xs text-muted-foreground">You must be at least 18 years old to register</p>
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md mb-4"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Have an account?{' '}
              <Link 
                to="/login" 
                className="text-primary hover:underline font-semibold"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

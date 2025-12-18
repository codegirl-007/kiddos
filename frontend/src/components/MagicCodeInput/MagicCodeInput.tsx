import { useState } from 'react';
import { applyMagicCode, clearMagicCode, getAppliedMagicCode, getMagicCodeSettings } from '../../services/magicCodeService';

interface MagicCodeInputProps {
  onApplied?: () => void;
  onClose?: () => void;
}

export function MagicCodeInput({ onApplied, onClose }: MagicCodeInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const appliedCode = getAppliedMagicCode();
  const settings = getMagicCodeSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const normalizedCode = code.toUpperCase().trim();
    
    if (!normalizedCode || normalizedCode.length === 0) {
      setError('Please enter a magic code');
      return;
    }

    if (normalizedCode.length > 7) {
      setError('Magic code must be 7 characters or less');
      return;
    }

    try {
      setLoading(true);
      await applyMagicCode(normalizedCode);
      setSuccess(true);
      setCode('');
      
      if (onApplied) {
        onApplied();
      }
      
      // Auto-close after showing success message
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);
    } catch (err: any) {
      setError(err.error?.message || 'Invalid magic code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    clearMagicCode();
    setCode('');
    setError(null);
    setSuccess(false);
    if (onApplied) {
      onApplied();
    }
  };


  return (
    <div className="bg-card rounded-xl p-6 border border-border max-w-md w-full">
      <h2 className="text-xl font-bold text-foreground mb-2">Enter Magic Code</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Ask your parent for a magic code to apply settings
      </p>

      {appliedCode && settings && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm font-semibold text-green-800 mb-1">✓ Settings Applied</p>
          <p className="text-xs text-green-700">
            Code: <strong>{appliedCode}</strong>
          </p>
          <button
            onClick={handleClear}
            className="mt-2 text-xs text-green-700 hover:underline"
          >
            Clear settings
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="magic-code" className="block text-sm font-semibold text-foreground mb-2">
            Magic Code
          </label>
          <input
            id="magic-code"
            type="text"
            value={code}
            onChange={(e) => {
              const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
              setCode(value);
              setError(null);
            }}
            placeholder="ABC1234"
            maxLength={7}
            className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground text-center text-2xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
          <p className="text-xs text-muted-foreground mt-1 text-center">
            Enter up to 7 characters
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            ✓ Settings applied successfully!
          </div>
        )}

        <div className="flex gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !code.trim()}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Applying...' : 'Apply Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}

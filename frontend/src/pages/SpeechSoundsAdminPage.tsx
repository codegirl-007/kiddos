import { useState } from 'react';
import { WordGroupManager } from '../components/WordGroupManager/WordGroupManager';
import { Link } from 'react-router-dom';
import { speechSoundsApi } from '../services/apiClient';

export function SpeechSoundsAdminPage() {
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheMessage, setCacheMessage] = useState<string | null>(null);

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear all cached pronunciations? Words will regenerate with new settings on next play.')) {
      return;
    }

    try {
      setClearingCache(true);
      setCacheMessage(null);
      await speechSoundsApi.clearPronunciationsCache();
      setCacheMessage('Pronunciation cache cleared successfully!');
      setTimeout(() => setCacheMessage(null), 3000);
    } catch (err: any) {
      setCacheMessage(err.error?.message || 'Failed to clear cache');
      setTimeout(() => setCacheMessage(null), 5000);
    } finally {
      setClearingCache(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-background">
      <div className="bg-card border-b border-border py-8 px-6 text-center">
        <Link 
          to="/admin" 
          className="inline-block mb-4 px-4 py-2 bg-transparent border border-border rounded-md text-foreground text-sm cursor-pointer transition-colors no-underline hover:bg-muted"
        >
          ← Back to Admin
        </Link>
        <h1 className="m-0 mb-2 text-[28px] font-medium text-foreground">Speech Sounds - Word Groups</h1>
        <p className="m-0 text-sm text-muted-foreground">Manage word groups for speech sound practice</p>
      </div>
      <div className="max-w-[1200px] mx-auto p-6">
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleClearCache}
            disabled={clearingCache}
            className="px-4 py-2 bg-[#ef4444] text-white rounded-full font-semibold text-sm hover:bg-[#dc2626] transition-all active:scale-95 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {clearingCache ? 'Clearing...' : 'Clear Pronunciation Cache'}
          </button>
        </div>
        {cacheMessage && (
          <div className={`mb-4 p-4 rounded-lg border ${
            cacheMessage.includes('successfully') 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-destructive/10 border-destructive/20 text-destructive'
          }`}>
            {cacheMessage}
          </div>
        )}
        <WordGroupManager />
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { settingsProfilesApi } from '../services/apiClient';
import { SettingsProfile } from '../types/api';
import { APPS } from '../config/apps';

export function SettingsProfilesAdminPage() {
  const [profiles, setProfiles] = useState<SettingsProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SettingsProfile | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response: any = await settingsProfilesApi.getAll();
      setProfiles(response.data);
    } catch (err: any) {
      setError(err.error?.message || 'Failed to load Magic Codes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (profileId: number) => {
    if (!confirm('Are you sure you want to delete this magic code? The magic code will no longer work.')) {
      return;
    }

    try {
      await settingsProfilesApi.delete(profileId);
      await loadProfiles();
    } catch (err: any) {
      alert(err.error?.message || 'Failed to delete magic code');
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      alert('Magic code copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Magic code copied to clipboard!');
    }
  };

  const handleRegenerateCode = async (profileId: number) => {
    if (!confirm('Are you sure you want to regenerate the magic code? The old code will stop working.')) {
      return;
    }

    try {
      const response: any = await settingsProfilesApi.regenerateCode(profileId);
      await loadProfiles();
      alert(`New magic code: ${response.data.magicCode}`);
    } catch (err: any) {
      alert(err.error?.message || 'Failed to regenerate code');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (minutes: number | null) => {
    if (!minutes) return 'Not set';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-60px)] bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading magic codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-60px)] bg-background">
      <div className="bg-card border-b border-border py-8 px-6 text-center">
        <Link 
          to="/admin" 
          className="inline-block mb-4 px-4 py-2 bg-transparent border border-border rounded-md text-foreground text-sm cursor-pointer transition-colors no-underline hover:bg-muted"
        >
          ← Back to Admin
        </Link>
        <h1 className="m-0 mb-2 text-[28px] font-medium text-foreground">Magic Codes</h1>
        <p className="m-0 text-sm text-muted-foreground">Create magic codes to manage settings for children</p>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-semibold text-sm hover:bg-primary/90 transition-all active:scale-95 shadow-md"
          >
            + Create Profile
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
          </div>
        )}

        {profiles.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-12 text-center">
            <p className="text-muted-foreground mb-4">No magic codes yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-semibold text-sm hover:bg-primary/90 transition-all active:scale-95 shadow-md"
            >
              Create Your First Magic Code
            </button>
          </div>
        ) : (
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Magic Code</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Time Limit</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Enabled Apps</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-foreground uppercase">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{profile.name}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-muted rounded font-mono text-sm font-bold">
                          {profile.magicCode}
                        </code>
                        <button
                          onClick={() => handleCopyCode(profile.magicCode)}
                          className="text-xs text-primary hover:underline"
                          title="Copy code"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatTime(profile.dailyTimeLimit)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {profile.enabledApps && profile.enabledApps.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {profile.enabledApps.map(appId => {
                            const app = APPS.find(a => a.id === appId);
                            return app ? (
                              <span key={appId} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                                {app.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">All apps</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        profile.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {profile.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(profile.createdAt)}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingProfile(profile)}
                          className="px-3 py-1 text-xs font-semibold text-foreground hover:bg-muted rounded-full transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRegenerateCode(profile.id)}
                          className="px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10 rounded-full transition-colors"
                        >
                          Regenerate
                        </button>
                        <button
                          onClick={() => handleDelete(profile.id)}
                          className="px-3 py-1 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <SettingsProfileFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadProfiles();
          }}
        />
      )}

      {editingProfile && (
        <SettingsProfileFormModal
          profile={editingProfile}
          onClose={() => setEditingProfile(null)}
          onSuccess={() => {
            setEditingProfile(null);
            loadProfiles();
          }}
        />
      )}
    </div>
  );
}

function SettingsProfileFormModal({ 
  profile, 
  onClose, 
  onSuccess 
}: { 
  profile?: SettingsProfile; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [name, setName] = useState(profile?.name || '');
  const [description, setDescription] = useState(profile?.description || '');
  const [dailyTimeLimit, setDailyTimeLimit] = useState(profile?.dailyTimeLimit?.toString() || '30');
  const [enabledApps, setEnabledApps] = useState<string[]>(profile?.enabledApps || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleApp = (appId: string) => {
    setEnabledApps(prev => 
      prev.includes(appId) 
        ? prev.filter(id => id !== appId)
        : [...prev, appId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    const limit = parseInt(dailyTimeLimit, 10);
    if (isNaN(limit) || limit < 1) {
      setError('Daily time limit must be at least 1 minute');
      return;
    }

    try {
      setLoading(true);
      if (profile) {
        // Update existing profile
        await settingsProfilesApi.update(profile.id, { name, description });
        await settingsProfilesApi.updateSettings(profile.id, { dailyTimeLimit: limit, enabledApps });
      } else {
        // Create new profile
        await settingsProfilesApi.create({ name, description, dailyTimeLimit: limit, enabledApps });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.error?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg border border-border max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">
          {profile ? 'Edit Magic Code' : 'Create Magic Code'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-foreground mb-2">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Emma's iPad"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-foreground mb-2">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., For daily use"
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-foreground mb-2">
              Daily Time Limit (minutes) *
            </label>
            <input
              type="number"
              min="1"
              value={dailyTimeLimit}
              onChange={(e) => setDailyTimeLimit(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum minutes per day children can watch videos
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-foreground mb-2">
              Enabled Apps
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              Select which apps children can access. Leave all unchecked to allow all apps (including videos).
            </p>
            <div className="space-y-2">
              {APPS.filter(app => !app.disabled).map(app => (
                <label
                  key={app.id}
                  className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-muted/50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={enabledApps.includes(app.id)}
                    onChange={() => toggleApp(app.id)}
                    className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                  <span className="text-sm text-foreground font-medium">{app.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{app.description}</span>
                </label>
              ))}
            </div>
            {enabledApps.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                All apps will be enabled (including videos)
              </p>
            )}
          </div>

          {profile && (
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Magic Code
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-background border border-border rounded-lg font-mono text-lg font-bold text-center">
                  {profile.magicCode}
                </code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(profile.magicCode);
                    alert('Code copied!');
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Share this code with your child to apply these settings
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-full font-semibold text-sm hover:bg-primary/90 transition-all active:scale-95 shadow-md disabled:opacity-50"
            >
              {loading ? 'Saving...' : profile ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

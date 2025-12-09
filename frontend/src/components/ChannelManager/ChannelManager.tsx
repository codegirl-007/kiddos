import { useState } from 'react';
import { useChannels } from '../../hooks/useChannels';

export function ChannelManager() {
  const { channels, loading, error, addChannel, removeChannel } = useChannels();
  const [channelInput, setChannelInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);
  
  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelInput.trim()) return;
    
    setAdding(true);
    setAddError(null);
    setAddSuccess(null);
    
    try {
      const result = await addChannel(channelInput.trim());
      setAddSuccess(`Added ${result.channel.name} with ${result.videosFetched} videos`);
      setChannelInput('');
    } catch (err: any) {
      setAddError(err.error?.message || 'Failed to add channel');
    } finally {
      setAdding(false);
    }
  };
  
  const handleRemoveChannel = async (channelId: string, channelName: string) => {
    if (!confirm(`Are you sure you want to remove ${channelName}?`)) return;
    
    try {
      await removeChannel(channelId);
    } catch (err: any) {
      alert('Failed to remove channel: ' + (err.error?.message || 'Unknown error'));
    }
  };
  
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };
  
  return (
    <div className="w-full p-6 bg-card rounded-xl border border-border">
      <h2 className="m-0 mb-6 text-2xl font-medium text-foreground">Channel Management</h2>
      
      <form onSubmit={handleAddChannel} className="flex gap-3 mb-6 md:flex-row flex-col">
        <input
          type="text"
          placeholder="Enter channel ID, @handle, or YouTube URL..."
          value={channelInput}
          onChange={(e) => setChannelInput(e.target.value)}
          disabled={adding}
          className="flex-1 px-4 py-3 border border-border rounded-md text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
        />
        <button 
          type="submit" 
          disabled={adding || !channelInput.trim()} 
          className="px-6 py-3 bg-primary text-primary-foreground border-none rounded-md text-sm font-medium cursor-pointer whitespace-nowrap transition-all hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {adding ? 'Adding...' : 'Add Channel'}
        </button>
      </form>
      
      {addError && (
        <div className="px-4 py-3 rounded-md mb-4 text-sm bg-red-50 text-red-800 border border-red-200">
          {addError}
        </div>
      )}
      {addSuccess && (
        <div className="px-4 py-3 rounded-md mb-4 text-sm bg-green-50 text-green-800 border border-green-200">
          {addSuccess}
        </div>
      )}
      
      {loading && <p className="text-foreground">Loading channels...</p>}
      {error && (
        <div className="px-4 py-3 rounded-md mb-4 text-sm bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
      )}
      
      {!loading && channels.length === 0 && (
        <p className="text-center py-12 px-6 text-muted-foreground text-sm">
          No channels added yet. Add your first channel above!
        </p>
      )}
      
      {channels.length > 0 && (
        <div className="flex flex-col gap-4">
          {channels.map(channel => (
            <div 
              key={channel.id} 
              className="flex items-center gap-4 p-4 bg-muted rounded-lg border border-border md:flex-row flex-col md:items-center items-start"
            >
              <img 
                src={channel.thumbnailUrl} 
                alt={channel.name}
                className="w-20 h-20 md:w-20 md:h-20 w-15 h-15 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="m-0 mb-1 text-base font-medium text-foreground">{channel.name}</h3>
                <p className="m-0 mb-1 text-sm text-muted-foreground">
                  {formatNumber(channel.subscriberCount)} subscribers • {channel.videoCount} videos
                </p>
                {channel.lastFetchedAt && (
                  <p className="m-0 text-xs text-muted-foreground/70">
                    Last updated: {new Date(channel.lastFetchedAt).toLocaleString()}
                  </p>
                )}
                {channel.fetchError && (
                  <p className="m-0 text-xs text-red-600">Error: {channel.fetchError}</p>
                )}
              </div>
              <button
                onClick={() => handleRemoveChannel(channel.id, channel.name)}
                className="px-4 py-2 bg-card text-red-600 border border-red-600 rounded-md text-sm font-medium cursor-pointer whitespace-nowrap transition-all hover:bg-red-600 hover:text-white md:self-auto self-end"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

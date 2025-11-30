import { useState } from 'react';
import { useChannels } from '../../hooks/useChannels';
import './ChannelManager.css';

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
    <div className="channel-manager">
      <h2>Channel Management</h2>
      
      <form onSubmit={handleAddChannel} className="add-channel-form">
        <input
          type="text"
          placeholder="Enter channel ID, @handle, or YouTube URL..."
          value={channelInput}
          onChange={(e) => setChannelInput(e.target.value)}
          disabled={adding}
          className="channel-input"
        />
        <button type="submit" disabled={adding || !channelInput.trim()} className="add-button">
          {adding ? 'Adding...' : 'Add Channel'}
        </button>
      </form>
      
      {addError && <div className="alert alert-error">{addError}</div>}
      {addSuccess && <div className="alert alert-success">{addSuccess}</div>}
      
      {loading && <p>Loading channels...</p>}
      {error && <div className="alert alert-error">{error}</div>}
      
      {!loading && channels.length === 0 && (
        <p className="empty-message">No channels added yet. Add your first channel above!</p>
      )}
      
      {channels.length > 0 && (
        <div className="channels-list">
          {channels.map(channel => (
            <div key={channel.id} className="channel-item">
              <img 
                src={channel.thumbnailUrl} 
                alt={channel.name}
                className="channel-thumbnail"
              />
              <div className="channel-info">
                <h3 className="channel-name">{channel.name}</h3>
                <p className="channel-stats">
                  {formatNumber(channel.subscriberCount)} subscribers • {channel.videoCount} videos
                </p>
                {channel.lastFetchedAt && (
                  <p className="channel-meta">
                    Last updated: {new Date(channel.lastFetchedAt).toLocaleString()}
                  </p>
                )}
                {channel.fetchError && (
                  <p className="channel-error">Error: {channel.fetchError}</p>
                )}
              </div>
              <button
                onClick={() => handleRemoveChannel(channel.id, channel.name)}
                className="remove-button"
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



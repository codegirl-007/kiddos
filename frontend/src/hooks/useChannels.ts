import { useState, useEffect } from 'react';
import { channelsApi } from '../services/apiClient';
import { Channel } from '../types/api';

export function useChannels() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchChannels = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response: any = await channelsApi.getAll();
      const sortedChannels = [...response.data.channels].sort((a: Channel, b: Channel) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      setChannels(sortedChannels);
    } catch (err: any) {
      setError(err.error?.message || 'Failed to fetch channels');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchChannels();
  }, []);
  
  const addChannel = async (channelInput: string) => {
    const response: any = await channelsApi.add(channelInput);
    await fetchChannels(); // Refresh list
    return response.data;
  };
  
  const removeChannel = async (channelId: string) => {
    await channelsApi.remove(channelId);
    await fetchChannels(); // Refresh list
  };
  
  const refreshChannel = async (channelId: string) => {
    const response: any = await channelsApi.refresh(channelId);
    await fetchChannels(); // Refresh list
    return response.data;
  };
  
  return {
    channels,
    loading,
    error,
    addChannel,
    removeChannel,
    refreshChannel,
    refetch: fetchChannels
  };
}




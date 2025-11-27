import { useState, useEffect } from 'react';
import { videosApi } from '../services/apiClient';
import { Video } from '../types/api';

interface UseVideosParams {
  page?: number;
  limit?: number;
  channelId?: string;
  search?: string;
  sort?: 'newest' | 'oldest' | 'popular';
}

export function useVideos(params: UseVideosParams = {}) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasMore: false,
    oldestCacheAge: 0
  });
  
  const { page, limit, channelId, search, sort } = params;
  
  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response: any = await videosApi.getAll(params);
        setVideos(response.data.videos);
        setMeta(response.meta);
      } catch (err: any) {
        setError(err.error?.message || 'Failed to fetch videos');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVideos();
  }, [page, limit, channelId, search, sort]);
  
  return { videos, loading, error, meta };
}


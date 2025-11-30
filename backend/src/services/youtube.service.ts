import axios from 'axios';
import { env } from '../config/env.js';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export function parseChannelInput(input: string): { type: 'id' | 'handle' | 'username', value: string } {
  input = input.trim();
  
  // Direct channel ID (UC...)
  if (/^UC[\w-]{21}[AQgw]$/.test(input)) {
    return { type: 'id', value: input };
  }
  
  // @handle format
  if (input.startsWith('@')) {
    return { type: 'handle', value: input.substring(1) };
  }
  
  // Full YouTube URLs
  const urlPatterns = [
    { regex: /youtube\.com\/channel\/(UC[\w-]{21}[AQgw])/, type: 'id' as const },
    { regex: /youtube\.com\/@([\w-]+)/, type: 'handle' as const },
    { regex: /youtube\.com\/c\/([\w-]+)/, type: 'username' as const },
    { regex: /youtube\.com\/user\/([\w-]+)/, type: 'username' as const }
  ];
  
  for (const pattern of urlPatterns) {
    const match = input.match(pattern.regex);
    if (match) {
      return { type: pattern.type, value: match[1] };
    }
  }
  
  throw new Error('Invalid YouTube channel format. Use channel ID, @handle, or valid YouTube URL');
}

export async function fetchChannelInfo(input: string) {
  const parsed = parseChannelInput(input);
  
  let params: any = {
    part: 'snippet,statistics,contentDetails',
    key: env.youtubeApiKey
  };
  
  // Use appropriate parameter based on input type
  if (parsed.type === 'id') {
    params.id = parsed.value;
  } else if (parsed.type === 'handle') {
    params.forHandle = parsed.value;
  } else {
    params.forUsername = parsed.value;
  }
  
  try {
    const response = await axios.get(`${YOUTUBE_API_BASE}/channels`, { params });
    
    if (!response.data.items?.length) {
      throw new Error('Channel not found on YouTube');
    }
    
    const channel = response.data.items[0];
    return {
      id: channel.id,
      name: channel.snippet.title,
      customUrl: channel.snippet.customUrl || null,
      thumbnailUrl: channel.snippet.thumbnails.high.url,
      description: channel.snippet.description,
      subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
      videoCount: parseInt(channel.statistics.videoCount || '0'),
      uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads
    };
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error('YouTube API quota exceeded. Please try again later.');
    }
    if (error.response?.status === 400) {
      throw new Error('Invalid channel identifier');
    }
    throw error;
  }
}

export async function fetchChannelVideos(
  uploadsPlaylistId: string,
  maxResults: number = 50
) {
  try {
    // Step 1: Get video IDs from playlist
    const playlistResponse = await axios.get(`${YOUTUBE_API_BASE}/playlistItems`, {
      params: {
        part: 'contentDetails',
        playlistId: uploadsPlaylistId,
        maxResults,
        key: env.youtubeApiKey
      }
    });
    
    if (!playlistResponse.data.items?.length) {
      return [];
    }
    
    const videoIds = playlistResponse.data.items
      .map((item: any) => item.contentDetails.videoId)
      .join(',');
    
    // Step 2: Get video details
    const videosResponse = await axios.get(`${YOUTUBE_API_BASE}/videos`, {
      params: {
        part: 'snippet,statistics,contentDetails',
        id: videoIds,
        key: env.youtubeApiKey
      }
    });
    
    return videosResponse.data.items.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      thumbnailUrl: video.snippet.thumbnails.maxresdefault?.url || 
                    video.snippet.thumbnails.high.url,
      publishedAt: video.snippet.publishedAt,
      viewCount: parseInt(video.statistics.viewCount || '0'),
      likeCount: parseInt(video.statistics.likeCount || '0'),
      duration: video.contentDetails.duration
    }));
  } catch (error: any) {
    if (error.response?.status === 403) {
      throw new Error('YouTube API quota exceeded');
    }
    throw error;
  }
}

// Helper to format ISO 8601 duration to readable format
export function formatDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return '0:00';
  
  const hours = (match[1] || '').replace('H', '');
  const minutes = (match[2] || '').replace('M', '');
  const seconds = (match[3] || '0').replace('S', '');
  
  if (hours) {
    return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  }
  return `${minutes || '0'}:${seconds.padStart(2, '0')}`;
}



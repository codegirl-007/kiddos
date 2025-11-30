export interface Channel {
  id: string;
  name: string;
  customUrl: string | null;
  thumbnailUrl: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  addedAt: string;
  updatedAt: string;
  lastFetchedAt?: string;
  fetchError?: string;
}

export interface Video {
  id: string;
  channelId: string;
  channelName: string;
  channelThumbnail: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  duration: string;
  durationFormatted: string;
}

export interface User {
  id: number;
  username: string;
  lastLogin?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    retryable?: boolean;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    hasMore?: boolean;
    oldestCacheAge?: number;
    cacheStale?: boolean;
    refreshing?: boolean;
  };
}


import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: number;
  username?: string;
}

export interface Channel {
  id: string;
  name: string;
  customUrl: string | null;
  thumbnailUrl: string;
  description: string;
  subscriberCount: number;
  videoCount: number;
  uploadsPlaylistId: string;
  addedAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  duration: string;
  cachedAt: string;
}

export interface User {
  id: number;
  username: string;
  passwordHash: string;
  createdAt: string;
  lastLogin: string | null;
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
    cacheAge?: number;
    oldestCacheAge?: number;
  };
}




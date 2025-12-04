import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { db, getSetting } from '../config/database.js';
import { formatDuration } from '../services/youtube.service.js';
import { refreshMultipleChannels, isRefreshInProgress, setRefreshInProgress } from '../services/cache.service.js';

export async function getAllVideos(req: AuthRequest, res: Response) {
  try {
    console.log('[CONTROLLER] req.query:', req.query);
    // Zod validation already coerced these to numbers
    const { page = 1, limit = 12, channelId, search, sort = 'newest' } = req.query as any;
    
    console.log('[CONTROLLER] page:', page, 'type:', typeof page);
    const pageNum = page as number;
    const limitNum = limit as number;
    const offset = (pageNum - 1) * limitNum;
    console.log('[CONTROLLER] pageNum:', pageNum, 'limitNum:', limitNum, 'offset:', offset);
    
    // Build query
    let whereClause = 'v.duration_seconds >= 600';
    const args: any[] = [];
    
    if (channelId) {
      whereClause += ' AND v.channel_id = ?';
      args.push(channelId);
    }
    
    if (search) {
      whereClause += ' AND (v.title LIKE ? OR v.description LIKE ?)';
      args.push(`%${search}%`, `%${search}%`);
    }
    
    // Sort clause
    let orderClause = 'v.published_at DESC';
    if (sort === 'oldest') {
      orderClause = 'v.published_at ASC';
    } else if (sort === 'popular') {
      orderClause = 'v.view_count DESC';
    }
    
    // Get total count
    const countResult = await db.execute({
      sql: `SELECT COUNT(*) as total FROM videos_cache v WHERE ${whereClause}`,
      args
    });
    const total = countResult.rows[0].total as number;
    
    // Get videos
    const videosResult = await db.execute({
      sql: `
        SELECT 
          v.*,
          c.name as channel_name,
          c.thumbnail_url as channel_thumbnail
        FROM videos_cache v
        JOIN channels c ON v.channel_id = c.id
        WHERE ${whereClause}
        ORDER BY ${orderClause}
        LIMIT ? OFFSET ?
      `,
      args: [...args, limitNum, offset]
    });
    
    // Get oldest cache age
    const cacheAgeResult = await db.execute(
      'SELECT MIN(last_fetched) as oldest FROM cache_metadata'
    );
    
    let oldestCacheAge = 0;
    if (cacheAgeResult.rows.length > 0 && cacheAgeResult.rows[0].oldest) {
      const oldestFetch = new Date(cacheAgeResult.rows[0].oldest as string);
      oldestCacheAge = Math.floor((Date.now() - oldestFetch.getTime()) / 60000);
    }
    
    // Check cache age and trigger refresh if needed
    const cacheDuration = parseInt((await getSetting('cache_duration_minutes')) || '60');
    const cacheExpired = oldestCacheAge > cacheDuration;
    const refreshInProgress = await isRefreshInProgress();
    
    // Trigger async refresh if cache is expired and not already refreshing
    if (cacheExpired && !refreshInProgress) {
      // Fire and forget - don't await
      refreshAllChannelsAsync();
    }
    
    const videos = videosResult.rows.map(row => ({
      id: row.id,
      channelId: row.channel_id,
      channelName: row.channel_name,
      channelThumbnail: row.channel_thumbnail,
      title: row.title,
      description: row.description,
      thumbnailUrl: row.thumbnail_url,
      publishedAt: row.published_at,
      viewCount: row.view_count,
      likeCount: row.like_count,
      duration: row.duration,
      durationFormatted: formatDuration(row.duration as string)
    }));
    
    res.json({
      success: true,
      data: { videos },
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasMore: offset + videos.length < total,
        oldestCacheAge,
        cacheStale: cacheExpired,
        refreshing: refreshInProgress
      }
    });
  } catch (error: any) {
    console.error('Get videos error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_VIDEOS_ERROR',
        message: 'Error fetching videos'
      }
    });
  }
}

export async function refreshVideos(req: AuthRequest, res: Response) {
  try {
    let channelIds: string[] = req.body.channelIds || [];
    
    // If no specific channels, get all channels
    if (channelIds.length === 0) {
      const allChannels = await db.execute('SELECT id FROM channels');
      channelIds = allChannels.rows.map(row => row.id as string);
    }
    
    if (channelIds.length === 0) {
      return res.json({
        success: true,
        data: {
          channelsRefreshed: 0,
          videosAdded: 0,
          videosUpdated: 0,
          errors: []
        }
      });
    }
    
    // Refresh channels in parallel
    const result = await refreshMultipleChannels(channelIds, true);
    
    res.json({
      success: true,
      data: {
        channelsRefreshed: result.success,
        videosAdded: result.videosAdded,
        videosUpdated: result.videosAdded, // Since we replace cache, all are "updated"
        errors: result.errors
      }
    });
  } catch (error: any) {
    console.error('Refresh videos error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REFRESH_VIDEOS_ERROR',
        message: 'Error refreshing videos'
      }
    });
  }
}

async function refreshAllChannelsAsync() {
  try {
    await setRefreshInProgress(true);
    
    // Get all channel IDs
    const channels = await db.execute('SELECT id FROM channels');
    const channelIds = channels.rows.map(row => row.id as string);
    
    if (channelIds.length > 0) {
      console.log(`[AUTO-REFRESH] Starting refresh of ${channelIds.length} channels...`);
      const result = await refreshMultipleChannels(channelIds, true);
      console.log(`[AUTO-REFRESH] Complete: ${result.success} succeeded, ${result.failed} failed`);
    }
  } catch (error) {
    console.error('[AUTO-REFRESH] Error:', error);
  } finally {
    await setRefreshInProgress(false);
  }
}


import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { db } from '../config/database.js';
import { fetchChannelInfo, fetchChannelVideos } from '../services/youtube.service.js';

export async function getAllChannels(req: AuthRequest, res: Response) {
  try {
    const result = await db.execute(`
      SELECT c.*, cm.last_fetched, cm.fetch_error
      FROM channels c
      LEFT JOIN cache_metadata cm ON c.id = cm.channel_id
      ORDER BY c.added_at DESC
    `);
    
    res.json({
      success: true,
      data: {
        channels: result.rows.map(row => ({
          id: row.id,
          name: row.name,
          customUrl: row.custom_url,
          thumbnailUrl: row.thumbnail_url,
          description: row.description,
          subscriberCount: row.subscriber_count,
          videoCount: row.video_count,
          addedAt: row.added_at,
          updatedAt: row.updated_at,
          lastFetchedAt: row.last_fetched,
          fetchError: row.fetch_error
        }))
      },
      meta: {
        total: result.rows.length
      }
    });
  } catch (error: any) {
    console.error('Get channels error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_CHANNELS_ERROR',
        message: 'Error fetching channels'
      }
    });
  }
}

export async function addChannel(req: AuthRequest, res: Response) {
  try {
    const { channelInput } = req.body;
    
    // Fetch channel info from YouTube
    const channelInfo = await fetchChannelInfo(channelInput);
    
    // Check if channel already exists
    const existing = await db.execute({
      sql: 'SELECT id FROM channels WHERE id = ?',
      args: [channelInfo.id]
    });
    
    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'CHANNEL_EXISTS',
          message: 'Channel already exists in database'
        }
      });
    }
    
    // Insert channel
    await db.execute({
      sql: `INSERT INTO channels 
            (id, name, custom_url, thumbnail_url, description, 
             subscriber_count, video_count, uploads_playlist_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        channelInfo.id,
        channelInfo.name,
        channelInfo.customUrl,
        channelInfo.thumbnailUrl,
        channelInfo.description,
        channelInfo.subscriberCount,
        channelInfo.videoCount,
        channelInfo.uploadsPlaylistId
      ]
    });
    
    // Fetch initial videos
    let videosFetched = 0;
    try {
      const videos = await fetchChannelVideos(channelInfo.uploadsPlaylistId);
      videosFetched = videos.length;
      
      // Insert videos into cache
      for (const video of videos) {
        await db.execute({
          sql: `INSERT INTO videos_cache 
                (id, channel_id, title, description, thumbnail_url, 
                 published_at, view_count, like_count, duration)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            video.id, channelInfo.id, video.title, video.description,
            video.thumbnailUrl, video.publishedAt, video.viewCount,
            video.likeCount, video.duration
          ]
        });
      }
      
      // Update cache metadata
      await db.execute({
        sql: `INSERT INTO cache_metadata 
              (channel_id, last_fetched, total_results)
              VALUES (?, ?, ?)`,
        args: [channelInfo.id, new Date().toISOString(), videos.length]
      });
    } catch (error: any) {
      console.error('Error fetching initial videos:', error);
      // Store error but don't fail the channel addition
      await db.execute({
        sql: `INSERT INTO cache_metadata 
              (channel_id, last_fetched, fetch_error)
              VALUES (?, ?, ?)`,
        args: [channelInfo.id, new Date().toISOString(), error.message]
      });
    }
    
    res.json({
      success: true,
      data: {
        channel: channelInfo,
        videosFetched
      }
    });
  } catch (error: any) {
    console.error('Add channel error:', error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CHANNEL_NOT_FOUND',
          message: error.message
        }
      });
    }
    
    if (error.message.includes('quota exceeded')) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'QUOTA_EXCEEDED',
          message: error.message,
          retryable: true
        }
      });
    }
    
    res.status(500).json({
      success: false,
      error: {
        code: 'ADD_CHANNEL_ERROR',
        message: error.message || 'Error adding channel'
      }
    });
  }
}

export async function deleteChannel(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    
    const result = await db.execute({
      sql: 'DELETE FROM channels WHERE id = ?',
      args: [id]
    });
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CHANNEL_NOT_FOUND',
          message: 'Channel not found'
        }
      });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete channel error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_CHANNEL_ERROR',
        message: 'Error deleting channel'
      }
    });
  }
}

export async function refreshChannel(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    
    // Get channel info
    const channel = await db.execute({
      sql: 'SELECT * FROM channels WHERE id = ?',
      args: [id]
    });
    
    if (!channel.rows.length) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CHANNEL_NOT_FOUND',
          message: 'Channel not found'
        }
      });
    }
    
    const channelData = channel.rows[0];
    
    // Fetch fresh videos
    const videos = await fetchChannelVideos(channelData.uploads_playlist_id as string);
    
    // Delete old cache
    await db.execute({
      sql: 'DELETE FROM videos_cache WHERE channel_id = ?',
      args: [id]
    });
    
    // Insert new videos
    for (const video of videos) {
      await db.execute({
        sql: `INSERT INTO videos_cache 
              (id, channel_id, title, description, thumbnail_url, 
               published_at, view_count, like_count, duration)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          video.id, id, video.title, video.description,
          video.thumbnailUrl, video.publishedAt, video.viewCount,
          video.likeCount, video.duration
        ]
      });
    }
    
    // Update metadata
    await db.execute({
      sql: `INSERT OR REPLACE INTO cache_metadata 
            (channel_id, last_fetched, total_results, fetch_error)
            VALUES (?, ?, ?, NULL)`,
      args: [id, new Date().toISOString(), videos.length]
    });
    
    res.json({
      success: true,
      data: {
        channel: channelData,
        videosFetched: videos.length
      }
    });
  } catch (error: any) {
    console.error('Refresh channel error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REFRESH_CHANNEL_ERROR',
        message: error.message || 'Error refreshing channel'
      }
    });
  }
}



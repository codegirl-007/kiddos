import { db, getSetting, setSetting } from '../config/database.js';
import { fetchChannelVideos } from './youtube.service.js';

export async function isRefreshInProgress(): Promise<boolean> {
  const value = await getSetting('refresh_in_progress');
  return value === 'true';
}

export async function setRefreshInProgress(inProgress: boolean): Promise<void> {
  await setSetting('refresh_in_progress', inProgress ? 'true' : 'false');
}

export async function isCacheValid(channelId: string): Promise<boolean> {
  const result = await db.execute({
    sql: `SELECT last_fetched FROM cache_metadata WHERE channel_id = ?`,
    args: [channelId]
  });
  
  if (!result.rows.length) return false;
  
  const lastFetched = new Date(result.rows[0].last_fetched as string);
  const cacheDuration = parseInt(
    (await getSetting('cache_duration_minutes')) || '60'
  );
  
  const now = new Date();
  const diffMinutes = (now.getTime() - lastFetched.getTime()) / 60000;
  
  return diffMinutes < cacheDuration;
}

async function updateVideoCache(channelId: string, videos: any[]) {
  // Delete old cache
  await db.execute({
    sql: 'DELETE FROM videos_cache WHERE channel_id = ?',
    args: [channelId]
  });
  
  // Insert new videos
  for (const video of videos) {
    await db.execute({
      sql: `INSERT INTO videos_cache 
            (id, channel_id, title, description, thumbnail_url, 
             published_at, view_count, like_count, duration)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        video.id, channelId, video.title, video.description,
        video.thumbnailUrl, video.publishedAt, video.viewCount,
        video.likeCount, video.duration
      ]
    });
  }
  
  // Update metadata
  await db.execute({
    sql: `INSERT OR REPLACE INTO cache_metadata 
          (channel_id, last_fetched, total_results)
          VALUES (?, ?, ?)`,
    args: [channelId, new Date().toISOString(), videos.length]
  });
}

export async function getVideosForChannel(
  channelId: string,
  forceRefresh: boolean = false
): Promise<any[]> {
  const channel = await db.execute({
    sql: 'SELECT * FROM channels WHERE id = ?',
    args: [channelId]
  });
  
  if (!channel.rows.length) {
    throw new Error('Channel not found');
  }
  
  const cacheValid = !forceRefresh && await isCacheValid(channelId);
  
  if (cacheValid) {
    const cached = await db.execute({
      sql: `SELECT * FROM videos_cache 
            WHERE channel_id = ? 
            ORDER BY published_at DESC`,
      args: [channelId]
    });
    return cached.rows as any[];
  }
  
  // Fetch fresh data
  try {
    const channelData = channel.rows[0];
    const videos = await fetchChannelVideos(
      channelData.uploads_playlist_id as string
    );
    
    await updateVideoCache(channelId, videos);
    
    // Clear any previous error
    await db.execute({
      sql: 'UPDATE cache_metadata SET fetch_error = NULL WHERE channel_id = ?',
      args: [channelId]
    });
    
    return videos;
  } catch (error: any) {
    // Store error in cache_metadata
    await db.execute({
      sql: `INSERT OR REPLACE INTO cache_metadata 
            (channel_id, last_fetched, fetch_error)
            VALUES (?, ?, ?)`,
      args: [channelId, new Date().toISOString(), error.message]
    });
    throw error;
  }
}

export async function refreshMultipleChannels(
  channelIds: string[],
  forceRefresh: boolean = false
): Promise<{
  success: number;
  failed: number;
  errors: Array<{ channelId: string; error: string }>;
  videosAdded: number;
}> {
  const results = await Promise.allSettled(
    channelIds.map(id => getVideosForChannel(id, forceRefresh))
  );
  
  let success = 0;
  let failed = 0;
  let videosAdded = 0;
  const errors: Array<{ channelId: string; error: string }> = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      success++;
      videosAdded += result.value.length;
    } else {
      failed++;
      errors.push({
        channelId: channelIds[index],
        error: result.reason.message || 'Unknown error'
      });
    }
  });
  
  return { success, failed, errors, videosAdded };
}


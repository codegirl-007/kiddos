import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVideos } from '../hooks/useVideos';
import { VideoGrid } from '../components/VideoGrid/VideoGrid';
import { VideoPlayer } from '../components/VideoPlayer/VideoPlayer';

export function VideoApp() {
  const [searchParams] = useSearchParams();
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  
  // Read from URL query params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const sort = (searchParams.get('sort') || 'newest') as 'newest' | 'oldest' | 'popular';
  const selectedChannel = searchParams.get('channel') || undefined;
  
  const { videos, loading, error, meta } = useVideos({
    page,
    limit: 12,
    search: search || undefined,
    sort,
    channelId: selectedChannel
  });
  
  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    window.history.pushState({}, '', `?${newParams.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Trigger re-render
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
  
  return (
    <div>
      
      <VideoGrid
        videos={videos}
        loading={loading}
        error={error}
        onVideoClick={setSelectedVideo}
        page={page}
        totalPages={meta.totalPages}
        onPageChange={handlePageChange}
      />
      
      {selectedVideo && (
        <VideoPlayer
          videoId={selectedVideo}
          onClose={() => setSelectedVideo(null)}
        />
      )}
    </div>
  );
}

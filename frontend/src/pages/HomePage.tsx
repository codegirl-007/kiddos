import { useState } from 'react';
import { useVideos } from '../hooks/useVideos';
import { useChannels } from '../hooks/useChannels';
import { VideoGrid } from '../components/VideoGrid/VideoGrid';
import { VideoPlayer } from '../components/VideoPlayer/VideoPlayer';
import { SearchFilter } from '../components/SearchFilter/SearchFilter';

export function HomePage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'popular'>('newest');
  const [selectedChannel, setSelectedChannel] = useState<string | undefined>();
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  
  const { videos, loading, error, meta } = useVideos({
    page,
    limit: 12,
    search: search || undefined,
    sort,
    channelId: selectedChannel
  });
  
  const { channels } = useChannels();
  
  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1);
  };
  
  const handleSortChange = (newSort: 'newest' | 'oldest' | 'popular') => {
    setSort(newSort);
    setPage(1);
  };
  
  const handleChannelChange = (channelId: string | undefined) => {
    setSelectedChannel(channelId);
    setPage(1);
  };
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  return (
    <div>
      <SearchFilter
        onSearch={handleSearch}
        onSortChange={handleSortChange}
        channels={channels}
        selectedChannel={selectedChannel}
        onChannelChange={handleChannelChange}
      />
      
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


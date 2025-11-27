import { Video } from '../../types/api';
import { VideoCard } from '../VideoCard/VideoCard';
import './VideoGrid.css';

interface VideoGridProps {
  videos: Video[];
  loading: boolean;
  error: string | null;
  onVideoClick: (videoId: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function VideoGrid({ 
  videos, 
  loading, 
  error, 
  onVideoClick,
  page,
  totalPages,
  onPageChange
}: VideoGridProps) {
  if (loading) {
    return (
      <div className="video-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="skeleton-card">
            <div className="skeleton-thumbnail"></div>
            <div className="skeleton-info">
              <div className="skeleton-avatar"></div>
              <div className="skeleton-text">
                <div className="skeleton-title"></div>
                <div className="skeleton-meta"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-message">
        <p>Error: {error}</p>
      </div>
    );
  }
  
  if (videos.length === 0) {
    return (
      <div className="empty-state">
        <h2>No videos found</h2>
        <p>Try adding some channels from the admin panel</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="video-grid">
        {videos.map(video => (
          <VideoCard
            key={video.id}
            video={video}
            onClick={() => onVideoClick(video.id)}
          />
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="pagination-button"
          >
            Previous
          </button>
          
          <div className="pagination-numbers">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={`pagination-number ${page === pageNum ? 'active' : ''}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}


import { Video } from '../../types/api';
import { VideoCard } from '../VideoCard/VideoCard';

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
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 py-8 px-6 max-w-[1600px] mx-auto">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="w-full aspect-video bg-muted rounded-2xl"></div>
            <div className="flex gap-3 mt-3">
              <div className="w-9 h-9 rounded-full bg-muted"></div>
              <div className="flex-1">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/5"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12 px-6 text-primary">
        <p>Error: {error}</p>
      </div>
    );
  }
  
  if (videos.length === 0) {
    return (
      <div className="text-center py-12 px-6 text-muted-foreground">
        <h2 className="m-0 mb-2 text-xl font-medium">No videos found</h2>
        <p className="m-0 text-sm">Try adding some channels from the admin panel</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6 py-8 px-6 max-w-[1600px] mx-auto md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] md:gap-6 md:py-8 md:px-6 grid-cols-1 gap-4 p-4">
        {videos.map(video => (
          <VideoCard
            key={video.id}
            video={video}
            onClick={() => onVideoClick(video.id)}
          />
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 py-8 px-6 mx-auto max-w-[1600px] md:flex-row md:gap-3 md:py-8 md:px-6 flex-col gap-2 p-4">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className="text-sm font-semibold px-3 py-2 rounded-full transition-all active:scale-95 bg-white text-foreground border-2 border-primary hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            Previous
          </button>
          
          <div className="flex gap-1 md:flex flex hidden">
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
                  className={`text-sm font-semibold px-3 py-2 rounded-full transition-all active:scale-95 ${
                    page === pageNum 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'bg-white text-foreground border-2 border-primary hover:bg-pink-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            className="text-sm font-semibold px-3 py-2 rounded-full transition-all active:scale-95 bg-white text-foreground border-2 border-primary hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

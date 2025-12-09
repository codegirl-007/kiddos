import { Video } from '../../types/api';

interface VideoCardProps {
  video: Video;
  onClick: () => void;
  disabled?: boolean;
}

export function VideoCard({ video, onClick, disabled = false }: VideoCardProps) {
  const formatViews = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };
  
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };
  
  return (
    <div 
      className={`cursor-pointer transition-all bg-card rounded-[20px] p-4 border border-border shadow-lg hover:-translate-y-1 hover:shadow-xl ${
        disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
      }`} 
      onClick={disabled ? undefined : onClick}
    >
      <div className="relative w-full aspect-video overflow-hidden bg-muted rounded-xl group">
        <img 
          src={video.thumbnailUrl} 
          alt={video.title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <span className="absolute bottom-2 right-2 bg-[rgba(31,42,55,0.85)] text-white py-0.5 px-1.5 rounded text-xs font-medium">
          {video.durationFormatted}
        </span>
      </div>
      
      <div className="flex gap-3 mt-3">
        <img 
          src={video.channelThumbnail} 
          alt={video.channelName}
          className="w-9 h-9 md:w-9 md:h-9 w-8 h-8 rounded-full flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold leading-snug text-foreground m-0 mb-1.5 overflow-hidden line-clamp-2">
            {video.title}
          </h3>
          <p className="m-0 text-xs text-muted-foreground flex flex-col gap-0.5">
            <span className="font-normal">{video.channelName}</span>
            <span className="font-normal">
              {formatViews(video.viewCount)} views • {getTimeAgo(video.publishedAt)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

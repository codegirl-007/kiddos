import { Video } from '../../types/api';
import './VideoCard.css';

interface VideoCardProps {
  video: Video;
  onClick: () => void;
}

export function VideoCard({ video, onClick }: VideoCardProps) {
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
    <div className="video-card" onClick={onClick}>
      <div className="video-thumbnail-container">
        <img 
          src={video.thumbnailUrl} 
          alt={video.title}
          className="video-thumbnail"
        />
        <span className="video-duration">{video.durationFormatted}</span>
      </div>
      
      <div className="video-info">
        <img 
          src={video.channelThumbnail} 
          alt={video.channelName}
          className="channel-avatar"
        />
        <div className="video-details">
          <h3 className="video-title">{video.title}</h3>
          <p className="video-metadata">
            <span className="channel-name">{video.channelName}</span>
            <span className="video-stats">
              {formatViews(video.viewCount)} views • {getTimeAgo(video.publishedAt)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}




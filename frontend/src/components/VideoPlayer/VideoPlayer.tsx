import { useEffect, useRef } from 'react';
import { setCurrentVideo } from '../../services/connectionTracker';

interface VideoPlayerProps {
  videoId: string;
  videoTitle?: string;
  channelName?: string;
  onClose: () => void;
}

export function VideoPlayer({ videoId, videoTitle, channelName, onClose }: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Set video info for connection tracking
    setCurrentVideo(videoTitle && channelName ? { title: videoTitle, channelName } : null);
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Handle Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCurrentVideo(null);
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    
    return () => {
      // Clear video info when player closes
      setCurrentVideo(null);
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [videoId, videoTitle, channelName, onClose]);
  
  const handleClose = () => {
    setCurrentVideo(null);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1000] p-5 md:p-5 p-0"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-[1200px] bg-black rounded-lg overflow-hidden md:rounded-lg rounded-none md:max-w-[1200px] max-w-full"
        onClick={e => e.stopPropagation()}
      >
        <button 
          className="absolute -top-10 md:-top-10 top-2.5 right-0 md:right-0 right-2.5 bg-none border-none text-white text-4xl md:text-4xl text-[32px] cursor-pointer p-0 w-10 h-10 md:w-10 md:h-10 w-9 h-9 flex items-center justify-center z-[1001] hover:opacity-70 md:bg-none bg-black/70 md:rounded-none rounded-full"
          onClick={handleClose}
        >
          ×
        </button>
        <div className="relative w-full pb-[56.25%]">
          <iframe
            ref={iframeRef}
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="YouTube video player"
            className="absolute top-0 left-0 w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
}

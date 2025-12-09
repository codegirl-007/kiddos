import { useEffect, useRef } from 'react';
import { useTimeLimit } from '../../hooks/useTimeLimit';

interface VideoPlayerProps {
  videoId: string;
  onClose: () => void;
}

export function VideoPlayer({ videoId, onClose }: VideoPlayerProps) {
  const { limitReached, startTracking, stopTracking, remainingTime } = useTimeLimit();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const checkLimitIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    // Handle Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopTracking();
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    
    // Start tracking time when player opens
    if (!limitReached) {
      startTracking();
    }
    
    // Check limit periodically and stop video if reached
    checkLimitIntervalRef.current = setInterval(() => {
      if (limitReached && iframeRef.current) {
        // Stop the video by removing autoplay and reloading with paused state
        if (iframeRef.current.src.includes('autoplay=1')) {
          iframeRef.current.src = iframeRef.current.src.replace('autoplay=1', 'autoplay=0');
        }
        stopTracking();
      }
    }, 1000);
    
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscape);
      stopTracking();
      if (checkLimitIntervalRef.current) {
        clearInterval(checkLimitIntervalRef.current);
      }
    };
  }, [onClose, limitReached, startTracking, stopTracking]);

  // Stop video immediately if limit reached
  useEffect(() => {
    if (limitReached && iframeRef.current) {
      // Change iframe src to stop autoplay
      const currentSrc = iframeRef.current.src;
      if (currentSrc.includes('autoplay=1')) {
        iframeRef.current.src = currentSrc.replace('autoplay=1', 'autoplay=0');
      }
      stopTracking();
    }
  }, [limitReached, stopTracking]);
  
  const handleClose = () => {
    stopTracking();
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
        {limitReached ? (
          <div className="py-[60px] px-10 md:py-[60px] md:px-10 py-10 px-5 text-center text-white min-h-[400px] flex flex-col items-center justify-center">
            <h2 className="text-[28px] md:text-[28px] text-2xl mb-4 text-[#ff6b6b]">Daily Time Limit Reached</h2>
            <p className="text-lg md:text-lg text-base mb-6 opacity-90">
              You've reached your daily video watching limit. Come back tomorrow!
            </p>
            <button 
              onClick={handleClose} 
              className="bg-[#4a90e2] text-white border-none py-3 px-6 rounded-md text-base cursor-pointer font-medium transition-colors hover:bg-[#357abd]"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="absolute top-2.5 md:top-2.5 top-[50px] left-2.5 md:left-2.5 left-2.5 bg-black/70 text-white py-2 px-3 rounded text-sm md:text-sm text-xs z-[1002] font-medium">
              {Math.floor(remainingTime)} min remaining today
            </div>
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
          </>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { useTimeLimit } from '../../hooks/useTimeLimit';
import './VideoPlayer.css';

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
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-button" onClick={handleClose}>×</button>
        {limitReached ? (
          <div className="time-limit-message">
            <h2>Daily Time Limit Reached</h2>
            <p>You've reached your daily video watching limit. Come back tomorrow!</p>
            <button onClick={handleClose} className="time-limit-button">Close</button>
          </div>
        ) : (
          <>
            <div className="time-remaining-indicator">
              {Math.floor(remainingTime)} min remaining today
            </div>
            <div className="video-container">
              <iframe
                ref={iframeRef}
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="YouTube video player"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}




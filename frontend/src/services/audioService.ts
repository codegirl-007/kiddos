const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/**
 * Play pronunciation audio for a word
 * @param wordId The ID of the word to pronounce
 * @returns Promise that resolves when audio starts playing
 */
export async function playWordPronunciation(wordId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(`${API_BASE_URL}/speech-sounds/pronounce/${wordId}`);
    
    audio.onloadeddata = () => {
      audio.play().then(() => {
        resolve();
      }).catch((error) => {
        console.error('Error playing audio:', error);
        reject(new Error('Failed to play audio'));
      });
    };
    
    audio.onerror = (error) => {
      console.error('Audio loading error:', error);
      reject(new Error('Failed to load audio'));
    };
    
    // Handle audio end
    audio.onended = () => {
      // Clean up
    };
  });
}

/**
 * Check if audio is available for a word (without playing it)
 * @param wordId The ID of the word to check
 * @returns Promise that resolves to true if audio is available
 */
export async function checkAudioAvailability(wordId: number): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/speech-sounds/pronounce/${wordId}`, {
      method: 'HEAD'
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

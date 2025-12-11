import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { db } from '../config/database.js';
import { generateSpeech } from '../services/elevenlabs.service.js';

/**
 * Get pronunciation audio for a word
 * Checks cache first, then calls ElevenLabs API if not cached
 */
export async function pronounceWord(req: AuthRequest, res: Response) {
  try {
    const wordId = parseInt(req.params.wordId);
    
    if (!wordId || isNaN(wordId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_WORD_ID',
          message: 'Invalid word ID'
        }
      });
    }

    // Get word text from database
    const wordResult = await db.execute({
      sql: 'SELECT word FROM words WHERE id = ?',
      args: [wordId]
    });

    if (!wordResult.rows.length) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'WORD_NOT_FOUND',
          message: 'Word not found'
        }
      });
    }

    const wordText = wordResult.rows[0].word as string;
    const voiceId = '1FSm04EkRXraU6SyzoLr'; // Can be made configurable later

    // Check cache first
    const cacheResult = await db.execute({
      sql: 'SELECT audio_data, audio_format FROM word_pronunciations WHERE word_id = ? AND voice_id = ?',
      args: [wordId, voiceId]
    });

    if (cacheResult.rows.length > 0) {
      // Return cached audio
      const audioDataValue = cacheResult.rows[0].audio_data;
      const audioFormat = cacheResult.rows[0].audio_format as string;
      
      // Convert database BLOB to Buffer
      let audioBuffer: Buffer;
      if (audioDataValue instanceof Uint8Array) {
        audioBuffer = Buffer.from(audioDataValue);
      } else if (audioDataValue instanceof ArrayBuffer) {
        audioBuffer = Buffer.from(audioDataValue);
      } else {
        // Fallback: convert to string then to buffer
        audioBuffer = Buffer.from(audioDataValue as any);
      }
      
      const contentType = audioFormat === 'mp3' ? 'audio/mpeg' : 
                         audioFormat === 'wav' ? 'audio/wav' : 
                         audioFormat === 'ogg' ? 'audio/ogg' : 'audio/mpeg';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', audioBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.send(audioBuffer);
      return;
    }

    // Not cached - generate speech using ElevenLabs
    try {
      const { audio, format } = await generateSpeech(wordText, voiceId);

      // Store in cache
      await db.execute({
        sql: `
          INSERT INTO word_pronunciations (word_id, voice_id, audio_data, audio_format)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(word_id, voice_id) DO UPDATE SET
            audio_data = excluded.audio_data,
            audio_format = excluded.audio_format,
            created_at = CURRENT_TIMESTAMP
        `,
        args: [wordId, voiceId, audio, format]
      });

      // Return audio
      const contentType = format === 'mp3' ? 'audio/mpeg' : 
                         format === 'wav' ? 'audio/wav' : 
                         format === 'ogg' ? 'audio/ogg' : 'audio/mpeg';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', audio.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.send(audio);
    } catch (error: any) {
      console.error('Error generating speech:', error);
      
      // If ElevenLabs fails and API key is not configured, return helpful error
      if (error.message.includes('not configured')) {
        return res.status(503).json({
          success: false,
          error: {
            code: 'ELEVENLABS_NOT_CONFIGURED',
            message: 'Text-to-speech is not configured. Please set ELEVENLABS_API_KEY environment variable.'
          }
        });
      }

      return res.status(500).json({
        success: false,
        error: {
          code: 'SPEECH_GENERATION_ERROR',
          message: 'Failed to generate speech pronunciation'
        }
      });
    }
  } catch (error: any) {
    console.error('Pronounce word error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PRONOUNCE_WORD_ERROR',
        message: 'Error generating word pronunciation'
      }
    });
  }
}

/**
 * Clear all cached pronunciations (admin only)
 * Forces regeneration with current model/settings
 */
export async function clearPronunciationsCache(req: AuthRequest, res: Response) {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    // Delete all cached pronunciations
    const result = await db.execute({
      sql: 'DELETE FROM word_pronunciations'
    });

    res.json({
      success: true,
      data: {
        message: 'Pronunciation cache cleared successfully',
        deletedCount: result.rowsAffected || 0
      }
    });
  } catch (error: any) {
    console.error('Clear pronunciations cache error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CLEAR_CACHE_ERROR',
        message: 'Error clearing pronunciation cache'
      }
    });
  }
}

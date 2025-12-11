import { env } from '../config/env.js';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel - a friendly, clear voice

export interface ElevenLabsResponse {
  audio: Buffer;
  format: string;
}

/**
 * Generate speech audio using ElevenLabs API
 * @param text The text to convert to speech
 * @param voiceId Optional voice ID (defaults to Rachel)
 * @returns Audio buffer and format
 */
export async function generateSpeech(
  text: string,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<ElevenLabsResponse> {
  if (!env.elevenLabsApiKey) {
    throw new Error('ElevenLabs API key is not configured');
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Text cannot be empty');
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': env.elevenLabsApiKey
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: 'eleven_turbo_v2_5'
        // No voice_settings - uses the voice's default settings from ElevenLabs
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'audio/mpeg';
    
    // Determine format from content type
    let format = 'mp3';
    if (contentType.includes('mp3')) {
      format = 'mp3';
    } else if (contentType.includes('wav')) {
      format = 'wav';
    } else if (contentType.includes('ogg')) {
      format = 'ogg';
    }

    return {
      audio: audioBuffer,
      format
    };
  } catch (error: any) {
    if (error.message.includes('ElevenLabs API error')) {
      throw error;
    }
    console.error('Error calling ElevenLabs API:', error);
    throw new Error(`Failed to generate speech: ${error.message}`);
  }
}

import { Response } from 'express';
import { Request } from 'express';
import { db } from '../config/database.js';

/**
 * Public endpoint to get settings by magic code
 * No authentication required - children use this to apply settings
 */
export async function getSettingsByCode(req: Request, res: Response) {
  try {
    const code = req.params.code?.toUpperCase().trim();

    if (!code || code.length > 7) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CODE_FORMAT',
          message: 'Invalid magic code format'
        }
      });
    }

    // Get profile by magic code
    const profileResult = await db.execute({
      sql: 'SELECT * FROM settings_profiles WHERE magic_code = ? AND is_active = 1',
      args: [code]
    });

    if (!profileResult.rows.length) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'CODE_NOT_FOUND',
          message: 'Magic code not found or inactive'
        }
      });
    }

    const profile = profileResult.rows[0];

    // Get settings
    const settingsResult = await db.execute({
      sql: 'SELECT setting_key, setting_value FROM settings_profile_values WHERE profile_id = ?',
      args: [profile.id]
    });

    const settings: Record<string, any> = {};
    for (const row of settingsResult.rows) {
      const key = row.setting_key as string;
      const value = row.setting_value as string;
      
      // Parse JSON array for enabled_apps
      if (key === 'enabled_apps') {
        try {
          settings[key] = JSON.parse(value);
        } catch (e) {
          console.warn('Failed to parse enabled_apps:', e);
          settings[key] = [];
        }
      } else {
        settings[key] = value;
      }
    }

    let enabledApps: string[] = [];
    if (settings.enabled_apps && Array.isArray(settings.enabled_apps)) {
      enabledApps = settings.enabled_apps;
    }

    res.json({
      success: true,
      data: {
        magicCode: profile.magic_code,
        settings,
        enabledApps
      }
    });
  } catch (error: any) {
    console.error('Get settings by code error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_SETTINGS_ERROR',
        message: 'Error fetching settings'
      }
    });
  }
}

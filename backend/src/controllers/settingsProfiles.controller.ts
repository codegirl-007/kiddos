import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { db } from '../config/database.js';
import { generateMagicCode } from '../utils/magicCodeGenerator.js';

export async function getAllProfiles(req: AuthRequest, res: Response) {
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

    const result = await db.execute({
      sql: `
        SELECT 
          sp.id,
          sp.magic_code,
          sp.name,
          sp.description,
          sp.created_at,
          sp.updated_at,
          sp.is_active,
          spv.setting_key,
          spv.setting_value
        FROM settings_profiles sp
        LEFT JOIN settings_profile_values spv ON sp.id = spv.profile_id
        WHERE sp.created_by = ?
        ORDER BY sp.created_at DESC
      `,
      args: [req.userId]
    });

    // Group settings by profile
    const profilesMap = new Map<number, any>();
    
    for (const row of result.rows) {
      const profileId = row.id as number;
      
      if (!profilesMap.has(profileId)) {
        profilesMap.set(profileId, {
          id: profileId,
          magicCode: row.magic_code,
          name: row.name,
          description: row.description,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          isActive: row.is_active === 1,
          settings: {}
        });
      }
      
      const profile = profilesMap.get(profileId)!;
      if (row.setting_key) {
        profile.settings[row.setting_key] = row.setting_value;
      }
    }

    const profiles = Array.from(profilesMap.values()).map(profile => ({
      ...profile,
      dailyTimeLimit: profile.settings.daily_time_limit_minutes 
        ? parseInt(profile.settings.daily_time_limit_minutes, 10) 
        : null
    }));

    res.json({
      success: true,
      data: profiles
    });
  } catch (error: any) {
    console.error('Get all profiles error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PROFILES_ERROR',
        message: 'Error fetching settings profiles'
      }
    });
  }
}

export async function getProfile(req: AuthRequest, res: Response) {
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

    const profileId = parseInt(req.params.id);
    if (!profileId || isNaN(profileId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROFILE_ID',
          message: 'Invalid profile ID'
        }
      });
    }

    // Get profile and verify ownership
    const profileResult = await db.execute({
      sql: 'SELECT * FROM settings_profiles WHERE id = ? AND created_by = ?',
      args: [profileId, req.userId]
    });

    if (!profileResult.rows.length) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Profile not found or you do not have permission to access it'
        }
      });
    }

    const profile = profileResult.rows[0];

    // Get settings
    const settingsResult = await db.execute({
      sql: 'SELECT setting_key, setting_value FROM settings_profile_values WHERE profile_id = ?',
      args: [profileId]
    });

    const settings: Record<string, string> = {};
    for (const row of settingsResult.rows) {
      settings[row.setting_key as string] = row.setting_value as string;
    }

    res.json({
      success: true,
      data: {
        id: profile.id,
        magicCode: profile.magic_code,
        name: profile.name,
        description: profile.description,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        isActive: profile.is_active === 1,
        settings,
        dailyTimeLimit: settings.daily_time_limit_minutes 
          ? parseInt(settings.daily_time_limit_minutes, 10) 
          : null
      }
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_PROFILE_ERROR',
        message: 'Error fetching settings profile'
      }
    });
  }
}

export async function createProfile(req: AuthRequest, res: Response) {
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

    const { name, description, dailyTimeLimit } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_NAME',
          message: 'Name is required'
        }
      });
    }

    if (!dailyTimeLimit || typeof dailyTimeLimit !== 'number' || dailyTimeLimit < 1) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TIME_LIMIT',
          message: 'Daily time limit must be a number greater than 0'
        }
      });
    }

    // Generate unique magic code
    const magicCode = await generateMagicCode();

    // Create profile
    const profileResult = await db.execute({
      sql: `
        INSERT INTO settings_profiles (magic_code, name, description, created_by)
        VALUES (?, ?, ?, ?)
      `,
      args: [magicCode, name.trim(), description?.trim() || null, req.userId]
    });

    const profileId = profileResult.lastInsertRowid as number;

    // Add settings
    await db.execute({
      sql: `
        INSERT INTO settings_profile_values (profile_id, setting_key, setting_value)
        VALUES (?, ?, ?)
      `,
      args: [profileId, 'daily_time_limit_minutes', dailyTimeLimit.toString()]
    });

    // Get created profile
    const createdProfile = await db.execute({
      sql: 'SELECT * FROM settings_profiles WHERE id = ?',
      args: [profileId]
    });

    res.status(201).json({
      success: true,
      data: {
        id: createdProfile.rows[0].id,
        magicCode: createdProfile.rows[0].magic_code,
        name: createdProfile.rows[0].name,
        description: createdProfile.rows[0].description,
        createdAt: createdProfile.rows[0].created_at,
        updatedAt: createdProfile.rows[0].updated_at,
        isActive: createdProfile.rows[0].is_active === 1,
        dailyTimeLimit
      }
    });
  } catch (error: any) {
    console.error('Create profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_PROFILE_ERROR',
        message: 'Error creating settings profile'
      }
    });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
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

    const profileId = parseInt(req.params.id);
    if (!profileId || isNaN(profileId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROFILE_ID',
          message: 'Invalid profile ID'
        }
      });
    }

    const { name, description, isActive } = req.body;

    // Verify ownership
    const existing = await db.execute({
      sql: 'SELECT id FROM settings_profiles WHERE id = ? AND created_by = ?',
      args: [profileId, req.userId]
    });

    if (!existing.rows.length) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Profile not found or you do not have permission to update it'
        }
      });
    }

    // Build update query
    const updates: string[] = [];
    const args: any[] = [];

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_NAME',
            message: 'Name must be a non-empty string'
          }
        });
      }
      updates.push('name = ?');
      args.push(name.trim());
    }

    if (description !== undefined) {
      updates.push('description = ?');
      args.push(description?.trim() || null);
    }

    if (isActive !== undefined) {
      updates.push('is_active = ?');
      args.push(isActive ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_UPDATES',
          message: 'No fields to update'
        }
      });
    }

    updates.push('updated_at = ?');
    args.push(new Date().toISOString());
    args.push(profileId);

    await db.execute({
      sql: `UPDATE settings_profiles SET ${updates.join(', ')} WHERE id = ?`,
      args
    });

    // Get updated profile
    const updated = await db.execute({
      sql: 'SELECT * FROM settings_profiles WHERE id = ?',
      args: [profileId]
    });

    res.json({
      success: true,
      data: {
        id: updated.rows[0].id,
        magicCode: updated.rows[0].magic_code,
        name: updated.rows[0].name,
        description: updated.rows[0].description,
        createdAt: updated.rows[0].created_at,
        updatedAt: updated.rows[0].updated_at,
        isActive: updated.rows[0].is_active === 1
      }
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_PROFILE_ERROR',
        message: 'Error updating settings profile'
      }
    });
  }
}

export async function deleteProfile(req: AuthRequest, res: Response) {
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

    const profileId = parseInt(req.params.id);
    if (!profileId || isNaN(profileId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROFILE_ID',
          message: 'Invalid profile ID'
        }
      });
    }

    // Verify ownership
    const existing = await db.execute({
      sql: 'SELECT id FROM settings_profiles WHERE id = ? AND created_by = ?',
      args: [profileId, req.userId]
    });

    if (!existing.rows.length) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Profile not found or you do not have permission to delete it'
        }
      });
    }

    // Delete profile (cascade will handle settings)
    await db.execute({
      sql: 'DELETE FROM settings_profiles WHERE id = ?',
      args: [profileId]
    });

    res.json({
      success: true,
      data: { message: 'Profile deleted successfully' }
    });
  } catch (error: any) {
    console.error('Delete profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_PROFILE_ERROR',
        message: 'Error deleting settings profile'
      }
    });
  }
}

export async function updateProfileSettings(req: AuthRequest, res: Response) {
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

    const profileId = parseInt(req.params.id);
    if (!profileId || isNaN(profileId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROFILE_ID',
          message: 'Invalid profile ID'
        }
      });
    }

    const { dailyTimeLimit } = req.body;

    // Verify ownership
    const existing = await db.execute({
      sql: 'SELECT id FROM settings_profiles WHERE id = ? AND created_by = ?',
      args: [profileId, req.userId]
    });

    if (!existing.rows.length) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Profile not found or you do not have permission to update it'
        }
      });
    }

    if (dailyTimeLimit !== undefined) {
      if (typeof dailyTimeLimit !== 'number' || dailyTimeLimit < 1) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TIME_LIMIT',
            message: 'Daily time limit must be a number greater than 0'
          }
        });
      }

      // Update or insert setting
      await db.execute({
        sql: `
          INSERT INTO settings_profile_values (profile_id, setting_key, setting_value, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(profile_id, setting_key) DO UPDATE SET
            setting_value = excluded.setting_value,
            updated_at = excluded.updated_at
        `,
        args: [profileId, 'daily_time_limit_minutes', dailyTimeLimit.toString(), new Date().toISOString()]
      });
    }

    // Get updated settings
    const settingsResult = await db.execute({
      sql: 'SELECT setting_key, setting_value FROM settings_profile_values WHERE profile_id = ?',
      args: [profileId]
    });

    const settings: Record<string, string> = {};
    for (const row of settingsResult.rows) {
      settings[row.setting_key as string] = row.setting_value as string;
    }

    res.json({
      success: true,
      data: {
        dailyTimeLimit: settings.daily_time_limit_minutes 
          ? parseInt(settings.daily_time_limit_minutes, 10) 
          : null
      }
    });
  } catch (error: any) {
    console.error('Update profile settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_SETTINGS_ERROR',
        message: 'Error updating profile settings'
      }
    });
  }
}

export async function regenerateMagicCode(req: AuthRequest, res: Response) {
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

    const profileId = parseInt(req.params.id);
    if (!profileId || isNaN(profileId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROFILE_ID',
          message: 'Invalid profile ID'
        }
      });
    }

    // Verify ownership
    const existing = await db.execute({
      sql: 'SELECT id FROM settings_profiles WHERE id = ? AND created_by = ?',
      args: [profileId, req.userId]
    });

    if (!existing.rows.length) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Profile not found or you do not have permission to regenerate its code'
        }
      });
    }

    // Generate new magic code
    const newMagicCode = await generateMagicCode();

    // Update profile
    await db.execute({
      sql: 'UPDATE settings_profiles SET magic_code = ?, updated_at = ? WHERE id = ?',
      args: [newMagicCode, new Date().toISOString(), profileId]
    });

    res.json({
      success: true,
      data: {
        magicCode: newMagicCode
      }
    });
  } catch (error: any) {
    console.error('Regenerate magic code error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REGENERATE_CODE_ERROR',
        message: 'Error regenerating magic code'
      }
    });
  }
}

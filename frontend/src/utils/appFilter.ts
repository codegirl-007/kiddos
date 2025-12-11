import { APPS, App } from '../config/apps';
import { getMagicCodeSettings } from '../services/magicCodeService';

/**
 * Get enabled apps based on magic code settings
 * - If magic code is applied: use enabledApps from magic code (empty array = all apps enabled)
 * - If no magic code: videos app falls back to disabled, other apps are enabled
 */
export function getEnabledApps(): App[] {
  const magicCodeSettings = getMagicCodeSettings();
  
  // If magic code is applied, use its enabled apps
  if (magicCodeSettings?.enabledApps !== null && magicCodeSettings?.enabledApps !== undefined) {
    const enabledAppIds = magicCodeSettings.enabledApps;
    
    // Empty array means all apps enabled (including videos)
    if (enabledAppIds.length === 0) {
      return APPS.filter(app => !app.disabled);
    }
    
    // Return only apps that are in the enabled list
    return APPS.filter(app => enabledAppIds.includes(app.id) && !app.disabled);
  }
  
  // No magic code: videos falls back to disabled, other apps are enabled
  return APPS.filter(app => app.id !== 'videos' && !app.disabled);
}

/**
 * Check if a specific app is enabled
 */
export function isAppEnabled(appId: string): boolean {
  const enabledApps = getEnabledApps();
  return enabledApps.some(app => app.id === appId);
}

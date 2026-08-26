/**
 * OneSignal Client & Web Push Notification Helpers
 *
 * Provides utilities to:
 * 1. Initialize OneSignal Web SDK safely on client-side
 * 2. Request and check push subscription state
 * 3. Send high-priority agronomic alerts (e.g. Drought Stress Index warnings)
 *    via server-side REST API route `/api/notifications/onesignal`
 * 4. Fallback gracefully to Browser Native Notification API and in-app toasts/badges
 */

export interface PushNotificationPayload {
  title: string;
  message: string;
  fieldId?: string;
  fieldName?: string;
  crop?: string;
  dsiScore?: number;
  level?: 'mild' | 'moderate' | 'severe' | 'critical';
  url?: string;
  data?: Record<string, unknown>;
}

export interface OneSignalConfig {
  appId: string;
  hasRestKey?: boolean;
  isSubscribed?: boolean;
  permission?: NotificationPermission;
}

const ONESIGNAL_STORAGE_KEY = 'integration_onesignal_v1';
const ONESIGNAL_SETTINGS_KEY = 'onesignal_settings_v1';

export interface OneSignalSettings {
  autoAlertDroughtStress: boolean;
  droughtStressThreshold: number; // e.g. 70 (out of 100)
  soundEnabled: boolean;
  nativeFallbackEnabled: boolean;
}

export const DEFAULT_ONESIGNAL_SETTINGS: OneSignalSettings = {
  autoAlertDroughtStress: true,
  droughtStressThreshold: 65, // Trigger at Moderate-Severe threshold
  soundEnabled: true,
  nativeFallbackEnabled: true,
};

export function getSavedOneSignalSettings(): OneSignalSettings {
  if (typeof window === 'undefined') return DEFAULT_ONESIGNAL_SETTINGS;
  try {
    const raw = localStorage.getItem(ONESIGNAL_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_ONESIGNAL_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // fallback
  }
  return DEFAULT_ONESIGNAL_SETTINGS;
}

export function saveOneSignalSettings(settings: OneSignalSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ONESIGNAL_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

/**
 * Retrieves the OneSignal App ID from localStorage or NEXT_PUBLIC env
 */
export function getOneSignalAppId(): string | null {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || null;
  }
  try {
    const fromStorage = localStorage.getItem(ONESIGNAL_STORAGE_KEY);
    if (fromStorage && fromStorage.trim().length > 0) {
      return fromStorage.trim();
    }
  } catch {
    // ignore
  }
  return process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || null;
}

/**
 * Initializes the OneSignal SDK dynamically in the browser
 */
export async function initOneSignalSDK(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const appId = getOneSignalAppId();
  if (!appId) {
    return false;
  }

  try {
    // Check if OneSignal script is already loaded
    const w = window as unknown as {
      OneSignalDeferred?: Array<(OneSignal: unknown) => void>;
      OneSignal?: {
        init: (options: { appId: string; notifyButton?: { enable: boolean }; allowLocalhostAsSecureOrigin?: boolean }) => Promise<void>;
        Notifications?: {
          permissionNative?: NotificationPermission;
          requestPermission: () => Promise<void>;
          isPushSupported: () => boolean;
          addEventListener: (event: string, handler: (event: unknown) => void) => void;
        };
        User?: {
          PushSubscription?: {
            id?: string;
            token?: string;
            optedIn?: boolean;
          };
          addTag?: (key: string, value: string) => Promise<void>;
          addTags?: (tags: Record<string, string>) => Promise<void>;
        };
      };
    };

    if (w.OneSignal?.init) {
      return true;
    }

    w.OneSignalDeferred = w.OneSignalDeferred || [];

    // Inject OneSignal Web SDK script if not already present
    if (!document.getElementById('onesignal-sdk-script')) {
      const script = document.createElement('script');
      script.id = 'onesignal-sdk-script';
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.defer = true;
      document.head.appendChild(script);
    }

    return new Promise((resolve) => {
      w.OneSignalDeferred?.push(async (OneSignal) => {
        try {
          const os = OneSignal as typeof w.OneSignal;
          if (os?.init) {
            await os.init({
              appId,
              allowLocalhostAsSecureOrigin: true,
              notifyButton: {
                enable: false,
              },
            });
            resolve(true);
          } else {
            resolve(false);
          }
        } catch (err) {
          console.warn('[OneSignal] Initialization error:', err);
          resolve(false);
        }
      });
      // Safety timeout after 4s
      setTimeout(() => resolve(false), 4000);
    });
  } catch (err) {
    console.warn('[OneSignal] Script injection failed:', err);
    return false;
  }
}

/**
 * Requests push permission from user via OneSignal or browser standard API
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined') return 'default';

  try {
    const w = window as unknown as {
      OneSignal?: {
        Notifications?: {
          requestPermission: () => Promise<void>;
          permissionNative?: NotificationPermission;
        };
      };
    };

    if (w.OneSignal?.Notifications?.requestPermission) {
      await w.OneSignal.Notifications.requestPermission();
      if ('Notification' in window) {
        return Notification.permission;
      }
    }

    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      return perm;
    }
  } catch (e) {
    console.warn('[Push Notification] Error requesting permission:', e);
  }

  return 'denied';
}

/**
 * Dispatches an agronomic drought stress alert through the server route
 * (which proxies to OneSignal REST API) and falls back to local web push / UI notifications.
 */
export async function sendDroughtStressPushAlert(payload: PushNotificationPayload): Promise<{
  success: boolean;
  channel: 'onesignal' | 'browser-native' | 'in-app';
  details?: string;
}> {
  const appId = getOneSignalAppId();

  // 1. Attempt sending through OneSignal REST API endpoint
  if (appId) {
    try {
      const res = await fetch('/api/notifications/onesignal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId,
          title: payload.title,
          message: payload.message,
          url: payload.url || '/app',
          data: {
            alertType: 'drought_stress',
            fieldId: payload.fieldId,
            fieldName: payload.fieldName,
            crop: payload.crop,
            dsiScore: payload.dsiScore,
            level: payload.level,
            timestamp: new Date().toISOString(),
            ...payload.data,
          },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          // Play subtle audio chime if enabled
          playAlertChime();
          return { success: true, channel: 'onesignal', details: `Sent via OneSignal (ID: ${json.id || 'OK'})` };
        }
      }
    } catch (err) {
      console.warn('[OneSignal] Server dispatch failed, evaluating fallback:', err);
    }
  }

  // 2. Fallback to Browser Native Notification API if permitted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const notif = new Notification(payload.title, {
        body: payload.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `drought-${payload.fieldId || 'stress'}-${Date.now()}`,
        data: {
          url: payload.url || '/app',
        },
      });

      notif.onclick = () => {
        window.focus();
        if (payload.url) {
          window.location.href = payload.url;
        }
      };

      playAlertChime();
      return { success: true, channel: 'browser-native', details: 'Displayed via Browser Native Notification' };
    } catch {
      // ignore
    }
  }

  // 3. Fallback to In-App notification log
  playAlertChime();
  return {
    success: true,
    channel: 'in-app',
    details: 'Logged to in-app notification center (Push permission not granted or offline)',
  };
}

function playAlertChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const settings = getSavedOneSignalSettings();
    if (!settings.soundEnabled) return;

    // Use Web Audio API synthesize a crisp dual-tone acoustic alert
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  } catch {
    // Audio policy might block without user interaction
  }
}

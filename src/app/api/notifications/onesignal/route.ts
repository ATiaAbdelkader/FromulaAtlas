import { NextRequest, NextResponse } from 'next/server';
import { checkSecretHeader } from '@/lib/security-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface OneSignalPushRequest {
  appId?: string;
  title: string;
  message: string;
  url?: string;
  segments?: string[];
  externalUserIds?: string[];
  data?: Record<string, unknown>;
}

export async function POST(req: NextRequest) {
  // Auth: require admin secret — this route broadcasts to all OneSignal
  // subscribers, so it MUST NOT be publicly accessible.
  if (!checkSecretHeader(req, 'ADMIN_SECRET')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as OneSignalPushRequest;

    if (!body.title || !body.message) {
      return NextResponse.json(
        { error: 'Title and message are required for push notifications' },
        { status: 400 }
      );
    }

    // Always use the env var appId — ignore body.appId to prevent spoofing
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId) {
      return NextResponse.json(
        {
          success: false,
          warning: 'OneSignal App ID is not configured. Falling back to local browser push.',
          channel: 'browser-fallback',
        },
        { status: 200 }
      );
    }

    // If REST API key is not configured on the server, return a structured status
    // allowing the client SDK / native notification to handle broadcast
    if (!restApiKey) {
      return NextResponse.json(
        {
          success: true,
          channel: 'client-sdk',
          message: 'OneSignal App ID present; broadcast handled via client SDK or browser push.',
          data: body.data,
        },
        { status: 200 }
      );
    }

    // Call OneSignal Create Notification API (v1 / v9)
    const payload = {
      app_id: appId,
      headings: {
        en: body.title,
      },
      contents: {
        en: body.message,
      },
      included_segments: body.segments || ['All', 'Total Subscriptions'],
      url: body.url || 'https://formula-atlas.app/app',
      data: body.data || {},
      priority: 10, // high priority for drought stress
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
      android_channel_id: 'agri_alerts',
    };

    const oneSignalRes = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${restApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await oneSignalRes.json();

    if (!oneSignalRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error: responseData.errors || 'Failed to dispatch notification via OneSignal API',
          status: oneSignalRes.status,
        },
        { status: 200 } // keep 200 to allow client graceful fallback
      );
    }

    return NextResponse.json({
      success: true,
      id: responseData.id,
      recipients: responseData.recipients,
      externalId: responseData.external_id,
      channel: 'onesignal-rest',
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json(
      { error: errorMsg, success: false },
      { status: 500 }
    );
  }
}

export async function GET() {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const hasRestKey = Boolean(process.env.ONESIGNAL_REST_API_KEY);

  return NextResponse.json({
    status: 'online',
    service: 'Formula Atlas OneSignal Push Alert Dispatcher',
    configured: Boolean(appId),
    appIdConfigured: Boolean(appId),
    restApiKeyConfigured: hasRestKey,
    supportedAlerts: [
      'drought_stress_index',
      'frost_protection',
      'irrigation_schedule_start',
      'disease_risk_critical',
    ],
  });
}

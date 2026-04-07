/**
 * GET /api/health
 *
 * Health check endpoint for the Pix service.
 * Called every 2 minutes by ADMIN kernel health-poll cron.
 *
 * Returns service name, DB connectivity, uptime, and version.
 * No authentication required — public endpoint.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SERVICE_NAME = 'pix';
const VERSION = '0.0.1';

export async function GET() {
  const started = Date.now();

  const supabaseUrl  = process.env.NEXT_PUBLIC_PIX_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_PIX_SUPABASE_ANON_KEY;

  let dbStatus  = 'ok';
  let dbMessage: string | undefined;

  if (supabaseUrl && supabaseAnon) {
    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        method:  'HEAD',
        headers: {
          apikey:        supabaseAnon,
          Authorization: `Bearer ${supabaseAnon}`,
        },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok && res.status !== 200) {
        dbStatus  = 'degraded';
        dbMessage = `HTTP ${res.status}`;
      }
    } catch (err) {
      dbStatus  = 'error';
      dbMessage = err instanceof Error ? err.message : String(err);
    }
  } else {
    dbStatus  = 'unconfigured';
    dbMessage = 'Missing NEXT_PUBLIC_PIX_SUPABASE_URL or NEXT_PUBLIC_PIX_SUPABASE_ANON_KEY';
  }

  const elapsed_ms = Date.now() - started;
  const status     = dbStatus === 'ok' ? 200 : 503;

  return NextResponse.json(
    {
      service:    SERVICE_NAME,
      status:     dbStatus === 'ok' ? 'ok' : 'degraded',
      version:    VERSION,
      uptime_s:   Math.round(process.uptime()),
      db:         dbStatus,
      db_message: dbMessage,
      elapsed_ms,
      timestamp:  new Date().toISOString(),
    },
    { status }
  );
}

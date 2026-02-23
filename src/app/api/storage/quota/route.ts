/**
 * Storage quota proxy for pix.
 *
 * Returns the current user's EffectiveQuota by proxying to the ADMIN quota system.
 *
 * Required env vars:
 *   ADMIN_API_URL            — base URL of the ADMIN app
 *   ADMIN_INTERNAL_API_TOKEN — shared secret for server-to-server calls
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PLATFORM_SLUG = 'pix';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const adminRes = await fetch(
    `${process.env.ADMIN_API_URL}/api/storage/user-quota`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-token': process.env.ADMIN_INTERNAL_API_TOKEN ?? '',
      },
      body: JSON.stringify({ userId: user.id, platformSlug: PLATFORM_SLUG }),
    }
  );

  if (!adminRes.ok) {
    return NextResponse.json({ error: 'Failed to load quota' }, { status: 502 });
  }

  const { quota: q, usage: u } = await adminRes.json();

  const maxBytes = q.max_bytes ?? 52_428_800;
  const bytesUsed = u.bytes_used ?? 0;
  const fileCount = u.file_count ?? 0;
  const maxFileCount = q.max_file_count ?? 50;

  return NextResponse.json({
    id: q.id ?? '',
    tenantId: q.tenant_id ?? null,
    planCode: q.plan_code ?? 'free',
    maxBytes,
    maxFileCount,
    maxFileSizeBytes: q.max_file_size_bytes ?? 10_485_760,
    allowedMimeTypes: q.allowed_mime_types ?? [],
    active: true,
    notes: null,
    bytesUsed,
    fileCount,
    bytesRemaining: Math.max(0, maxBytes - bytesUsed),
    filesRemaining: maxFileCount === 0 ? null : Math.max(0, maxFileCount - fileCount),
    usageFraction: maxBytes === 0 ? 0 : Math.min(1, bytesUsed / maxBytes),
  });
}

/**
 * Storage upload proxy for pix.
 *
 * 1. Validates the user's session
 * 2. Checks storage quota via ADMIN
 * 3. Obtains a B2 upload URL
 * 4. Returns { uploadUrl, token, objectKey } for the client to upload directly
 *
 * Required env vars:
 *   ADMIN_API_URL            — ADMIN base URL
 *   ADMIN_INTERNAL_API_TOKEN — shared secret
 *   BACKBLAZE_KEY_ID         — B2 application key ID
 *   BACKBLAZE_APPLICATION_KEY — B2 application key
 *   PIX_B2_BUCKET_ID         — Backblaze bucket ID for pix
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PLATFORM_SLUG = 'pix';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  let body: { fileName?: string; mimeType?: string; sizeBytes?: number; objectKey?: string } = {};
  try {
    body = await request.json();
  } catch { /* ignore */ }

  const { fileName = 'upload', mimeType = 'application/octet-stream', sizeBytes = 0, objectKey } = body;

  // ── Quota gate ───────────────────────────────────────────────────────────
  const quotaRes = await fetch(
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

  if (!quotaRes.ok) {
    return NextResponse.json({ error: 'Failed to check quota' }, { status: 502 });
  }

  const { quota: q, usage: u } = await quotaRes.json();
  const bytesUsed = u.bytes_used ?? 0;
  const fileCount = u.file_count ?? 0;

  if (q.max_file_size_bytes && sizeBytes > q.max_file_size_bytes) {
    return NextResponse.json({ error: 'File exceeds per-file size limit', limit: q.max_file_size_bytes }, { status: 413 });
  }
  if (q.max_bytes && bytesUsed + sizeBytes > q.max_bytes) {
    return NextResponse.json({ error: 'Storage quota exceeded', quota: q.max_bytes, used: bytesUsed }, { status: 413 });
  }
  if (q.max_file_count && fileCount >= q.max_file_count) {
    return NextResponse.json({ error: 'File count quota exceeded', limit: q.max_file_count }, { status: 413 });
  }

  // ── B2 authorize ─────────────────────────────────────────────────────────
  const authStr = Buffer.from(
    `${process.env.BACKBLAZE_KEY_ID}:${process.env.BACKBLAZE_APPLICATION_KEY}`
  ).toString('base64');

  const authRes = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    headers: { Authorization: `Basic ${authStr}` },
  });
  if (!authRes.ok) {
    return NextResponse.json({ error: 'Storage service unavailable' }, { status: 502 });
  }
  const { apiUrl, authorizationToken: b2Token } = await authRes.json();

  // ── Get upload URL ────────────────────────────────────────────────────────
  const uploadUrlRes = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: 'POST',
    headers: { Authorization: b2Token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketId: process.env.PIX_B2_BUCKET_ID }),
  });
  if (!uploadUrlRes.ok) {
    return NextResponse.json({ error: 'Failed to get upload URL' }, { status: 502 });
  }
  const { uploadUrl, authorizationToken: uploadToken } = await uploadUrlRes.json();

  const resolvedKey = objectKey ?? `users/${user.id}/${Date.now()}_${fileName}`;

  return NextResponse.json({
    uploadUrl,
    token: uploadToken,
    objectKey: resolvedKey,
    contentType: mimeType,
  });
}

'use client';

import { useEffect } from 'react';
import { AuthCallback } from '@magicwrxtools/auth-tool';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();

  return <AuthCallback onSuccess={() => router.push('/account')} />;
}

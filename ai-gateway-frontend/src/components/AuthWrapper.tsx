'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated() && !pathname.startsWith('/login')) {
      router.push('/login');
    }
  }, [pathname, router]);

  if (!isAuthenticated() && !pathname.startsWith('/login')) {
    return null;
  }

  return <>{children}</>;
}

"use client";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Redirect root to the more useful cluster status page
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/cluster');
  }, [router]);

  return null;
}
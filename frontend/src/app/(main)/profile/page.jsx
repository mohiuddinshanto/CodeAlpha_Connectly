'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { FeedSkeleton } from '../../../components/FeedSkeleton';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { useAuthStore } from '../../../store/authStore';

function ProfileRedirect() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user?.id) {
      router.replace(`/profile/${user.id}`);
    }
  }, [user, router]);

  return <FeedSkeleton count={2} />;
}

export default function MyProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileRedirect />
    </ProtectedRoute>
  );
}

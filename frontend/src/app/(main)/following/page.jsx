'use client';

import { FeedView } from '../../../components/FeedView';
import { ProtectedRoute } from '../../../components/ProtectedRoute';

export default function FollowingPage() {
  return (
    <ProtectedRoute>
      <FeedView activeTab="following" />
    </ProtectedRoute>
  );
}

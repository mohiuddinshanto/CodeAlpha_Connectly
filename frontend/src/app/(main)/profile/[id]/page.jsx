'use client';

import { useParams } from 'next/navigation';
import { ProfileView } from '../../../../components/ProfileView';

export default function UserProfilePage() {
  const params = useParams();
  const userId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  return <ProfileView userId={userId} />;
}

'use client';

import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { SettingsView } from '../../../components/SettingsView';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsView />
    </ProtectedRoute>
  );
}

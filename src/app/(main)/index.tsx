import React from 'react';
import { useAuthStore } from '@/features/auth/model';
import { DashboardScreen } from '@/features/dashboard/ui/screens/DashboardScreen';
import { ConsumerDashboardScreen } from '@/features/consumer-dashboard/ui/screens/ConsumerDashboardScreen';

export default function MainScreen() {
  const { appMode } = useAuthStore();
  const isBusiness = appMode === 'BUSINESS';

  if (isBusiness) {
    return <DashboardScreen />;
  }

  // ─── VISTA PARA CLIENTE SIN NEGOCIO (B2C) ───
  return <ConsumerDashboardScreen />;
}

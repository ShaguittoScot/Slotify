import React from 'react';
import { CalendarView } from '@/features/calendar';
import { AdminOnlyGuard } from '@/components/AdminOnlyGuard';

export default function AgendaScreen() {
  return (
    <AdminOnlyGuard
      featureName="la Agenda Operativa del Negocio"
      description="Aquí se gestionan las citas, horarios de atención, bloqueos de sillones y disponibilidad de colaboradores."
    >
      <CalendarView />
    </AdminOnlyGuard>
  );
}

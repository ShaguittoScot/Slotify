import React from 'react';
import { ClientsScreen } from '@/features/clients/ui/screens/ClientsScreen';
import { AdminOnlyGuard } from '@/components/AdminOnlyGuard';

export default function Clients() {
  return (
    <AdminOnlyGuard
      featureName="el Directorio de Clientes"
      description="Aquí puedes ver la cartera de clientes, historial de servicios, notas y preferencias registradas por el establecimiento."
    >
      <ClientsScreen />
    </AdminOnlyGuard>
  );
}

import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ClientDetailModal } from '@/features/clients/ui/components/ClientDetailModal';
import type { BusinessClient } from '@/features/clients/types';

jest.setTimeout(15000);

jest.mock('@expo/vector-icons', () => ({
  Feather: () => null,
  MaterialCommunityIcons: () => null,
}));

jest.mock('@/shared/theme', () => ({
  useAppTheme: () => ({
    isDark: false,
    colors: {
      background: { primary: '#FFFFFF', secondary: '#F5F5F5' },
      border: { main: '#DDDDDD' },
      text: { primary: '#111111', secondary: '#555555', muted: '#666666' },
    },
  }),
}));

const client: BusinessClient = {
  id: 'sample-client',
  clientId: 'sample-client',
  isRegistered: true,
  firstName: 'Cliente',
  lastName: 'de prueba',
  fullName: 'Cliente de prueba',
  phone: '',
  email: '',
  appointments: [],
  createdAt: '2026-11-10T12:00:00Z',
  totalVisits: 0,
  completedVisits: 0,
  cancelledVisits: 0,
  totalSpent: 0,
};

const handlers = {
  onClose: jest.fn(),
  onEditClient: jest.fn(),
  onSaveNote: jest.fn(),
  onScheduleAppointment: jest.fn(),
};

test('Pide confirmar la eliminación de una ficha sin citas', async () => {
  const manage = jest.fn().mockResolvedValue(undefined);
  await render(<ClientDetailModal {...handlers} client={client} visible onManageClient={manage} />);

  await fireEvent.press(screen.getByTestId('btn-delete-client'));
  expect(manage).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByTestId('confirm-client-delete'));

  expect(manage).toHaveBeenCalledWith(client, 'delete');
});

test('Una ficha archivada con historial se puede restaurar y no se puede eliminar', async () => {
  const archived: BusinessClient = {
    ...client,
    archivedAt: '2026-11-10T13:00:00Z',
    appointments: [{
      id: 'apt-1',
      startTime: '2026-11-10T11:00:00Z',
      endTime: '2026-11-10T12:00:00Z',
      agreedTotal: 100,
      status: 'completed',
    }],
  };
  const manage = jest.fn().mockResolvedValue(undefined);
  await render(<ClientDetailModal {...handlers} client={archived} visible onManageClient={manage} />);

  expect(screen.queryByTestId('btn-delete-client')).toBeNull();
  await fireEvent.press(screen.getByTestId('btn-restore-client'));
  await fireEvent.press(screen.getByTestId('confirm-client-restore'));

  expect(manage).toHaveBeenCalledWith(archived, 'restore');
});

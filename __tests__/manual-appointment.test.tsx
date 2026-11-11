import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CreateAppointmentModal } from '@/features/calendar/ui/CreateAppointmentModal';

const mockSearchClients = jest.fn();
jest.mock('@/features/clients/api', () => ({
  searchClientOptions: (...args: unknown[]) => mockSearchClients(...args),
}));
jest.mock('@/features/sector-templates', () => ({
  useSectorTemplateStore: () => ({
    onboardingResult: { finalServices: [{ name: 'Servicio de prueba', price: 200, durationMinutes: 30 }] },
  }),
}));
jest.mock('@expo/vector-icons', () => ({ Feather: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
jest.mock('@/shared/theme', () => ({
  useAppTheme: () => ({
    isDark: false,
    colors: {
      background: { primary: '#FAFAFA', secondary: '#FFFFFF', backdrop: '#00000080' },
      border: { main: '#DDDDDD', strong: '#BBBBBB' },
      text: { primary: '#111111', secondary: '#555555', muted: '#666666' },
      status: { error: '#B91C1C', errorBg: '#FEE2E2' },
    },
  }),
}));

jest.setTimeout(15000);

test('autocompleta desde la cartera, aplica la duración elegida y envía la hora del negocio', async () => {
  const save = jest.fn().mockResolvedValue(undefined);
  mockSearchClients.mockResolvedValue([
    { id: 'registered-card', fullName: 'Cliente registrado', phone: '4421234567', email: '' },
  ]);
  await render(
    <CreateAppointmentModal visible employees={[]} scopeKey="owner:business" timeZone="America/Mexico_City"
      initialDate={new Date(Date.UTC(2026, 10, 10))} initialHour="09:30" onClose={jest.fn()} onSave={save} />
  );
  await fireEvent.changeText(screen.getByTestId('appointment-client-name'), 'Cliente');
  await fireEvent.press(await screen.findByText('Cliente registrado'));
  await fireEvent.press(screen.getByText('45 min'));
  await fireEvent.press(screen.getByTestId('save-manual-appointment'));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({
    businessClientId: 'registered-card', clientName: 'Cliente registrado', clientPhone: '4421234567',
    startTime: '2026-11-10T15:30:00.000Z', endTime: '2026-11-10T16:15:00.000Z',
  }));
});

test('permite agendar desde una ficha con teléfono largo sin perder el vínculo', async () => {
  const save = jest.fn().mockResolvedValue(undefined);
  await render(
    <CreateAppointmentModal visible employees={[]} scopeKey="owner:business" timeZone="America/Mexico_City"
      initialDate={new Date(Date.UTC(2026, 10, 10))} initialHour="09:30"
      initialClient={{ businessClientId: 'registered-card', fullName: 'Cliente registrado', phone: '+52 442 123 4567 ext. 12345' }}
      onClose={jest.fn()} onSave={save} />
  );
  expect(screen.getByText(/El teléfono de la ficha supera el límite/)).toBeTruthy();
  await fireEvent.press(screen.getByTestId('save-manual-appointment'));
  expect(save).toHaveBeenCalledWith(expect.objectContaining({
    businessClientId: 'registered-card',
    clientPhone: undefined,
  }));
});

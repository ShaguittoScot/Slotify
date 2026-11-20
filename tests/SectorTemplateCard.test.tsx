import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SectorTemplateCard } from '../src/features/sector-templates/ui/SectorTemplateCard';
import { CANONICAL_SECTOR_CATEGORIES } from '../src/features/sector-templates/constants';

const health = CANONICAL_SECTOR_CATEGORIES.find(
  (category) => category.key === 'salud-bienestar',
)!;
const custom = CANONICAL_SECTOR_CATEGORIES.find(
  (category) => category.key === 'otro-general',
)!;
const label = (category: typeof health) =>
  `${category.name}. ${category.tagline}`;

describe('Slotify | SectorTemplateCard | US-006', () => {
  test('CP-01: muestra el giro y una opcion accesible no seleccionada', async () => {
    // ARRANGE: preparar una categoria real y el receptor de seleccion.
    const onSelect = jest.fn();

    // ACT: renderizar la tarjeta con sus propiedades publicas.
    await render(
      <SectorTemplateCard
        category={health}
        isSelected={false}
        onSelect={onSelect}
      />,
    );

    // ASSERT: verificar contenido, accesibilidad y estado inicial.
    expect(screen.getByText(health.name)).toBeOnTheScreen();
    expect(screen.getByText(health.tagline)).toBeOnTheScreen();
    const option = screen.getByRole('radio', { name: label(health) });
    expect(option).toBeEnabled();
    expect(option).not.toBeSelected();
    expect(onSelect).not.toHaveBeenCalled();
  });

  test('CP-02: una pulsacion notifica una sola vez la categoria completa', async () => {
    // ARRANGE: montar la tarjeta habilitada y preparar una interaccion realista.
    const onSelect = jest.fn();
    const user = userEvent.setup();
    await render(
      <SectorTemplateCard
        category={health}
        isSelected={false}
        onSelect={onSelect}
      />,
    );

    // ACT: simular la secuencia tactil de una pulsacion.
    await user.press(screen.getByRole('radio', { name: label(health) }));

    // ASSERT: notificar el mismo objeto sin autoseleccionar el componente.
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toBe(health);
    expect(screen.getByRole('radio')).not.toBeSelected();
  });

  test('CP-03: una tarjeta deshabilitada no permite seleccionar el giro', async () => {
    // ARRANGE: montar la tarjeta bloqueada y preparar el usuario simulado.
    const onSelect = jest.fn();
    const user = userEvent.setup();
    await render(
      <SectorTemplateCard
        category={health}
        isSelected={false}
        disabled
        onSelect={onSelect}
      />,
    );

    // ACT: intentar pulsar la opcion deshabilitada.
    await user.press(screen.getByRole('radio', { name: label(health) }));

    // ASSERT: exponer el bloqueo y evitar el callback de seleccion.
    expect(screen.getByRole('radio')).toBeDisabled();
    expect(screen.getByRole('radio')).not.toBeSelected();
    expect(onSelect).not.toHaveBeenCalled();
  });

  test('CP-04: refleja la seleccion recibida desde el componente padre', async () => {
    // ARRANGE: montar inicialmente una opcion no seleccionada.
    const onSelect = jest.fn();
    const { rerender } = await render(
      <SectorTemplateCard
        category={health}
        isSelected={false}
        onSelect={onSelect}
      />,
    );

    // ACT: el padre actualiza isSelected sin una pulsacion adicional.
    await rerender(
      <SectorTemplateCard
        category={health}
        isSelected
        onSelect={onSelect}
      />,
    );

    // ASSERT: la accesibilidad refleja el nuevo estado sin emitir eventos.
    expect(screen.getByRole('radio', { name: label(health) })).toBeSelected();
    expect(onSelect).not.toHaveBeenCalled();
  });

  test('CP-05: al cambiar a modo libre usa la nueva categoria y no la anterior', async () => {
    // ARRANGE: montar Salud y preparar la categoria canonica de modo libre.
    const onSelect = jest.fn();
    const user = userEvent.setup();
    const { rerender } = await render(
      <SectorTemplateCard
        category={health}
        isSelected={false}
        onSelect={onSelect}
      />,
    );

    // ACT: cambiar las propiedades a modo libre y pulsar esa nueva opcion.
    await rerender(
      <SectorTemplateCard
        category={custom}
        isSelected={false}
        onSelect={onSelect}
      />,
    );
    await user.press(screen.getByRole('radio', { name: label(custom) }));

    // ASSERT: actualizar contenido y entregar el objeto nuevo con su bandera.
    expect(screen.getByText(custom.name)).toBeOnTheScreen();
    expect(screen.queryByRole('radio', { name: label(health) })).toBeNull();
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0]).toBe(custom);
    expect(onSelect.mock.calls[0][0].isCustomCanvas).toBe(true);
  });
});


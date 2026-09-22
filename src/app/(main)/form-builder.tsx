import { FormBuilderScreen } from '@/features/dashboard/ui/screens/FormBuilderScreen';
import { Stack } from 'expo-router';
import { useAppTheme } from '@/shared/theme';

export default function FormBuilderRoute() {
  const { colors } = useAppTheme();
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Configurar Formulario',
          headerStyle: { backgroundColor: colors.background.primary },
          headerTintColor: colors.text.primary,
          headerBackTitleVisible: false,
        }}
      />
      <FormBuilderScreen />
    </>
  );
}

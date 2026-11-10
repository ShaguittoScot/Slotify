import { FormBuilderScreen } from '@/features/dashboard/ui/screens/FormBuilderScreen';
import { Stack, useRouter } from 'expo-router';
import { useAppTheme } from '@/shared/theme';
import { TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AdminOnlyGuard } from '@/components/AdminOnlyGuard';

export default function FormBuilderRoute() {
  const { colors } = useAppTheme();
  const router = useRouter();
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Configurar Formulario',
          headerStyle: { backgroundColor: colors.background.primary },
          headerTintColor: colors.text.primary,
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(main)' as any)}>
              <Feather name="x" size={24} color={colors.text.primary} style={{ marginRight: 10 }} />
            </TouchableOpacity>
          ),
        }}
      />
      <AdminOnlyGuard
        featureName="el Constructor de Formularios e Identidad de Marca"
        description="Esta herramienta permite a los administradores personalizar los campos del formulario público de reservas, colores corporativos y logotipo del negocio."
      >
        <FormBuilderScreen />
      </AdminOnlyGuard>
    </>
  );
}

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
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Cerrar configuración de formulario"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => router.canGoBack() ? router.back() : router.replace('/(main)' as any)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                marginLeft: 12,
                marginRight: 10,
                backgroundColor: colors.background.secondary,
                borderWidth: 1,
                borderColor: colors.border.main,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="x" size={18} color={colors.text.primary} />
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

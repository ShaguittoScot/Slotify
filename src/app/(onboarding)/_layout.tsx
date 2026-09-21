import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade', // Soft fade to the onboarding
      }}
    >
      <Stack.Screen name="wizard" />
    </Stack>
  );
}

import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';

export default function AuthOnboardingRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(onboarding)/wizard');
  }, [router]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
      <ActivityIndicator size="large" color="#C57747" />
    </View>
  );
}

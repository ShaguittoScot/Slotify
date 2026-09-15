import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn, withRepeat, withTiming, useSharedValue, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { useAuthStore } from '@/features/auth/model';

const { width } = Dimensions.get('window');

export default function RegisterSuccessScreen() {
  const setJustRegistered = useAuthStore(state => state.setJustRegistered);
  
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    pulseValue.value = withRepeat(
      withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1, // infinite
      true // reverse
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }]
  }));

  const handleContinue = () => {
    // This will toggle the flag in Zustand.
    // The _layout.tsx will detect isJustRegistered is false and immediately redirect to /(main).
    setJustRegistered(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Background decoration */}
      <View style={styles.backgroundBlob1} />
      <View style={styles.backgroundBlob2} />

      <View style={styles.content}>
        
        <Animated.View style={[styles.iconContainer, pulseStyle]} entering={FadeIn.duration(800).delay(200)}>
          <View style={styles.iconCircle}>
            <AntDesign name="check" size={50} color="#FFFFFF" />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(800).delay(400)} style={styles.textContainer}>
          <Text style={styles.title}>¡Cuenta Creada!</Text>
          <Text style={styles.subtitle}>
            Tu negocio ha sido registrado exitosamente en Slotify.
            Estás a un paso de revolucionar la forma en que gestionas tus reservas.
          </Text>
        </Animated.View>

      </View>

      <Animated.View entering={FadeInDown.duration(800).delay(600)} style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Configurar mi Negocio</Text>
          <AntDesign name="right" size={20} color="#FFFFFF" style={styles.buttonIcon} />
        </TouchableOpacity>
      </Animated.View>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  backgroundBlob1: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(66, 153, 225, 0.1)',
  },
  backgroundBlob2: {
    position: 'absolute',
    bottom: -150,
    right: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(159, 122, 234, 0.1)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 40,
    shadowColor: '#4299E1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4299E1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: 'rgba(66, 153, 225, 0.2)',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2D3748',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
  },
  button: {
    backgroundColor: '#1A202C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 100,
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 12,
  }
});

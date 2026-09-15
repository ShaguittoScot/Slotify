import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { FloatingBackgroundCards } from './FloatingBackgroundCards';

export const WelcomeScreen = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        
        {/* Animated Background Cards */}
        <FloatingBackgroundCards />

        {/* Foreground Content */}
        <View style={styles.content}>
          
          <View style={styles.centerSection}>
            <Animated.View 
              entering={FadeIn.duration(400).delay(100)} 
              style={styles.logoContainer}
            >
              {/* Replace with your actual Logo Image later */}
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoPlaceholderText}>S</Text>
              </View>
            </Animated.View>

            <Animated.Text 
              entering={FadeInUp.duration(400).delay(200)} 
              style={styles.title}
            >
              Gestiona tus citas al instante
            </Animated.Text>
          </View>

          <View style={styles.bottomSection}>
            <Animated.View entering={FadeInDown.duration(400).delay(300)}>
              <TouchableOpacity 
                style={styles.primaryButton}
                activeOpacity={0.8}
                onPress={() => router.push('/(auth)/register')}
              >
                <Text style={styles.primaryButtonText}>Crear cuenta</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(400)}>
              <TouchableOpacity 
                style={styles.secondaryButton}
                activeOpacity={0.8}
                onPress={() => router.push('/(auth)/login')}
              >
                <Text style={styles.secondaryButtonText}>Iniciar sesión</Text>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.Text 
              entering={FadeInDown.duration(400).delay(500)} 
              style={styles.termsText}
            >
              Al continuar, aceptas nuestros términos y condiciones.
            </Animated.Text>
          </View>

        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: Platform.OS === 'ios' ? 20 : 40,
    zIndex: 10,
  },
  centerSection: {
    alignItems: 'center',
    marginTop: '20%',
  },
  logoContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 30,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 35,
    backgroundColor: '#1A202C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoPlaceholderText: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A202C',
    textAlign: 'center',
    lineHeight: 40,
    paddingHorizontal: 20,
  },
  bottomSection: {
    width: '100%',
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#1A202C',
    borderRadius: 100, // Fully rounded like the reference
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: '#1A202C',
    fontSize: 18,
    fontWeight: '700',
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#A0AEC0',
    marginTop: 10,
  },
});

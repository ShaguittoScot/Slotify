import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FloatingBackgroundCards } from './FloatingBackgroundCards';

const BlobLogo = ({ onPress }: { onPress: () => void }) => {
  const br1 = useSharedValue(60);
  const br2 = useSharedValue(40);
  const br3 = useSharedValue(50);
  const br4 = useSharedValue(70);
  const scale = useSharedValue(1);

  useEffect(() => {
    const config = { duration: 2500, easing: Easing.inOut(Easing.sin) };
    br1.value = withRepeat(withSequence(withTiming(40, config), withTiming(60, config)), -1, true);
    br2.value = withRepeat(withSequence(withTiming(70, config), withTiming(40, config)), -1, true);
    br3.value = withRepeat(withSequence(withTiming(45, config), withTiming(75, config)), -1, true);
    br4.value = withRepeat(withSequence(withTiming(55, config), withTiming(40, config)), -1, true);
  }, []);

  const handlePressIn = () => {
    scale.value = withTiming(0.85, { duration: 100 });
  };
  
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.back(2.5)) });
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      borderTopLeftRadius: br1.value,
      borderTopRightRadius: br2.value,
      borderBottomRightRadius: br3.value,
      borderBottomLeftRadius: br4.value,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.blobContainer, animatedStyle]}>
        <Image 
          source={require('../../../../assets/images/logo.png')} 
          style={{ width: 80, height: 80 }} 
          resizeMode="contain" 
        />
      </Animated.View>
    </Pressable>
  );
};

export const WelcomeScreen = () => {
  const router = useRouter();
  const [burstCounter, setBurstCounter] = useState(0);

  const handleLogoPress = () => {
    setBurstCounter(prev => prev + 1);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Animated Background Cards */}
        <FloatingBackgroundCards burstCounter={burstCounter} />

        {/* Foreground Content */}
        <View style={styles.content}>

          <View style={styles.centerSection}>
            <Animated.View
              entering={FadeIn.duration(400).delay(100)}
              style={styles.logoWrapper}
            >
              <BlobLogo onPress={handleLogoPress} />
              {/* Optional little dot decoration like the reference image */}
              <View style={styles.decorativeDot} />
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
    paddingTop: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 40,
    zIndex: 10,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 60, // Sits just above the buttons
  },
  logoWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 30,
    position: 'relative',
  },
  blobContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#FFFFFF', // Blanco para que contraste con el logo oscuro
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  decorativeDot: {
    position: 'absolute',
    top: 5,
    right: -10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF', // Punto blanco también
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

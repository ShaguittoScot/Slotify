import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/features/auth/model';
import { useRouter } from 'expo-router';

const SECTORS = [
  { id: 1, name: 'Barbería', icon: 'mustache' },
  { id: 2, name: 'Estética / Salón', icon: 'content-cut' },
  { id: 3, name: 'Spa', icon: 'spa' },
  { id: 4, name: 'Consultorio Médico', icon: 'doctor' },
  { id: 5, name: 'Clínica Dental', icon: 'tooth-outline' },
  { id: 6, name: 'Abogado', icon: 'briefcase-outline' },
  { id: 7, name: 'Tutor / Clases', icon: 'school-outline' },
  { id: 8, name: 'Mecánico', icon: 'car-wrench' },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [selectedSector, setSelectedSector] = useState<number | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  
  const completeOnboarding = useAuthStore(state => state.completeOnboarding);
  const isLoading = useAuthStore(state => state.isLoading);
  const error = useAuthStore(state => state.error);
  
  const handleNext = () => {
    if (selectedSector) setStep(2);
  };

  const handleFinish = async () => {
    if (!businessName || !businessPhone || !selectedSector) return;
    try {
      await completeOnboarding({
        businessName,
        businessPhone,
        sectorTemplateId: selectedSector,
        fullName: useAuthStore.getState().user?.fullName || 'Pendiente' // Si no capturamos fullName antes
      });
      // Routing is automatic via _layout.tsx based on businessId
    } catch (e) {
      console.error(e);
    }
  };

  const renderStep1 = () => (
    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
      <Text style={styles.title}>¿A qué se dedica tu negocio?</Text>
      <Text style={styles.subtitle}>Selecciona el giro para personalizar tu experiencia.</Text>

      <ScrollView contentContainerStyle={styles.grid}>
        {SECTORS.map((sector) => {
          const isSelected = selectedSector === sector.id;
          return (
            <TouchableOpacity 
              key={sector.id} 
              style={[styles.card, isSelected && styles.cardSelected]}
              onPress={() => setSelectedSector(sector.id)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                <MaterialCommunityIcons 
                  name={sector.icon as any} 
                  size={32} 
                  color={isSelected ? '#FFFFFF' : '#4A5568'} 
                />
              </View>
              <Text style={[styles.cardText, isSelected && styles.cardTextSelected]}>{sector.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity 
        style={[styles.button, !selectedSector && styles.buttonDisabled]} 
        onPress={handleNext}
        disabled={!selectedSector}
      >
        <Text style={styles.buttonText}>Continuar</Text>
        <AntDesign name="arrowright" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
      <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
        <AntDesign name="arrowleft" size={24} color="#1A202C" />
      </TouchableOpacity>
      
      <Text style={styles.title}>Casi listos</Text>
      <Text style={styles.subtitle}>Configura los datos básicos de tu negocio para empezar.</Text>

      <View style={styles.formContainer}>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre de tu negocio</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Barbería Central"
            placeholderTextColor="#A0AEC0"
            value={businessName}
            onChangeText={setBusinessName}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Teléfono del negocio</Text>
          <TextInput
            style={styles.input}
            placeholder="555-123-4567"
            placeholderTextColor="#A0AEC0"
            keyboardType="phone-pad"
            value={businessPhone}
            onChangeText={setBusinessPhone}
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity 
          style={[styles.button, (!businessName || !businessPhone || isLoading) && styles.buttonDisabled]} 
          onPress={handleFinish}
          disabled={!businessName || !businessPhone || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Comenzar a usar Slotify</Text>
          )}
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
          </View>
          <Text style={styles.progressText}>Paso {step} de 2</Text>
        </View>

        {step === 1 ? renderStep1() : renderStep2()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginRight: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4299E1',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#718096',
  },
  stepContainer: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2D3748',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 32,
    lineHeight: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#4299E1',
    backgroundColor: '#EBF8FF',
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EDF2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBoxSelected: {
    backgroundColor: '#4299E1',
  },
  cardText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    textAlign: 'center',
  },
  cardTextSelected: {
    color: '#2B6CB0',
    fontWeight: '700',
  },
  button: {
    backgroundColor: '#1A202C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 100,
    marginTop: 'auto',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2D3748',
  },
  errorBox: {
    backgroundColor: '#FED7D7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#C53030',
    fontSize: 14,
    textAlign: 'center',
  },
});

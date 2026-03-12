import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';

export default function RegisterScreen() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', password: '',
  });
  const { register, isLoading } = useAuthStore();

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.firstName || !form.email || !form.password) {
      return Alert.alert('Erreur', 'Remplis les champs obligatoires');
    }
    try {
      await register(form);
      router.replace('/auth/onboarding');
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Inscription impossible');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Créer votre compte</Text>

        {[
          { key: 'firstName', label: 'Prénom *', keyboard: 'default' },
          { key: 'lastName', label: 'Nom', keyboard: 'default' },
          { key: 'email', label: 'Email *', keyboard: 'email-address' },
          { key: 'phone', label: 'Téléphone', keyboard: 'phone-pad' },
          { key: 'password', label: 'Mot de passe *', keyboard: 'default', secure: true },
        ].map(({ key, label, keyboard, secure }) => (
          <TextInput
            key={key}
            style={styles.input}
            placeholder={label}
            placeholderTextColor="#aaa"
            keyboardType={keyboard as any}
            autoCapitalize="none"
            secureTextEntry={secure}
            value={(form as any)[key]}
            onChangeText={set(key)}
          />
        ))}

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Créer mon compte</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', padding: 24, paddingTop: 60, gap: 14 },
  title: { fontSize: 28, fontWeight: '800', color: '#6C47FF', marginBottom: 12 },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12,
    padding: 16, fontSize: 16, color: '#000',
  },
  btn: {
    backgroundColor: '#6C47FF', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', color: '#6C47FF', marginTop: 8 },
});

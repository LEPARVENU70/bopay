import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Linking
} from 'react-native';
import { router } from 'expo-router';
import { merchantsApi } from '../../services/api';
import { useAuthStore } from '../../store/auth.store';

export default function OnboardingScreen() {
  const { refreshToken } = useAuthStore();
  const [form, setForm] = useState({
    businessName: '', email: '', phone: '', siret: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (key: string) => (val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleCreate = async () => {
    if (!form.businessName || !form.email) {
      return Alert.alert('Erreur', 'Nom du commerce et email requis');
    }
    setLoading(true);
    try {
      const { onboardingUrl } = await merchantsApi.create(form);
      // Refresh JWT so merchantId is included in future requests
      await refreshToken();
      // Open Stripe Connect onboarding in browser
      await Linking.openURL(onboardingUrl);
      router.replace('/(tabs)');
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible de créer le commerce');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Votre commerce</Text>
        <Text style={styles.subtitle}>
          Ces informations servent à configurer votre compte de paiement Stripe.
        </Text>
      </View>

      {[
        { key: 'businessName', label: 'Nom du commerce *', keyboard: 'default' },
        { key: 'email', label: 'Email du commerce *', keyboard: 'email-address' },
        { key: 'phone', label: 'Téléphone', keyboard: 'phone-pad' },
        { key: 'siret', label: 'SIRET (optionnel)', keyboard: 'numeric' },
      ].map(({ key, label, keyboard }) => (
        <TextInput
          key={key}
          style={styles.input}
          placeholder={label}
          placeholderTextColor="#aaa"
          keyboardType={keyboard as any}
          autoCapitalize="none"
          value={(form as any)[key]}
          onChangeText={set(key)}
        />
      ))}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Vous allez être redirigé vers Stripe pour finaliser votre vérification d'identité (KYC). C'est obligatoire pour encaisser des paiements.
        </Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleCreate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Continuer vers la vérification</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', padding: 24, paddingTop: 60, gap: 16 },
  header: { marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#6C47FF' },
  subtitle: { fontSize: 14, color: '#666', marginTop: 8, lineHeight: 20 },
  input: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12,
    padding: 16, fontSize: 16, color: '#000',
  },
  infoBox: {
    backgroundColor: '#F0ECFF', borderRadius: 12, padding: 16,
  },
  infoText: { color: '#6C47FF', fontSize: 13, lineHeight: 20 },
  btn: {
    backgroundColor: '#6C47FF', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

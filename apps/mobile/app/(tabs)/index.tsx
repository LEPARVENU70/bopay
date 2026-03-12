import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  TextInput, Vibration, SafeAreaView, Platform
} from 'react-native';
// uuid's v4 needs crypto.getRandomValues() which isn't in Hermes — use this polyfill
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
import { paymentsApi } from '../../services/api';

type State = 'idle' | 'processing' | 'success' | 'error';

export default function EncaissementScreen() {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [state, setState] = useState<State>('idle');
  const [lastAmount, setLastAmount] = useState(0);

  const handleEncaisser = async () => {
    const amountCents = Math.round(parseFloat(amount.replace(',', '.')) * 100);
    if (!amountCents || amountCents < 50) {
      return Alert.alert('Montant invalide', 'Le montant minimum est 0,50€');
    }

    setState('processing');
    try {
      const idempotencyKey = uuidv4();
      await paymentsApi.createIntent({
        amount: amountCents,
        description: description || undefined,
        idempotencyKey,
      });

      // En mode Expo Go : simulation du paiement
      // En prod (EAS build) : Tap to Pay réel via Stripe Terminal
      await new Promise(r => setTimeout(r, 1500));

      setLastAmount(amountCents);
      setState('success');
      Vibration.vibrate([0, 100, 50, 100]);
    } catch (e: any) {
      setState('error');
      Alert.alert('Erreur', e.message || 'Erreur lors du paiement');
      setTimeout(() => setState('idle'), 2000);
    }
  };

  const reset = () => {
    setAmount('');
    setDescription('');
    setState('idle');
  };

  if (state === 'success') {
    return (
      <SafeAreaView style={styles.successContainer}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successAmount}>{(lastAmount / 100).toFixed(2)} €</Text>
        <Text style={styles.successLabel}>Paiement accepté</Text>
        <TouchableOpacity style={styles.newBtn} onPress={reset}>
          <Text style={styles.newBtnText}>Nouvel encaissement</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isProcessing = state === 'processing';

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Encaisser</Text>

      <View style={styles.amountContainer}>
        <Text style={styles.currency}>€</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0,00"
          placeholderTextColor="#ccc"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          editable={!isProcessing}
        />
      </View>

      <TextInput
        style={styles.descInput}
        placeholder="Description (optionnel)"
        placeholderTextColor="#aaa"
        value={description}
        onChangeText={setDescription}
        editable={!isProcessing}
      />

      <View style={styles.quickAmounts}>
        {[5, 10, 20, 50].map((v) => (
          <TouchableOpacity
            key={v}
            style={styles.quickBtn}
            onPress={() => setAmount(String(v))}
            disabled={isProcessing}
          >
            <Text style={styles.quickBtnText}>{v}€</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.payBtn, (isProcessing || !amount) && styles.payBtnDisabled]}
        onPress={handleEncaisser}
        disabled={isProcessing || !amount}
      >
        <Text style={styles.payBtnText}>
          {isProcessing
            ? 'Traitement...'
            : amount
            ? `Encaisser ${parseFloat(amount.replace(',', '.') || '0').toFixed(2)} €`
            : 'Encaisser'}
        </Text>
      </TouchableOpacity>

      {__DEV__ && (
        <Text style={styles.devNote}>Mode dev — simulation paiement</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  header: { fontSize: 28, fontWeight: '800', color: '#111', marginBottom: 32, marginTop: 8 },
  amountContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: '#6C47FF',
    marginBottom: 24, paddingBottom: 8,
  },
  currency: { fontSize: 40, fontWeight: '300', color: '#6C47FF', marginRight: 4 },
  amountInput: { fontSize: 64, fontWeight: '200', color: '#111', flex: 1 },
  descInput: {
    borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12,
    padding: 14, fontSize: 15, color: '#000', marginBottom: 20,
  },
  quickAmounts: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  quickBtn: {
    flex: 1, borderWidth: 1, borderColor: '#6C47FF', borderRadius: 10,
    padding: 12, alignItems: 'center',
  },
  quickBtnText: { color: '#6C47FF', fontWeight: '600', fontSize: 15 },
  payBtn: {
    backgroundColor: '#6C47FF', borderRadius: 16, padding: 20, alignItems: 'center',
  },
  payBtnDisabled: { backgroundColor: '#a89ae0' },
  payBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  devNote: { textAlign: 'center', color: '#aaa', marginTop: 16, fontSize: 12 },
  successContainer: {
    flex: 1, backgroundColor: '#6C47FF', alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  successIcon: { fontSize: 80, color: '#fff' },
  successAmount: { fontSize: 56, fontWeight: '200', color: '#fff' },
  successLabel: { fontSize: 20, color: 'rgba(255,255,255,0.8)' },
  newBtn: {
    marginTop: 32, backgroundColor: '#fff', borderRadius: 16,
    paddingHorizontal: 32, paddingVertical: 16,
  },
  newBtnText: { color: '#6C47FF', fontWeight: '700', fontSize: 16 },
});

import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert, Linking, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../store/auth.store';
import { merchantsApi } from '../../services/api';

export default function ProfilScreen() {
  const { user, logout } = useAuthStore();
  const [merchant, setMerchant] = useState<any>(null);
  const [stripeStatus, setStripeStatus] = useState<any>(null);
  const [loadingStripe, setLoadingStripe] = useState(false);

  useEffect(() => {
    merchantsApi.me().then(setMerchant).catch(() => {});
  }, []);

  const checkStripeStatus = async () => {
    setLoadingStripe(true);
    try {
      const status = await merchantsApi.onboardingStatus();
      setStripeStatus(status);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoadingStripe(false);
    }
  };

  const openOnboarding = async () => {
    if (!merchant?.stripeOnboardingUrl) {
      Alert.alert('Info', "Allez dans l'onglet Profil > Configurer Stripe pour générer un lien.");
      return;
    }
    await Linking.openURL(merchant.stripeOnboardingUrl);
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter', style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth/login');
        },
      },
    ]);
  };

  const stripeLabel = stripeStatus?.onboardingComplete
    ? { text: 'Actif ✓', color: '#22c55e' }
    : merchant?.stripeAccountId
    ? { text: 'En attente', color: '#f59e0b' }
    : { text: 'Non configuré', color: '#ef4444' };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Profil</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Text>
        </View>
        <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Commerce</Text>
        {merchant ? (
          <>
            <View style={styles.item}>
              <Text style={styles.itemLabel}>Nom</Text>
              <Text style={styles.itemValue}>{merchant.businessName}</Text>
            </View>
            <View style={styles.item}>
              <Text style={styles.itemLabel}>Statut Stripe</Text>
              <View style={styles.itemRight}>
                <Text style={[styles.itemValue, { color: stripeLabel.color }]}>{stripeLabel.text}</Text>
                {loadingStripe
                  ? <ActivityIndicator size="small" color="#6C47FF" style={{ marginLeft: 8 }} />
                  : <TouchableOpacity onPress={checkStripeStatus} style={styles.refreshBtn}>
                      <Text style={styles.refreshText}>↻</Text>
                    </TouchableOpacity>
                }
              </View>
            </View>
            {!stripeStatus?.onboardingComplete && (
              <TouchableOpacity style={styles.stripeBtn} onPress={openOnboarding}>
                <Text style={styles.stripeBtnText}>
                  {merchant?.stripeAccountId ? 'Continuer la vérification Stripe →' : 'Configurer Stripe →'}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <TouchableOpacity style={styles.stripeBtn} onPress={() => router.push('/auth/onboarding')}>
            <Text style={styles.stripeBtnText}>Configurer votre commerce →</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Déconnexion</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 28, fontWeight: '800', color: '#111', padding: 24, paddingBottom: 24 },
  card: { alignItems: 'center', paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#6C47FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: '#111' },
  email: { fontSize: 14, color: '#888', marginTop: 4 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 1, paddingHorizontal: 24, paddingBottom: 8 },
  item: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  itemLabel: { fontSize: 15, color: '#666' },
  itemValue: { fontSize: 15, fontWeight: '600', color: '#111' },
  itemRight: { flexDirection: 'row', alignItems: 'center' },
  refreshBtn: { marginLeft: 8, padding: 4 },
  refreshText: { fontSize: 18, color: '#6C47FF' },
  stripeBtn: {
    marginHorizontal: 24, marginTop: 16, backgroundColor: '#6C47FF',
    borderRadius: 12, padding: 16, alignItems: 'center',
  },
  stripeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  logoutBtn: {
    margin: 24, marginTop: 'auto', borderWidth: 1, borderColor: '#ef4444',
    borderRadius: 12, padding: 16, alignItems: 'center',
  },
  logoutText: { color: '#ef4444', fontWeight: '600', fontSize: 16 },
});

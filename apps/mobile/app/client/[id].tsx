import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { customersApi } from '../../services/api';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  succeeded: { label: 'Accepté', color: '#22c55e' },
  failed: { label: 'Refusé', color: '#ef4444' },
  canceled: { label: 'Annulé', color: '#f59e0b' },
  pending: { label: 'En cours', color: '#6C47FF' },
};

function initials(c: any) {
  const f = c.firstName?.[0] || '';
  const l = c.lastName?.[0] || '';
  return (f + l).toUpperCase() || c.email?.[0]?.toUpperCase() || '?';
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customersApi.get(id).then(setCustomer).finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#6C47FF" style={{ marginTop: 60 }} />
      </SafeAreaView>
    );
  }

  if (!customer) return null;

  const displayName = customer.firstName || customer.lastName
    ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim()
    : customer.email || 'Client anonyme';

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color="#6C47FF" />
        <Text style={styles.backText}>Clients</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar + nom */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(customer)}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          {customer.email && <Text style={styles.email}>{customer.email}</Text>}
          {customer.phone && <Text style={styles.phone}>{customer.phone}</Text>}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{customer.totalVisits}</Text>
            <Text style={styles.statLabel}>Visites</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{(Number(customer.totalSpent) / 100).toFixed(2)} €</Text>
            <Text style={styles.statLabel}>Total dépensé</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {customer.lastVisitAt
                ? new Date(customer.lastVisitAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                : '-'}
            </Text>
            <Text style={styles.statLabel}>Dernière visite</Text>
          </View>
        </View>

        {/* Historique */}
        <Text style={styles.sectionTitle}>Historique</Text>
        {customer.payments?.length === 0 && (
          <Text style={styles.empty}>Aucun paiement</Text>
        )}
        {customer.payments?.map((p: any) => {
          const status = STATUS_LABEL[p.status] || { label: p.status, color: '#888' };
          const date = new Date(p.createdAt);
          return (
            <View key={p.id} style={styles.payRow}>
              <View style={styles.payLeft}>
                <Text style={styles.payAmount}>{(Number(p.amount) / 100).toFixed(2)} €</Text>
                <Text style={styles.payDesc}>{p.description || 'Paiement'}</Text>
                <Text style={styles.payDate}>
                  {date.toLocaleDateString('fr-FR')} {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: status.color + '20' }]}>
                <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 },
  backText: { color: '#6C47FF', fontSize: 16, marginLeft: 2 },
  scroll: { paddingBottom: 40 },
  avatarWrap: { alignItems: 'center', paddingVertical: 28 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#EDE9FF',
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { color: '#6C47FF', fontWeight: '800', fontSize: 26 },
  name: { fontSize: 22, fontWeight: '800', color: '#111' },
  email: { fontSize: 14, color: '#888', marginTop: 4 },
  phone: { fontSize: 14, color: '#888', marginTop: 2 },
  statsRow: { flexDirection: 'row', marginHorizontal: 24, gap: 10, marginBottom: 28 },
  statCard: {
    flex: 1, backgroundColor: '#F8F7FF', borderRadius: 14,
    padding: 14, alignItems: 'center',
  },
  statValue: { fontSize: 16, fontWeight: '800', color: '#6C47FF' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111', paddingHorizontal: 24, marginBottom: 4 },
  payRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  payLeft: { flex: 1 },
  payAmount: { fontSize: 16, fontWeight: '700', color: '#111' },
  payDesc: { fontSize: 13, color: '#666', marginTop: 2 },
  payDate: { fontSize: 12, color: '#aaa', marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 20, fontSize: 14 },
});

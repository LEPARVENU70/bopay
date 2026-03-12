import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, SafeAreaView
} from 'react-native';
import { paymentsApi } from '../../services/api';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  succeeded: { label: 'Accepté', color: '#22c55e' },
  failed: { label: 'Refusé', color: '#ef4444' },
  canceled: { label: 'Annulé', color: '#f59e0b' },
  pending: { label: 'En cours', color: '#6C47FF' },
};

export default function HistoriqueScreen() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = async (p = 1) => {
    try {
      const data = await paymentsApi.list(p);
      if (p === 1) setPayments(data.data);
      else setPayments(prev => [...prev, ...data.data]);
      setHasMore(p < data.lastPage);
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalToday = payments
    .filter(p => {
      const d = new Date(p.createdAt);
      const now = new Date();
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && p.status === 'succeeded';
    })
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Historique</Text>

      <View style={styles.todayCard}>
        <Text style={styles.todayLabel}>Encaissé aujourd'hui</Text>
        <Text style={styles.todayAmount}>{(totalToday / 100).toFixed(2)} €</Text>
      </View>

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(1)} />}
        onEndReached={() => hasMore && load(page + 1)}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => {
          const status = STATUS_LABEL[item.status] || { label: item.status, color: '#888' };
          const date = new Date(item.createdAt);
          return (
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.rowAmount}>{(Number(item.amount) / 100).toFixed(2)} €</Text>
                <Text style={styles.rowDesc}>{item.description || 'Paiement'}</Text>
                <Text style={styles.rowDate}>
                  {date.toLocaleDateString('fr-FR')} {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>Aucun paiement pour l'instant</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 28, fontWeight: '800', color: '#111', padding: 24, paddingBottom: 16 },
  todayCard: {
    marginHorizontal: 24, marginBottom: 16, backgroundColor: '#F0ECFF',
    borderRadius: 16, padding: 20,
  },
  todayLabel: { color: '#6C47FF', fontSize: 13, fontWeight: '600' },
  todayAmount: { fontSize: 36, fontWeight: '700', color: '#6C47FF', marginTop: 4 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  rowLeft: { flex: 1 },
  rowAmount: { fontSize: 18, fontWeight: '700', color: '#111' },
  rowDesc: { fontSize: 13, color: '#666', marginTop: 2 },
  rowDate: { fontSize: 12, color: '#aaa', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 48, fontSize: 15 },
});

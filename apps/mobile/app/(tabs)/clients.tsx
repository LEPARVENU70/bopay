import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, SafeAreaView, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { customersApi } from '../../services/api';

function initials(c: any) {
  const f = c.firstName?.[0] || '';
  const l = c.lastName?.[0] || '';
  return (f + l).toUpperCase() || c.email?.[0]?.toUpperCase() || '?';
}

export default function ClientsScreen() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const load = async (p = 1) => {
    try {
      const data = await customersApi.list(p);
      if (p === 1) setCustomers(data.data);
      else setCustomers(prev => [...prev, ...data.data]);
      setHasMore(p < data.lastPage);
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      c.email?.toLowerCase().includes(q) ||
      c.firstName?.toLowerCase().includes(q) ||
      c.lastName?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Clients</Text>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Rechercher..."
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(1)} />}
        onEndReached={() => !search && hasMore && load(page + 1)}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push(`/client/${item.id}`)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(item)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>
                {item.firstName || item.lastName
                  ? `${item.firstName || ''} ${item.lastName || ''}`.trim()
                  : item.email || 'Client anonyme'}
              </Text>
              {item.email && (item.firstName || item.lastName) && (
                <Text style={styles.email}>{item.email}</Text>
              )}
              <Text style={styles.stats}>
                {item.totalVisits} visite{item.totalVisits !== 1 ? 's' : ''}
                {item.lastVisitAt
                  ? ` · ${new Date(item.lastVisitAt).toLocaleDateString('fr-FR')}`
                  : ''}
              </Text>
            </View>
            <Text style={styles.amount}>
              {(Number(item.totalSpent) / 100).toFixed(2)} €
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {search ? 'Aucun résultat' : 'Aucun client pour l\'instant'}
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 28, fontWeight: '800', color: '#111', padding: 24, paddingBottom: 12 },
  searchWrap: { paddingHorizontal: 24, marginBottom: 8 },
  search: {
    backgroundColor: '#f5f5f5', borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 10, fontSize: 15, color: '#111',
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#EDE9FF',
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  avatarText: { color: '#6C47FF', fontWeight: '700', fontSize: 15 },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#111' },
  email: { fontSize: 12, color: '#888', marginTop: 1 },
  stats: { fontSize: 12, color: '#aaa', marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700', color: '#6C47FF' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 48, fontSize: 15 },
});

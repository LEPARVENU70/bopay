import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, SafeAreaView, Dimensions,
} from 'react-native';
import { statsApi } from '../../services/api';

const SCREEN_W = Dimensions.get('window').width;
const BAR_AREA_W = SCREEN_W - 48;

export default function StatsScreen() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await statsApi.get();
      setStats(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const fmt = (cents: number) => (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const maxAmount = stats ? Math.max(...stats.chart.map((d: any) => d.amount), 1) : 1;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <Text style={styles.header}>Statistiques</Text>

        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, { flex: 1 }]}>
            <Text style={styles.kpiLabel}>Aujourd'hui</Text>
            <Text style={styles.kpiValue}>{fmt(stats?.today?.amount ?? 0)} €</Text>
            <Text style={styles.kpiSub}>{stats?.today?.count ?? 0} paiement{stats?.today?.count !== 1 ? 's' : ''}</Text>
          </View>
          <View style={[styles.kpiCard, { flex: 1 }]}>
            <Text style={styles.kpiLabel}>Ce mois</Text>
            <Text style={styles.kpiValue}>{fmt(stats?.month?.amount ?? 0)} €</Text>
            <Text style={styles.kpiSub}>{stats?.month?.count ?? 0} paiement{stats?.month?.count !== 1 ? 's' : ''}</Text>
          </View>
        </View>

        <View style={styles.kpiRow}>
          <View style={[styles.kpiCard, styles.kpiAccent, { flex: 1 }]}>
            <Text style={[styles.kpiLabel, { color: '#fff' }]}>Ticket moyen</Text>
            <Text style={[styles.kpiValue, { color: '#fff' }]}>{fmt(stats?.average ?? 0)} €</Text>
          </View>
          <View style={[styles.kpiCard, { flex: 1 }]}>
            <Text style={styles.kpiLabel}>Taux succès</Text>
            <Text style={styles.kpiValue}>{stats?.successRate ?? 100}%</Text>
          </View>
        </View>

        {/* Bar chart 7 jours */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Revenus — 7 derniers jours</Text>
          <Text style={styles.chartSub}>Cette semaine : {fmt(stats?.week?.amount ?? 0)} €</Text>

          <View style={styles.chart}>
            {(stats?.chart ?? []).map((day: any, i: number) => {
              const heightPct = maxAmount > 0 ? day.amount / maxAmount : 0;
              const barH = Math.max(heightPct * 120, day.amount > 0 ? 4 : 2);
              const isToday = i === 6;
              return (
                <View key={i} style={styles.barCol}>
                  {day.amount > 0 && (
                    <Text style={styles.barLabel}>{fmt(day.amount).split(',')[0]}</Text>
                  )}
                  <View
                    style={[
                      styles.bar,
                      { height: barH, backgroundColor: isToday ? '#6C47FF' : '#C4B5FD' },
                    ]}
                  />
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelActive]}>
                    {day.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24, paddingBottom: 40 },
  header: { fontSize: 28, fontWeight: '800', color: '#111', marginBottom: 20 },
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  kpiCard: {
    backgroundColor: '#F8F7FF', borderRadius: 16, padding: 18,
  },
  kpiAccent: { backgroundColor: '#6C47FF' },
  kpiLabel: { fontSize: 12, color: '#888', fontWeight: '600', marginBottom: 4 },
  kpiValue: { fontSize: 22, fontWeight: '800', color: '#111' },
  kpiSub: { fontSize: 11, color: '#aaa', marginTop: 4 },
  chartCard: {
    backgroundColor: '#F8F7FF', borderRadius: 16, padding: 20, marginTop: 4,
  },
  chartTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 2 },
  chartSub: { fontSize: 12, color: '#888', marginBottom: 20 },
  chart: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    height: 160,
  },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '60%', borderRadius: 4, minHeight: 2 },
  barLabel: { fontSize: 9, color: '#6C47FF', fontWeight: '600', marginBottom: 3 },
  dayLabel: { fontSize: 11, color: '#aaa', marginTop: 6 },
  dayLabelActive: { color: '#6C47FF', fontWeight: '700' },
});

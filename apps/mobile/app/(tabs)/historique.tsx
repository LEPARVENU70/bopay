import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, SafeAreaView, Alert, TextInput, Modal, ActivityIndicator
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
  const [invoiceModal, setInvoiceModal] = useState<{ visible: boolean; paymentId: string } | null>(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

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

  const handleSendInvoice = async () => {
    if (!email.trim() || !invoiceModal) return;
    setSending(true);
    try {
      await paymentsApi.sendInvoice(invoiceModal.paymentId, email.trim());
      setInvoiceModal(null);
      setEmail('');
      Alert.alert('Reçu envoyé', `Le reçu a été envoyé à ${email.trim()}`);
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible d\'envoyer le reçu');
    } finally {
      setSending(false);
    }
  };

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

      <Modal visible={!!invoiceModal?.visible} transparent animationType="fade" onRequestClose={() => setInvoiceModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Envoyer le reçu</Text>
            <Text style={styles.modalSub}>Entrez l'email du client</Text>
            <TextInput
              style={styles.input}
              placeholder="client@exemple.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!email.trim() || sending) && { opacity: 0.5 }]}
              onPress={handleSendInvoice}
              disabled={!email.trim() || sending}
            >
              {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendBtnText}>Envoyer</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setInvoiceModal(null); setEmail(''); }}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              <View style={styles.rowRight}>
              <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
                <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
              </View>
              {item.status === 'succeeded' && (
                <TouchableOpacity
                  style={styles.receiptBtn}
                  onPress={() => { setEmail(''); setInvoiceModal({ visible: true, paymentId: item.id }); }}
                >
                  <Text style={styles.receiptBtnText}>Reçu</Text>
                </TouchableOpacity>
              )}
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
  rowRight: { alignItems: 'flex-end', gap: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '600' },
  receiptBtn: { backgroundColor: '#6C47FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  receiptBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 48, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 20, padding: 28, width: '85%', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#111', marginBottom: 4 },
  modalSub: { fontSize: 14, color: '#666', marginBottom: 20 },
  input: {
    width: '100%', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    padding: 14, fontSize: 15, marginBottom: 16, color: '#111',
  },
  sendBtn: { backgroundColor: '#6C47FF', borderRadius: 12, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: 12 },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelText: { color: '#888', fontSize: 14 },
});

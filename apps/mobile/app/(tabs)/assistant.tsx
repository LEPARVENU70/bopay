import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { aiApi } from '../../services/api';

type Message = { id: string; role: 'user' | 'assistant'; text: string };

const SUGGESTIONS = [
  'Combien j\'ai encaissé aujourd\'hui ?',
  'Quel est mon ticket moyen ?',
  'Comment améliorer mes ventes ?',
  'Qui sont mes meilleurs clients ?',
];

let msgId = 0;
const uid = () => String(++msgId);

export default function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([
    { id: uid(), role: 'assistant', text: 'Bonjour ! Je suis votre assistant Bopay. Posez-moi une question sur votre activité.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;

    setInput('');
    setMessages(prev => [...prev, { id: uid(), role: 'user', text: msg }]);
    setLoading(true);

    try {
      const { reply } = await aiApi.chat(msg);
      setMessages(prev => [...prev, { id: uid(), role: 'assistant', text: reply }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { id: uid(), role: 'assistant', text: 'Désolé, une erreur est survenue. Réessayez.' }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const showSuggestions = messages.length === 1;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Assistant IA</Text>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
              <Text style={[styles.bubbleText, item.role === 'user' && styles.userText]}>
                {item.text}
              </Text>
            </View>
          )}
          ListFooterComponent={loading ? (
            <View style={[styles.bubble, styles.aiBubble]}>
              <ActivityIndicator size="small" color="#6C47FF" />
            </View>
          ) : null}
        />

        {showSuggestions && (
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((s, i) => (
              <TouchableOpacity key={i} style={styles.suggestion} onPress={() => send(s)}>
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Posez votre question..."
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
            onPress={() => send(input)}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 28, fontWeight: '800', color: '#111', padding: 24, paddingBottom: 8 },
  list: { padding: 16, paddingBottom: 8 },
  bubble: {
    maxWidth: '82%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 10,
  },
  aiBubble: { backgroundColor: '#F0ECFF', alignSelf: 'flex-start' },
  userBubble: { backgroundColor: '#6C47FF', alignSelf: 'flex-end' },
  bubbleText: { fontSize: 15, color: '#111', lineHeight: 22 },
  userText: { color: '#fff' },
  suggestions: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  suggestion: {
    backgroundColor: '#F8F7FF', borderRadius: 12, paddingHorizontal: 14,
    paddingVertical: 10, borderWidth: 1, borderColor: '#EDE9FF',
  },
  suggestionText: { color: '#6C47FF', fontSize: 13, fontWeight: '500' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#f0f0f0',
  },
  input: {
    flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15,
    maxHeight: 100, color: '#111',
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#6C47FF',
    alignItems: 'center', justifyContent: 'center',
  },
  sendIcon: { color: '#fff', fontSize: 18, fontWeight: '700' },
});

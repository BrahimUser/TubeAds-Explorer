import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import { ChevronRight } from 'lucide-react-native';
import { useAuthUser } from '../hooks/useAuthUser';
import type { RootStackParamList } from '../navigation/types';
import { listenChatThreads } from '../services/chat';
import { colors, radii, shadow, spacing, typography } from '../theme';
import type { ChatThread } from '../types/Commerce';

export function ChatInboxScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user } = useAuthUser();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setThreads([]);
      setLoading(false);
      return;
    }
    const unsub = listenChatThreads(
      (list) => {
        setThreads(list);
        setLoading(false);
      },
      (e) => {
        Alert.alert('Messages', e.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [user?.uid]);

  const openThread = (t: ChatThread) => {
    if (!user?.uid) return;
    const sellerUid = user.uid === t.buyerUid ? t.sellerUid : t.buyerUid;
    navigation.navigate('Chat', { threadId: t.id, adId: t.adId, sellerUid });
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>Sign in to see your messages.</Text>
        <Pressable style={styles.cta} onPress={() => navigation.navigate('Auth', { mode: 'sign-in' })}>
          <Text style={styles.ctaTxt}>Sign in</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.marketplaceOrange} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <FlatList
        style={styles.listFlex}
        data={threads}
        keyExtractor={(t) => t.id}
        contentContainerStyle={threads.length === 0 ? styles.emptyWrap : styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>No conversations yet.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.row, shadow.card]}
            onPress={() => openThread(item)}
          >
            <Image source={{ uri: item.productThumb }} style={styles.thumb} resizeMode="cover" />
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {item.productTitle}
              </Text>
              <Text style={styles.rowSub} numberOfLines={1}>
                {item.lastMessageText || 'Chat'}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.textDim} />
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  listFlex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  hint: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  cta: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.marketplaceOrange,
    borderRadius: radii.md,
  },
  ctaTxt: { ...typography.title, color: '#FFFFFF' },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  emptyWrap: { flexGrow: 1, padding: spacing.lg },
  empty: { ...typography.body, color: colors.textDim, textAlign: 'center', marginTop: spacing.xxl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: { width: 56, height: 56, borderRadius: radii.md },
  rowBody: { flex: 1, gap: 4 },
  rowTitle: { ...typography.title, fontSize: 14, color: colors.marketplaceTitle },
  rowSub: { ...typography.caption, color: colors.textMuted },
});

export default ChatInboxScreen;

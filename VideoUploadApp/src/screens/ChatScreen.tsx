import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { StackScreenProps } from '@react-navigation/stack';
import { Image as ImageIcon, Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthUser } from '../hooks/useAuthUser';
import type { RootStackParamList } from '../navigation/types';
import {
  getOrCreateChatThread,
  listenThreadMessages,
  sendChatMessage,
} from '../services/chat';
import { getAd } from '../services/listings';
import { colors, radii, shadow, spacing, typography } from '../theme';
import type { Ad } from '../types/Ad';
import type { ChatMessage } from '../types/Commerce';

type Props = StackScreenProps<RootStackParamList, 'Chat'>;

const Bubble = React.memo(function Bubble({
  message,
  isMine,
}: {
  message: ChatMessage;
  isMine: boolean;
}) {
  return (
    <View
      style={[
        styles.bubbleWrap,
        isMine ? styles.bubbleMineWrap : styles.bubbleTheirWrap,
      ]}
    >
      <View
        style={[
          styles.bubble,
          shadow.card,
          isMine ? styles.bubbleMine : styles.bubbleTheir,
        ]}
      >
        {message.imageUrl ? (
          <Image source={{ uri: message.imageUrl }} style={styles.bubbleImg} resizeMode="cover" />
        ) : null}
        <Text style={[styles.bubbleTxt, isMine && styles.bubbleTxtMine]}>
          {message.text.trim()}
        </Text>
      </View>
    </View>
  );
});

export function ChatScreen({ navigation, route }: Props) {
  const { adId, threadId: threadIdParam, ad: adSnapshot } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuthUser();
  const [ad, setAd] = useState<Ad | null>(adSnapshot ?? null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(!adSnapshot);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const nearBottomRef = useRef(true);

  useEffect(() => {
    if (!user?.uid) {
      navigation.replace('Auth', { mode: 'sign-in' });
      return;
    }
    let alive = true;
    let unsubMsgs: (() => void) | null = null;
    setLoading(true);
    void (async () => {
      try {
        const doc = adSnapshot ?? (await getAd(adId));
        if (!alive) return;
        if (!doc) {
          Alert.alert('Error', 'Listing not found.');
          setLoading(false);
          return;
        }
        setAd(doc);
        if (threadIdParam) {
          if (!alive) return;
          setThreadId(threadIdParam);
          unsubMsgs = listenThreadMessages(
            threadIdParam,
            (list) => {
              setMessages(list);
              if (nearBottomRef.current) {
                requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
              }
            },
            (e) => Alert.alert('Messages', e.message),
          );
        } else {
          const tid = await getOrCreateChatThread({ ad: doc, buyerUid: user.uid });
          if (!alive) return;
          setThreadId(tid);
          unsubMsgs = listenThreadMessages(
            tid,
            (list) => {
              setMessages(list);
              if (nearBottomRef.current) {
                requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
              }
            },
            (e) => Alert.alert('Messages', e.message),
          );
        }
      } catch (e) {
        if (alive) Alert.alert('Messages', String((e as Error)?.message ?? e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      unsubMsgs?.();
    };
  }, [adId, user?.uid, navigation, threadIdParam, adSnapshot]);

  const uid = user?.uid;

  const onSend = useCallback(async () => {
    if (!threadId || !text.trim() || sending) return;
    setSending(true);
    try {
      await sendChatMessage(threadId, text);
      setText('');
    } catch (e) {
      Alert.alert('Could not send', String((e as Error)?.message ?? e));
    } finally {
      setSending(false);
    }
  }, [threadId, text, sending]);

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => (
      <Bubble message={item} isMine={item.senderUid === uid} />
    ),
    [uid],
  );

  const keyExtractor = useCallback((m: ChatMessage) => m.id, []);

  const onAttach = () => {
    Alert.alert(
      'Attachment',
      'Image uploads will be available via the uploads API in a future update.',
    );
  };

  if (!user) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.marketplaceOrange} />
      </View>
    );
  }

  if (loading || !ad) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.marketplaceOrange} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Pressable
        style={[styles.pinned, shadow.card]}
        onPress={() => navigation.navigate('ProductDetail', { adId: ad.id, ad })}
      >
        <Image source={{ uri: ad.thumbnailUrl }} style={styles.pinnedImg} resizeMode="cover" />
        <View style={styles.pinnedBody}>
          <Text style={styles.pinnedTitle} numberOfLines={2}>
            {ad.title}
          </Text>
          <Text style={styles.pinnedSub} numberOfLines={1}>
            Listing · Tap to open
          </Text>
        </View>
      </Pressable>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
        onScroll={(e) => {
          const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
          nearBottomRef.current =
            contentOffset.y + layoutMeasurement.height >= contentSize.height - 80;
        }}
        scrollEventThrottle={100}
        onContentSizeChange={() => {
          if (nearBottomRef.current) {
            listRef.current?.scrollToEnd({ animated: false });
          }
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>Send a message to the seller.</Text>
        }
      />

      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <Pressable style={styles.attachBtn} onPress={onAttach} accessibilityLabel="Attach image">
          <ImageIcon size={24} color={colors.marketplaceOrange} strokeWidth={2} />
        </Pressable>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={colors.textDim}
          multiline
          maxLength={2000}
        />
        <Pressable
          style={[styles.sendBtn, !text.trim() && { opacity: 0.45 }]}
          onPress={() => void onSend()}
          disabled={!text.trim() || sending}
        >
          <Send size={22} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pinned: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pinnedImg: { width: 72, height: 72 },
  pinnedBody: { flex: 1, padding: spacing.md, justifyContent: 'center', gap: 4 },
  pinnedTitle: { ...typography.title, fontSize: 14, color: colors.marketplaceTitle },
  pinnedSub: { ...typography.caption, color: colors.marketplaceOrange, fontWeight: '600' },
  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  empty: {
    ...typography.caption,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  bubbleWrap: { marginBottom: spacing.sm, maxWidth: '88%' },
  bubbleMineWrap: { alignSelf: 'flex-end' },
  bubbleTheirWrap: { alignSelf: 'flex-start' },
  bubble: {
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderWidth: 1,
  },
  bubbleMine: {
    backgroundColor: colors.marketplaceOrange,
    borderColor: colors.marketplaceOrange,
  },
  bubbleTheir: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  bubbleImg: { width: 200, height: 120, borderRadius: 8, marginBottom: spacing.sm },
  bubbleTxt: { ...typography.body, color: colors.text },
  bubbleTxtMine: { color: '#FFFFFF' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 2,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.bg,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body,
    color: colors.text,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.marketplaceOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    shadowColor: colors.marketplaceOrange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
});

export default ChatScreen;

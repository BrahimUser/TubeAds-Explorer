import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Heart, HeartOff, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { useAuthUser } from '../hooks/useAuthUser';
import {
  listenFavorites,
  removeFavorite,
  type FavoriteItem,
} from '../services/favorites';
import { cityLabel } from '../config/marketplace';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, spacing, typography } from '../theme';
import { formatPriceMad } from '../utils/formatPrice';

type Nav = StackNavigationProp<RootStackParamList>;

const W = Dimensions.get('window').width;
const H_PAD = spacing.lg;
const GRID_GAP = 12;
const CARD_W = (W - H_PAD * 2 - GRID_GAP) / 2;

/**
 * Live grid of the current user's favorited listings.
 *
 * Subscribes to `users/{uid}/favorites` and re-renders whenever the
 * user (un)favorites an ad anywhere else in the app — so swiping the
 * heart on Home immediately reflects here.
 */
export function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { user, initializing } = useAuthUser();
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState<boolean>(!!user);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const unsub = listenFavorites(
      user.uid,
      (next) => {
        setItems(next);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
    return unsub;
  }, [user]);

  if (initializing) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.marketplaceOrange} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Header />
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <Heart size={28} color={colors.marketplaceOrange} strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>Sign in to keep favorites</Text>
          <Text style={styles.emptyBody}>
            Saved listings are private to your account, so you can pick up
            where you left off on any device.
          </Text>
          <Button
            label="Sign in"
            variant="primary"
            size="lg"
            onPress={() => navigation.navigate('Auth', { mode: 'sign-in' })}
            style={styles.signInBtn}
          />
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Header />
        <View style={styles.center}>
          <ActivityIndicator color={colors.marketplaceOrange} size="large" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Header />
        <View style={styles.center}>
          <Text style={styles.errTitle}>Couldn't load favorites</Text>
          <Text style={styles.errBody}>{error}</Text>
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Header />
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <HeartOff size={28} color={colors.textDim} strokeWidth={1.75} />
          </View>
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyBody}>
            Tap the heart on any listing to save it here.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Header count={items.length} />
      <FlatList
        data={items}
        keyExtractor={(it) => it.adId}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <FavoriteCard
            item={item}
            onOpen={() =>
              navigation.navigate('ProductDetail', { adId: item.adId })
            }
            onRemove={() => {
              void removeFavorite(item.adId).catch(() => {});
            }}
          />
        )}
      />
    </View>
  );
}

function Header({ count }: { count?: number }) {
  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Favorites</Text>
      {count != null ? (
        <Text style={styles.headerCount}>
          {count} {count === 1 ? 'item' : 'items'}
        </Text>
      ) : null}
    </View>
  );
}

function FavoriteCard({
  item,
  onOpen,
  onRemove,
}: {
  item: FavoriteItem;
  onOpen: () => void;
  onRemove: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.94 }]}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title}`}
    >
      <View style={styles.thumbWrap}>
        {item.thumbnailUrl ? (
          <Image
            source={{ uri: item.thumbnailUrl }}
            style={styles.thumb}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]} />
        )}
        <Pressable
          hitSlop={12}
          style={styles.removeBtn}
          onPress={onRemove}
          accessibilityLabel="Remove from favorites"
        >
          <Trash2 size={16} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
      </View>
      <View style={styles.body}>
        <Text style={styles.price} numberOfLines={1}>
          {formatPriceMad(item.priceCents, item.currency)}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.city} numberOfLines={1}>
          {cityLabel(item.city)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingVertical: spacing.sm + 2,
  },
  headerTitle: {
    ...typography.display,
    fontSize: 24,
    fontWeight: '800',
    color: colors.marketplaceTitle,
    letterSpacing: -0.4,
  },
  headerCount: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: H_PAD,
    paddingBottom: spacing.xxl,
    gap: GRID_GAP,
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 18,
    color: colors.marketplaceTitle,
  },
  emptyBody: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  signInBtn: { marginTop: spacing.md, alignSelf: 'stretch' },
  errTitle: {
    ...typography.title,
    color: colors.marketplaceTitle,
    fontSize: 16,
  },
  errBody: {
    ...typography.body,
    color: colors.danger,
    textAlign: 'center',
    fontSize: 13,
  },
  card: {
    width: CARD_W,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  thumbWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#0a0a0a',
  },
  thumb: { width: '100%', height: '100%' },
  thumbFallback: { backgroundColor: colors.border },
  removeBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    gap: 2,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.marketplaceOrange,
    letterSpacing: -0.2,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 19,
  },
  city: {
    ...typography.caption,
    color: colors.textDim,
    marginTop: 2,
  },
});

export default FavoritesScreen;

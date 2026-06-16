import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewToken,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { CategoryBar } from '../components/CategoryBar';
import VideoFeedItem from '../components/VideoFeedItem';
import type { RootStackParamList } from '../navigation/types';
import type { CategoryId } from '../config/marketplace';
import { colors, radii, spacing, typography } from '../theme';
import { useAds } from '../hooks/useAds';
import { useAuthUser } from '../hooks/useAuthUser';
import { signOut } from '../services/auth';
import type { Ad } from '../types/Ad';

type Nav = StackNavigationProp<RootStackParamList>;

/** Marketplace title row (Marketplace + account). */
const HOME_APP_BAR_HEIGHT = 44;
/** Horizontal category strip (icons + pills). */
const HOME_CATEGORY_STRIP_HEIGHT = 52;

const VIEWABILITY_CONFIG = {
  itemVisiblePercentThreshold: 80,
};

function initialFor(name: string): string {
  const first = name.trim().split(/\s+|@/).find(Boolean);
  return (first?.[0] ?? '?').toUpperCase();
}

/**
 * Home — vertical feed with chrome (header + categories) above full-width video cards.
 * Videos sit below the category strip (no overlay z-index clash).
 */
export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [categoryFilter, setCategoryFilter] = useState<CategoryId | null>(null);
  const { ads, loading, error, indexBuilding } = useAds({ category: categoryFilter });
  const { user } = useAuthUser();

  const onPressFab = () => {
    if (user) {
      navigation.navigate('PostAd');
    } else {
      navigation.navigate('Auth', { mode: 'sign-in' });
    }
  };

  const windowHeight = Dimensions.get('window').height;

  const topChromeHeight = useMemo(
    () =>
      insets.top +
      spacing.sm +
      HOME_APP_BAR_HEIGHT +
      HOME_CATEGORY_STRIP_HEIGHT +
      StyleSheet.hairlineWidth,
    [insets.top],
  );

  const pageHeight = windowHeight - topChromeHeight;
  const overlayBottom = useMemo(() => insets.bottom + spacing.lg, [insets.bottom]);

  const [activeId, setActiveId] = useState<string | null>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const visible = viewableItems.find((v) => v.isViewable);
      if (visible?.item?.id) {
        setActiveId((visible.item as { id: string }).id);
      }
    },
  ).current;

  const renderItem = useCallback(
    ({ item }: { item: Ad }) => (
      <VideoFeedItem ad={item} isActive={item.id === activeId} height={pageHeight} />
    ),
    [activeId, pageHeight],
  );

  const chrome = (
    <View
      style={[
        styles.chrome,
        {
          paddingTop: insets.top + spacing.sm,
          borderBottomWidth: StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={styles.appBarRow}>
        <Text style={styles.appBarTitle}>Marketplace</Text>
        {user ? (
          <TouchableOpacity
            style={styles.userChip}
            onPress={() => {
              Alert.alert(
                user.email ?? user.displayName ?? 'Signed in',
                'Sign out of this account?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Sign out',
                    style: 'destructive',
                    onPress: () => {
                      void signOut();
                    },
                  },
                ],
              );
            }}
            accessibilityLabel="Account menu"
          >
            <Text style={styles.userChipLabel} numberOfLines={1}>
              {initialFor(user.displayName ?? user.email ?? '?')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.signInPill}
            onPress={() => navigation.navigate('Auth', { mode: 'sign-in' })}
            accessibilityLabel="Sign in"
          >
            <Text style={styles.signInPillLabel}>Sign in</Text>
          </TouchableOpacity>
        )}
      </View>
      <CategoryBar value={categoryFilter} onChange={setCategoryFilter} variant="surface" />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.flex}>
        {chrome}
        <View style={styles.center}>
          <ActivityIndicator color={colors.secondary} size="large" />
          {indexBuilding ? (
            <Text style={styles.loadingHint}>
              Waiting for Firebase to finish building the search index (status: Enabled in the
              console). This screen updates automatically.
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.flex}>
        {chrome}
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Couldn't load feed</Text>
          <Text style={styles.errorBody}>{error.message}</Text>
          <Button
            label="Try again"
            variant="secondary"
            onPress={() => {
              navigation.replace('Main');
            }}
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  if (ads.length === 0) {
    const isFiltered = categoryFilter !== null;
    return (
      <View style={styles.flex}>
        {chrome}
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>
            {isFiltered ? 'No ads in this category' : 'No ads yet'}
          </Text>
          <Text style={styles.emptyBody}>
            {isFiltered
              ? 'Try another category, or be the first to post one here.'
              : user
                ? 'Be the first to post — record a short video and publish your ad.'
                : 'Sign in to post the first ad. Browsing is open to everyone.'}
          </Text>
          <Button
            label={
              isFiltered
                ? 'Show all categories'
                : user
                  ? '+ Post the first ad'
                  : 'Sign in to post'
            }
            onPress={isFiltered ? () => setCategoryFilter(null) : onPressFab}
            style={styles.emptyCTA}
            size="lg"
            variant={isFiltered ? 'secondary' : 'primary'}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      {chrome}
      <FlatList
        style={styles.list}
        data={ads}
        keyExtractor={(a) => a.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        pagingEnabled
        snapToInterval={pageHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: pageHeight,
          offset: pageHeight * index,
          index,
        })}
        viewabilityConfig={VIEWABILITY_CONFIG}
        onViewableItemsChanged={onViewableItemsChanged}
        windowSize={3}
        maxToRenderPerBatch={2}
        initialNumToRender={1}
        removeClippedSubviews
      />

      <TouchableOpacity
        style={[styles.fab, { bottom: overlayBottom }]}
        onPress={onPressFab}
        activeOpacity={0.85}
        accessibilityLabel={user ? 'Post a new ad' : 'Sign in to post'}
      >
        <Text style={styles.fabPlus}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  list: { flex: 1 },
  chrome: {
    backgroundColor: colors.surfaceElevated,
    borderBottomColor: colors.border,
    zIndex: 2,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  appBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    minHeight: HOME_APP_BAR_HEIGHT,
  },
  appBarTitle: {
    ...typography.title,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: colors.text,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.bg,
  },
  emptyTitle: { ...typography.display, color: colors.text },
  emptyBody: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
  emptyCTA: { marginTop: spacing.lg, alignSelf: 'stretch' },
  errorTitle: { ...typography.title, color: colors.danger },
  errorBody: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: { marginTop: spacing.md },
  loadingHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
    marginTop: spacing.sm,
  },
  userChip: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  userChipLabel: {
    ...typography.title,
    color: '#FFFFFF',
    fontSize: 15,
  },
  signInPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
    backgroundColor: colors.secondary,
  },
  signInPillLabel: {
    ...typography.label,
    color: '#FFFFFF',
    fontSize: 12,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.secondaryPressed,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  fabPlus: { color: '#FFF', fontSize: 28, fontWeight: '600', marginTop: -2 },
});

export default HomeScreen;

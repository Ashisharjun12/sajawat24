import { NAV_THEME } from '@/lib/theme';
import { useFocusEffect } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl } from 'react-native';

type RefetchFn = () => Promise<unknown> | unknown;

/**
 * Screen refresh:
 * - Focus (tab / back nav): silent background refetch — no spinner.
 * - Pull down: native spinner until refetch completes.
 */
export function useScreenRefresh(refetch: RefetchFn) {
  const { colorScheme } = useColorScheme();
  const theme = NAV_THEME[colorScheme ?? 'light'];
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        tintColor={theme.colors.primary}
        colors={[theme.colors.primary]}
        progressBackgroundColor={theme.colors.card}
      />
    ),
    [refreshing, onRefresh, theme.colors.card, theme.colors.primary],
  );

  return { refreshing, onRefresh, refreshControl };
}

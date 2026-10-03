import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import { useLayoutEffect } from 'react';

function findTabNavigator(
  navigation: NavigationProp<ParamListBase>,
): NavigationProp<ParamListBase> | undefined {
  let parent = navigation.getParent();
  while (parent) {
    const state = parent.getState();
    if (state?.type === 'tab') return parent;
    parent = parent.getParent();
  }
  return undefined;
}

/** Hides the root bottom tab bar while this screen is mounted (nested stacks under a tab). */
export function useHideTabBarWhileMounted() {
  const navigation = useNavigation();

  useLayoutEffect(() => {
    const tab = findTabNavigator(navigation);
    tab?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      tab?.setOptions({ tabBarStyle: undefined });
    };
  }, [navigation]);
}

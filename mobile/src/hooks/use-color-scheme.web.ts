import { useSyncExternalStore } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

const noop = () => () => {};

/**
 * To support static rendering, report "light" during server rendering and hydration,
 * then the real scheme on the client. useSyncExternalStore does this without setState in an effect.
 */
export function useColorScheme() {
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const colorScheme = useRNColorScheme();
  return hydrated ? colorScheme : 'light';
}

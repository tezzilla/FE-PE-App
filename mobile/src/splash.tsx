import { SplashScreen } from 'expo-router';

import { useSession } from '@/ctx';

SplashScreen.preventAutoHideAsync();

// Keep the splash screen up until we know whether a saved session exists.
export function SplashScreenController() {
  const { isLoading } = useSession();
  if (!isLoading) SplashScreen.hide();
  return null;
}

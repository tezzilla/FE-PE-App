import { Stack } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';

export default function AppLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.background },
      }}>
      <Stack.Screen name="index" options={{ title: 'CivilPrep' }} />
      <Stack.Screen name="exam/[id]" options={{ title: '' }} />
      <Stack.Screen name="practice" options={{ title: 'Practice' }} />
      <Stack.Screen name="flashcards" options={{ title: 'Flashcards' }} />
      <Stack.Screen name="topic" options={{ title: 'Topic review' }} />
      <Stack.Screen name="resources" options={{ title: 'Exam documents' }} />
      <Stack.Screen name="delete-account" options={{ title: 'Delete account' }} />
    </Stack>
  );
}

import { Stack } from 'expo-router';

import { ExamProvider } from '@/exam-ctx';
import { useTheme } from '@/hooks/use-theme';

export default function AppLayout() {
  const theme = useTheme();
  return (
    <ExamProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerShadowVisible: false,
          headerBackTitle: 'Back',
          contentStyle: { backgroundColor: theme.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="practice" options={{ title: 'Practice' }} />
        <Stack.Screen name="flashcards" options={{ title: 'Flashcards' }} />
        <Stack.Screen name="topic" options={{ title: 'Review notes' }} />
        <Stack.Screen name="module" options={{ title: 'PE module' }} />
        <Stack.Screen name="resources" options={{ title: 'Exam documents' }} />
        <Stack.Screen name="plan" options={{ title: 'Study plan' }} />
        <Stack.Screen name="learn" options={{ title: 'Formula guides' }} />
        <Stack.Screen name="guide" options={{ title: 'Formula guide' }} />
        <Stack.Screen name="handbook-drill" options={{ title: 'Handbook hunt' }} />
        <Stack.Screen name="redeem" options={{ title: 'Redeem a gift' }} />
        <Stack.Screen name="delete-account" options={{ title: 'Delete account' }} />
      </Stack>
    </ExamProvider>
  );
}

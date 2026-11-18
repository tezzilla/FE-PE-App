import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { ExamSwitcher } from '@/components/nav';
import { useExam } from '@/exam-ctx';

import { useTheme } from '@/hooks/use-theme';

const headerSwitcher = () => <ExamSwitcher compact />;

export default function TabLayout() {
  const theme = useTheme();
  // Headers name the exam, so every tab says which exam you're looking at.
  const { exam } = useExam();
  const short = exam === 'pe-civil' ? 'PE' : 'FE';
  const icon = (name: React.ComponentProps<typeof Ionicons>['name']) =>
    function TabIcon({ color, size }: { color: unknown; size: number }) {
      return <Ionicons name={name} size={size} color={String(color)} />;
    };
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.backgroundElement, borderTopColor: theme.border },
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.text,
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: theme.background },
      }}>
      <Tabs.Screen name="index" options={{ headerRight: headerSwitcher, title: 'Home', headerTitle: 'CivilPrep', tabBarIcon: icon('home-outline'), tabBarButtonTestID: 'tab-home' }} />
      <Tabs.Screen name="study" options={{ headerRight: headerSwitcher, title: 'Practice', headerTitle: `${short} practice`, tabBarIcon: icon('school-outline'), tabBarButtonTestID: 'tab-study' }} />
      <Tabs.Screen name="topics" options={{ headerRight: headerSwitcher, title: 'Topics', headerTitle: exam === 'pe-civil' ? 'PE modules' : 'FE topics', tabBarIcon: icon('library-outline'), tabBarButtonTestID: 'tab-topics' }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: icon('person-circle-outline'), tabBarButtonTestID: 'tab-account' }} />
    </Tabs>
  );
}

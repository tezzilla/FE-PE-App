import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { ExamSwitcher } from '@/components/nav';

import { useTheme } from '@/hooks/use-theme';

const headerSwitcher = () => <ExamSwitcher compact />;

export default function TabLayout() {
  const theme = useTheme();
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
      <Tabs.Screen name="study" options={{ headerRight: headerSwitcher, title: 'Practice', tabBarIcon: icon('school-outline'), tabBarButtonTestID: 'tab-study' }} />
      <Tabs.Screen name="topics" options={{ headerRight: headerSwitcher, title: 'Topics', tabBarIcon: icon('library-outline'), tabBarButtonTestID: 'tab-topics' }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: icon('person-circle-outline'), tabBarButtonTestID: 'tab-account' }} />
    </Tabs>
  );
}

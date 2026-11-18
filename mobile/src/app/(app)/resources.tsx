import * as WebBrowser from 'expo-web-browser';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, ErrorView, Loading, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useLoad } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';
import { api, type ExamId } from '@/lib/api';

/** Premium: official exam documents and design standards, marked free or purchase. */
export default function Resources() {
  const { exam } = useLocalSearchParams<{ exam: ExamId }>();
  const theme = useTheme();
  const { data, error, reload } = useLoad((t) => api.resources(t, exam), { reloadOnFocus: false });

  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return <Loading />;

  if (!data.access) {
    return (
      <Screen>
        <Card>
          <ThemedText type="subtitle">🔒 Premium feature</ThemedText>
          <ThemedText>
            {data.summary.links} curated links: {data.summary.sections.map((s) => s.replace('Design standards: ', '')).join(', ')}.
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Includes which design standards you can download free and which you'd need to buy. Available with a subscription
            or pass for this exam.
          </ThemedText>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <ThemedText type="small" themeColor="textSecondary">
        Links go to NCEES, publishers and government sites. Checked {data.checked}; the NCEES exam page is always the final word.
      </ThemedText>
      {data.sections.map((s) => (
        <View key={s.id} style={{ gap: Spacing.one }}>
          <ThemedText type="smallBold" style={{ marginTop: Spacing.two }}>
            {s.title}
            {s.depth ? '  · your depth module' : ''}
          </ThemedText>
          {s.intro && <ThemedText type="small" themeColor="textSecondary">{s.intro}</ThemedText>}
          {s.links.map((l) => (
            <Pressable key={l.title} accessibilityRole="link" onPress={() => WebBrowser.openBrowserAsync(l.url)}>
              <Card>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two }}>
                  <ThemedText style={{ flex: 1, color: theme.brand }}>{l.title} ↗</ThemedText>
                  {l.cost && (
                    <ThemedText type="smallBold" style={{ color: l.cost === 'free' ? theme.good : theme.textSecondary }}>
                      {l.cost === 'free' ? 'Free' : 'Purchase'}
                    </ThemedText>
                  )}
                </View>
                {l.note && <ThemedText type="small" themeColor="textSecondary">{l.note}</ThemedText>}
              </Card>
            </Pressable>
          ))}
        </View>
      ))}
    </Screen>
  );
}

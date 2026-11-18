import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, ErrorView, Loading, ProgressBar, Screen } from '@/components/ui';
import { masteryColor, Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import { useLoad } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';

/** One PE Civil module exam: every NCEES knowledge area, its sub-topics, progress, and area practice. */
export default function ModuleScreen() {
  const { module } = useLocalSearchParams<{ module: string }>();
  const { token } = useSession();
  const theme = useTheme();
  const { data, error, reload } = useLoad((t) => api.peModule(t, module));
  const [open, setOpen] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return <Loading />;

  const makeMine = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await api.setPeModule(token, data.module);
      reload();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: data.name }} />
      <View style={{ gap: Spacing.one }}>
        <ThemedText type="small" themeColor="textSecondary">
          80 questions in 9 hours with the PE Civil Reference Handbook and this module&apos;s design standards. NCEES
          knowledge areas effective {data.effective}.
        </ThemedText>
        {data.isMine ? (
          <ThemedText type="smallBold" style={{ color: theme.good }} testID="module-mine">
            ✓ Your PE exam. Smart practice and readiness follow this blueprint.
          </ThemedText>
        ) : (
          <Button title="This is my exam" onPress={makeMine} loading={saving} testID="module-set" />
        )}
        <Button
          variant="ghost"
          title="Key formulas and worked example"
          onPress={() => router.push({ pathname: '/topic', params: { exam: 'pe-civil', topic: data.module } })}
        />
      </View>

      {data.areas.map((a) => {
        const count = a.fixed + a.calc;
        const expanded = open === a.n;
        return (
          <Card key={a.n}>
            <View style={{ gap: 4 }}>
              <ThemedText type="smallBold" testID={`area-${a.n}`}>
                {a.n}. {a.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {a.questions} questions · about {a.share}% of the exam
              </ThemedText>
            </View>

            {expanded ? (
              <View style={{ gap: 2 }}>
                {a.items.map((it, i) => (
                  <ThemedText key={it} type="small">
                    {String.fromCharCode(65 + i)}. {it}
                  </ThemedText>
                ))}
              </View>
            ) : null}
            <ThemedText
              type="small"
              style={{ color: theme.brand }}
              onPress={() => setOpen(expanded ? null : a.n)}
              accessibilityRole="button">
              {expanded ? 'Hide sub-topics' : `Show ${a.items.length} sub-topics`}
            </ThemedText>

            {a.seen > 0 && (
              <View style={{ gap: 4 }}>
                <ThemedText type="small" themeColor="textSecondary">
                  Practiced {a.seen} of {a.total} · {Math.round((100 * a.right) / a.seen)}% right last time
                </ThemedText>
                <ProgressBar value={a.right / a.seen} color={masteryColor(a.right / a.seen, theme)} />
              </View>
            )}
            <ThemedText type="small" themeColor="textSecondary">
              {a.fixed} question{a.fixed === 1 ? '' : 's'}
              {a.calc ? ` + ${a.calc} calculation problem${a.calc === 1 ? '' : 's'} that never repeat` : ''}
              {!data.access && count > 0 ? ` · ${a.free} free` : ''}
              {count < 3 ? ' · more coming' : ''}
            </ThemedText>
            {count > 0 && (
              <Button
                variant="ghost"
                title="Practice this area"
                testID={`practice-area-${a.n}`}
                onPress={() =>
                  router.push({
                    pathname: '/practice',
                    params: { exam: 'pe-civil', mode: 'area', topic: data.module, area: String(a.n) },
                  })
                }
              />
            )}
          </Card>
        );
      })}

      <ThemedText type="small" themeColor="textSecondary">
        Knowledge area names, question ranges and sub-topics are from the NCEES PE Civil: {data.name} exam
        specification. Check ncees.org for the current version before your exam.
      </ThemedText>
    </Screen>
  );
}

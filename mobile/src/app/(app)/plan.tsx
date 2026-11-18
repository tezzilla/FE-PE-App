import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button, Card, ErrorView, Loading, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useSession } from '@/ctx';
import { useExam } from '@/exam-ctx';
import { useLoad } from '@/hooks/use-load';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';

// Set or change the exam date and weekly hours, right in the app. The server turns them into a weekly
// question target, focus topics and full-exam dates, shown on Home.

const DAY = 24 * 3600 * 1000;
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function PlanScreen() {
  const { exam: examId } = useExam();
  const { token } = useSession();
  const theme = useTheme();
  const { data, error, reload } = useLoad(api.home, { reloadOnFocus: false });
  const exam = data?.exams.find((e) => e.id === examId);
  const saved = exam?.plan;

  const [picked, setPicked] = useState<string | null>(null);
  const [hours, setHours] = useState<number | null>(null);
  const [month, setMonth] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data || !exam) return <Loading />;

  const date = picked ?? (saved ? saved.examDate.slice(0, 10) : null);
  const weekly = hours ?? saved?.weeklyHours ?? 10;
  const today = new Date(new Date().toDateString());
  const shown = month ?? (date ? new Date(`${date}T12:00:00`) : new Date(today.getTime() + 90 * DAY));
  const first = new Date(shown.getFullYear(), shown.getMonth(), 1);
  const days = new Date(shown.getFullYear(), shown.getMonth() + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const minMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const maxDate = new Date(today.getTime() + 2 * 365 * DAY);
  const shift = (n: number) => setMonth(new Date(shown.getFullYear(), shown.getMonth() + n, 1));
  const weeksLeft = date ? Math.max(0, Math.round((new Date(`${date}T12:00:00`).getTime() - today.getTime()) / (7 * DAY))) : null;

  const save = async () => {
    if (!token || !date) return;
    setBusy(true);
    setMsg(null);
    try {
      await api.savePlan(token, exam.id, date, weekly);
      router.back();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!token) return;
    setBusy(true);
    try {
      await api.deletePlan(token, exam.id);
      router.back();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Stack.Screen options={{ title: `${exam.id === 'pe-civil' ? 'PE' : 'FE'} study plan` }} />
      <ThemedText type="small" themeColor="textSecondary">
        Pick your {exam.name} exam date and how many hours a week you can study. You&apos;ll get a weekly question
        target, focus topics and when to take full practice exams.
      </ThemedText>

      <Card>
        <View style={styles.monthRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            disabled={first <= minMonth}
            onPress={() => shift(-1)}
            hitSlop={12}
            style={{ opacity: first <= minMonth ? 0.3 : 1 }}>
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </Pressable>
          <ThemedText type="smallBold" testID="plan-month">{MONTHS[shown.getMonth()]} {shown.getFullYear()}</ThemedText>
          <Pressable accessibilityRole="button" accessibilityLabel="Next month" onPress={() => shift(1)} hitSlop={12}>
            <Ionicons name="chevron-forward" size={22} color={theme.text} />
          </Pressable>
        </View>
        <View style={styles.grid}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <View key={`h${i}`} style={styles.cell}>
              <ThemedText type="small" themeColor="textSecondary">{d}</ThemedText>
            </View>
          ))}
          {cells.map((d, i) => {
            if (!d) return <View key={`e${i}`} style={styles.cell} />;
            const value = new Date(shown.getFullYear(), shown.getMonth(), d);
            const key = iso(value);
            const off = value <= today || value > maxDate;
            const on = key === date;
            return (
              <View key={key} style={styles.cell}>
                <Pressable
                  testID={`day-${key}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${MONTHS[value.getMonth()]} ${d}`}
                  accessibilityState={{ selected: on, disabled: off }}
                  disabled={off}
                  onPress={() => setPicked(key)}
                  style={[styles.day, on && { backgroundColor: theme.brand }]}>
                  <ThemedText style={{ color: on ? theme.onBrand : off ? theme.textSecondary : theme.text, opacity: off ? 0.4 : 1, fontWeight: on ? 700 : 400 }}>
                    {d}
                  </ThemedText>
                </Pressable>
              </View>
            );
          })}
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
          {date
            ? `Exam on ${new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })} · ${weeksLeft} week${weeksLeft === 1 ? '' : 's'} away`
            : 'Tap your exam date'}
        </ThemedText>
      </Card>

      <Card>
        <ThemedText type="smallBold">Study hours per week</ThemedText>
        <View style={styles.hoursRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Fewer hours" onPress={() => setHours(Math.max(1, weekly - 1))} style={[styles.step, { borderColor: theme.border }]}>
            <Ionicons name="remove" size={22} color={theme.text} />
          </Pressable>
          <ThemedText testID="plan-hours" style={{ fontSize: 28, fontWeight: 800, minWidth: 64, textAlign: 'center' }}>{weekly}</ThemedText>
          <Pressable accessibilityRole="button" accessibilityLabel="More hours" onPress={() => setHours(Math.min(60, weekly + 1))} style={[styles.step, { borderColor: theme.border }]}>
            <Ionicons name="add" size={22} color={theme.text} />
          </Pressable>
        </View>
        <View style={styles.presets}>
          {[5, 10, 15, 20].map((h) => (
            <Pressable
              key={h}
              accessibilityRole="button"
              onPress={() => setHours(h)}
              style={[styles.chip, { borderColor: h === weekly ? theme.brand : theme.border, backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small">{h} h</ThemedText>
            </Pressable>
          ))}
        </View>
      </Card>

      {msg && <ThemedText type="small" style={{ color: theme.bad }}>{msg}</ThemedText>}
      <Button title={saved ? 'Update my plan' : 'Create my plan'} onPress={save} disabled={!date} loading={busy} testID="plan-save" />
      {saved && <Button variant="ghost" title="Remove plan" onPress={remove} testID="plan-remove" />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 },
  day: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  hoursRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  step: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  presets: { flexDirection: 'row', gap: Spacing.two, justifyContent: 'center' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
});

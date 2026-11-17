import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Card } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Feedback, Question } from '@/lib/api';

const LETTERS = 'ABCD';

export function QuestionView({
  question,
  selected,
  onSelect,
  feedback,
}: {
  question: Question;
  selected: number | null;
  onSelect: (i: number) => void;
  feedback: Feedback | null;
}) {
  const theme = useTheme();
  return (
    <Card>
      <ThemedText style={styles.prompt} testID="question-prompt">
        {question.prompt}
      </ThemedText>
      <View style={{ gap: Spacing.two }}>
        {question.choices.map((c, i) => {
          let border: string = theme.border;
          if (feedback) {
            if (i === feedback.answer) border = theme.good;
            else if (i === selected) border = theme.bad;
          } else if (i === selected) border = theme.brand;
          return (
            <Pressable
              key={i}
              testID={`choice-${i}`}
              accessibilityRole="radio"
              accessibilityState={{ selected: i === selected, disabled: !!feedback }}
              disabled={!!feedback}
              onPress={() => onSelect(i)}
              style={[styles.choice, { borderColor: border }]}>
              <ThemedText type="smallBold" style={{ width: 22 }}>
                {LETTERS[i] ?? i + 1}.
              </ThemedText>
              <ThemedText style={{ flex: 1 }}>{c}</ThemedText>
            </Pressable>
          );
        })}
      </View>
      {feedback && (
        <View
          testID="feedback"
          style={[styles.feedback, { backgroundColor: (feedback.correct ? theme.good : theme.bad) + '22' }]}>
          <ThemedText type="smallBold" style={{ fontSize: 16 }}>
            {feedback.correct ? 'Correct' : `Incorrect. Answer: ${LETTERS[feedback.answer]}`}
          </ThemedText>
          <ThemedText>{feedback.explanation}</ThemedText>
          {feedback.reference && (
            <ThemedText type="small" themeColor="textSecondary">
              Reference: {feedback.reference}
            </ThemedText>
          )}
          {feedback.reviewedBy && (
            <ThemedText type="small" themeColor="textSecondary">
              Problem type reviewed by {feedback.reviewedBy}
            </ThemedText>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  prompt: { fontSize: 18, lineHeight: 27 },
  choice: { flexDirection: 'row', borderWidth: 2, borderRadius: 10, padding: Spacing.three, gap: Spacing.two },
  feedback: { borderRadius: 10, padding: Spacing.three, gap: Spacing.two },
});

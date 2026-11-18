import { router } from 'expo-router';

import { ListGroup, ListRow } from '@/components/nav';
import { ThemedText } from '@/components/themed-text';
import { ErrorView, Loading, Screen } from '@/components/ui';
import { useLoad } from '@/hooks/use-load';
import { api, type GuideSummary } from '@/lib/api';

/** Formula guides, grouped by topic. Each opens a guide with variables, mistakes and a worked example. */
export default function Learn() {
  const { data, error, reload } = useLoad(api.guides, { reloadOnFocus: false });
  if (error && !data) return <ErrorView message={error} onRetry={reload} />;
  if (!data) return <Loading />;

  const groups = new Map<string, GuideSummary[]>();
  for (const g of data.guides) groups.set(g.group, [...(groups.get(g.group) ?? []), g]);

  return (
    <Screen>
      <ThemedText type="small" themeColor="textSecondary">
        The formulas that show up most on the FE and PE Civil: what each one means, when to use it, the mistakes that
        cost points, and where it is in the handbook.
      </ThemedText>
      {[...groups].map(([group, list]) => (
        <ListGroup key={group} title={group}>
          {list.map((g) => (
            <ListRow
              key={g.slug}
              icon="calculator-outline"
              title={g.title}
              subtitle={g.summary}
              testID={`guide-${g.slug}`}
              onPress={() => router.push({ pathname: '/guide', params: { slug: g.slug } })}
            />
          ))}
        </ListGroup>
      ))}
    </Screen>
  );
}

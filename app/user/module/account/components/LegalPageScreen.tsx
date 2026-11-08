import { Button } from '@/components/ui/button';
import { MarkdownText } from '@/components/ui/markdown-text';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { AccountSubScreen } from '@/module/account/components/AccountSubScreen';
import { useLegalPageQuery } from '@/module/account/hooks/use-legal-page-query';
import { legalPageDef } from '@/module/account/lib/legal-pages';
import { format } from 'date-fns';
import { View } from 'react-native';

/** Privacy policy / Terms / Refund policy, loaded from the CMS page the admin published. */
export function LegalPageScreen({ doc }: { doc?: string }) {
  const def = legalPageDef(doc);
  const { data: page, isPending, isError, refetch, isRefetching } = useLegalPageQuery(def);

  const title = page?.title?.trim() || def?.title || 'Policy';
  const updated = page?.updatedAt ? format(new Date(page.updatedAt), 'd MMM yyyy') : null;

  return (
    <AccountSubScreen title={title}>
      {!def ? (
        <Text className="text-muted-foreground text-sm">This page does not exist.</Text>
      ) : isPending ? (
        <View className="gap-3">
          <Skeleton className="h-5 w-2/3 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-4/5 rounded-md" />
        </View>
      ) : isError ? (
        <View className="items-start gap-3">
          <Text className="text-muted-foreground text-sm">
            Couldn&apos;t load this page. Check your connection and try again.
          </Text>
          <Button size="sm" variant="secondary" onPress={() => void refetch()} loading={isRefetching}>
            <Text>Try again</Text>
          </Button>
        </View>
      ) : !page ? (
        <Text className="text-muted-foreground text-sm">
          This page isn&apos;t published yet. Please check back soon.
        </Text>
      ) : (
        <View className="gap-4">
          {updated ? (
            <Text className="text-muted-foreground text-xs">Last updated {updated}</Text>
          ) : null}
          <MarkdownText>{page.body}</MarkdownText>
        </View>
      )}
    </AccountSubScreen>
  );
}

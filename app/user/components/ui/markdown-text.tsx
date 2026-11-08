import { Text } from '@/components/ui/text';
import { openCmsLink } from '@/lib/open-cms-link';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { View } from 'react-native';

/**
 * Small Markdown renderer for CMS pages (policies): ## / ### headings, paragraphs,
 * "-" / "*" / "1." lists, **bold**, *italic* and [links](url). Anything else shows as text.
 */

type Block =
  | { kind: 'heading'; level: number; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; ordered: boolean; items: string[] };

function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ kind: 'paragraph', text: paragraph.join(' ') });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push({ kind: 'list', ...list });
    list = null;
  };

  for (const raw of source.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ kind: 'heading', level: heading[1].length, text: heading[2] });
      continue;
    }
    const bullet = /^[-*+]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push((bullet ?? numbered)![1]);
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

/** **bold**, *italic*, [label](url) inside a line. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (token.startsWith('**')) {
      nodes.push(
        <Text key={key} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </Text>,
      );
    } else if (token.startsWith('[')) {
      const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (link) {
        nodes.push(
          <Text
            key={key}
            className="font-medium text-primary underline"
            onPress={() => openCmsLink(link[2])}
            accessibilityRole="link">
            {link[1]}
          </Text>,
        );
      }
    } else {
      nodes.push(
        <Text key={key} className="italic">
          {token.slice(1, -1)}
        </Text>,
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function MarkdownText({ children, className }: { children: string; className?: string }) {
  const blocks = parseBlocks(children ?? '');

  return (
    <View className={cn('gap-3', className)}>
      {blocks.map((block, index) => {
        const key = `md-${index}`;
        if (block.kind === 'heading') {
          return (
            <Text
              key={key}
              className={cn(
                'font-semibold text-foreground',
                block.level <= 2 ? 'mt-2 text-h3' : 'mt-1 text-[15px]',
              )}
              accessibilityRole="header">
              {renderInline(block.text, key)}
            </Text>
          );
        }
        if (block.kind === 'list') {
          return (
            <View key={key} className="gap-1.5">
              {block.items.map((item, itemIndex) => (
                <View key={`${key}-${itemIndex}`} className="flex-row gap-2 pr-2">
                  <Text className="text-muted-foreground text-sm leading-6">
                    {block.ordered ? `${itemIndex + 1}.` : '•'}
                  </Text>
                  <Text className="text-muted-foreground min-w-0 flex-1 text-sm leading-6">
                    {renderInline(item, `${key}-${itemIndex}`)}
                  </Text>
                </View>
              ))}
            </View>
          );
        }
        return (
          <Text key={key} className="text-muted-foreground text-sm leading-6">
            {renderInline(block.text, key)}
          </Text>
        );
      })}
    </View>
  );
}
